import fs from 'node:fs';
import path from 'node:path';

interface DokployProject {
  name: string;
  environments: DokployEnvironment[];
}

interface DokployEnvironment {
  name: string;
  compose: DokployCompose[];
}

interface DokployCompose {
  name: string;
  composeId: string;
}

interface DokployDomain {
  domainId: string;
  host: string;
  path?: string;
}

interface DokployContainer {
  name: string;
  containerId: string;
}

// 1. Read environment variables from .env
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        const val = trimmed.substring(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const DOKPLOY_URL_RAW = process.env.DOKPLOY_URL;
if (!DOKPLOY_URL_RAW) {
  console.error('❌ DOKPLOY_URL is not set in .env or environment variables.');
  process.exit(1);
}
const DOKPLOY_URL = DOKPLOY_URL_RAW.replace(/\/$/, '');

const DOKPLOY_API_KEY = process.env.DOKPLOY_API_KEY;
if (!DOKPLOY_API_KEY) {
  console.error('❌ DOKPLOY_API_KEY is not set in .env or environment variables.');
  process.exit(1);
}

const projectName = process.env.PROJECT_NAME || 'linkedin-parser';
const DOKPLOY_BASE_DOMAIN = process.env.DOKPLOY_BASE_DOMAIN || '.linkedinparser.build.dkoldyaev.com';
const normalizedBase = DOKPLOY_BASE_DOMAIN.startsWith('.') ? DOKPLOY_BASE_DOMAIN : `.${DOKPLOY_BASE_DOMAIN}`;
const projectSlug = projectName.replace(/[^a-zA-Z0-9]/g, '');
const DEV_DOMAIN = normalizedBase.includes(projectSlug)
  ? `dev${normalizedBase}`
  : `dev.${projectSlug}${normalizedBase}`;

async function trpcCall<T = unknown>(endpoint: string, method: 'GET' | 'POST', data?: unknown): Promise<T> {
  let url = `${DOKPLOY_URL}/api/trpc/${endpoint}`;
  const headers: Record<string, string> = {
    'x-api-key': DOKPLOY_API_KEY!,
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (method === 'GET' && data) {
    url += `?input=${encodeURIComponent(JSON.stringify({ json: data }))}`;
  } else if (method === 'POST') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify({ json: data ?? {} });
  }

  const response = await fetch(url, options);
  const json = await response.json();

  if (!response.ok || json.error) {
    const errMsg = json?.error?.json?.message || json?.error?.message || response.statusText;
    throw new Error(`tRPC call failed [${endpoint}]: ${errMsg}`);
  }

  return json.result.data.json;
}

// Update specific key=value lines in .env text while preserving structure
function updateEnvString(currentEnv: string, updates: Record<string, string>): string {
  const lines = currentEnv.split('\n');
  const foundKeys = new Set<string>();

  const updatedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return line;

    const key = trimmed.substring(0, eqIdx).trim();
    if (key in updates) {
      foundKeys.add(key);
      return `${key}=${updates[key]}`;
    }
    return line;
  });

  // Append any keys that were not already present
  for (const [key, val] of Object.entries(updates)) {
    if (!foundKeys.has(key)) {
      updatedLines.push(`${key}=${val}`);
    }
  }

  return updatedLines.join('\n');
}

async function main() {
  console.log(`Connecting to Dokploy at ${DOKPLOY_URL}...`);

  // 1. Find language-cards > dev > app compose
  console.log('Fetching projects to locate dev compose service...');
  const projects = await trpcCall<DokployProject[]>('project.all', 'GET');
  const project = projects.find((p) => p.name.toLowerCase() === projectName.toLowerCase());
  if (!project) {
    throw new Error(`Project "${projectName}" not found on Dokploy`);
  }

  const devEnv = project.environments.find((e) => e.name === 'dev');
  if (!devEnv) {
    throw new Error(`Environment "dev" not found in project "${projectName}"`);
  }

  const compose = devEnv.compose.find((c) => c.name === 'app');
  if (!compose) {
    throw new Error('Compose service "app" not found in dev environment');
  }

  const composeId = compose.composeId;
  console.log(`✓ Found dev compose: "${compose.name}" (ID: ${composeId})`);

  // 2. Fetch current compose details
  const composeDetails = await trpcCall<any>('compose.one', 'GET', { composeId });
  console.log('composeDetails:', {
    composeId: composeDetails.composeId,
    composePath: composeDetails.composePath,
    composeType: composeDetails.composeType,
    sourceType: composeDetails.sourceType,
    branch: composeDetails.branch,
    repository: composeDetails.repository,
  });
  // 2. Ensure composePath is ./docker-compose.yml
  if (composeDetails.composePath !== './docker-compose.yml') {
    console.log('Updating composePath to ./docker-compose.yml...');
    await trpcCall('compose.update', 'POST', {
      composeId,
      composePath: './docker-compose.yml',
    });
    console.log('✓ composePath set to ./docker-compose.yml');
  }

  const currentEnv = composeDetails.env || '';

  // 3. Update environment variables in Dokploy
  const envUpdates = {
    BASE_DOMAIN: `https://${DEV_DOMAIN}`,
    BASE_CORS_ORIGIN: `https://${DEV_DOMAIN}`,
    FRONTEND_API_BASE_URL: `https://${DEV_DOMAIN}/api/v1`,
    FRONTEND_MERCURE_PUBLIC_URL: `https://${DEV_DOMAIN}/.well-known/mercure`,
    FRONTEND_BASE_DOMAIN: `https://${DEV_DOMAIN}`,
    MERCURE_CORS_ALLOWED_ORIGINS: `https://${DEV_DOMAIN}`,
    BASE_MERCURE_URL: 'http://mercure/.well-known/mercure',
  };

  console.log('\nUpdating dev compose environment variables...');
  for (const [k, v] of Object.entries(envUpdates)) {
    console.log(`  ${k} -> ${v}`);
  }

  const updatedEnv = updateEnvString(currentEnv, envUpdates);
  await trpcCall('compose.saveEnvironment', 'POST', {
    composeId,
    env: updatedEnv,
    createEnvFile: true,
  });
  console.log('✓ Environment variables saved successfully.');

  // 4. Configure Domains
  console.log('\nConfiguring Traefik domain routes...');
  const existingDomains = await trpcCall<DokployDomain[]>('domain.byComposeId', 'GET', { composeId });
  console.log(`Found ${existingDomains.length} existing domain(s) for this compose.`);

  const requiredRoutes = [
    {
      path: '/',
      serviceName: 'frontend',
      port: 5173,
      description: 'Frontend (Vite)',
    },
    {
      path: '/api/v1',
      serviceName: 'app',
      port: 3001,
      description: 'Backend API (Nest/Express)',
    },
    {
      path: '/.well-known/mercure',
      serviceName: 'mercure',
      port: 80,
      description: 'Mercure Hub (SSE)',
    },
  ];

  for (const route of requiredRoutes) {
    const existing = existingDomains.find(
      (d) => d.host === DEV_DOMAIN && (d.path === route.path || (!d.path && route.path === '/'))
    );

    if (existing) {
      console.log(`Updating existing domain for ${route.description} (${route.path} -> ${route.serviceName}:${route.port})...`);
      await trpcCall('domain.update', 'POST', {
        domainId: existing.domainId,
        host: DEV_DOMAIN,
        path: route.path,
        port: route.port,
        serviceName: route.serviceName,
        https: true,
        certificateType: 'letsencrypt',
        domainType: 'compose',
        enabled: true,
        stripPath: false,
      });
      console.log(`✓ Domain updated: ${existing.domainId}`);
    } else {
      console.log(`Creating new domain route for ${route.description} (${route.path} -> ${route.serviceName}:${route.port})...`);
      const newDomain = await trpcCall<{ domainId: string }>('domain.create', 'POST', {
        composeId,
        domainType: 'compose',
        host: DEV_DOMAIN,
        path: route.path,
        port: route.port,
        serviceName: route.serviceName,
        https: true,
        certificateType: 'letsencrypt',
        stripPath: false,
      });
      console.log(`✓ Domain created: ${newDomain?.domainId || 'OK'}`);
    }
  }

  // 5. Check if redeploy requested via argument
  if (process.argv.includes('--deploy')) {
    console.log('\nTriggering redeploy on Dokploy...');
    const deployment = await trpcCall<{ deploymentId: string }>('compose.redeploy', 'POST', {
      composeId,
    });
    console.log(`✓ Deployment triggered: ${deployment?.deploymentId || 'OK'}`);
  }

  // 6. Verify dev environment
  if (process.argv.includes('--check') || !process.argv.includes('--deploy')) {
    console.log('\n--- VERIFYING DEV ENVIRONMENT ---');
    // A. Check Frontend
    try {
      const feRes = await fetch(`https://${DEV_DOMAIN}/`);
      console.log(`Frontend (https://${DEV_DOMAIN}/): ${feRes.status} ${feRes.statusText}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Frontend check failed: ${msg}`);
    }

    // B. Check Mercure CORS preflight
    try {
      const corsRes = await fetch(`https://${DEV_DOMAIN}/.well-known/mercure`, {
        method: 'OPTIONS',
        headers: {
          Origin: `https://${DEV_DOMAIN}`,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization',
        },
      });
      const acao = corsRes.headers.get('access-control-allow-origin');
      const acac = corsRes.headers.get('access-control-allow-credentials');
      console.log(`Mercure OPTIONS preflight: ${corsRes.status}, ACAO: ${acao}, ACAC: ${acac}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Mercure CORS preflight check failed: ${msg}`);
    }

    // C. Test Backend Auth & State Sync (Mercure publish)
    try {
      const crypto = await import('node:crypto');
      const testUsername = `dev_verify_${Date.now()}`;
      // Register test user
      const regRes = await fetch(`https://${DEV_DOMAIN}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: testUsername }),
      });
      const regData = await regRes.json();
      if (!regRes.ok || !regData.token) {
        throw new Error(`Register failed (${regRes.status}): ${JSON.stringify(regData)}`);
      }
      console.log(`✓ Test user registered: ${testUsername} (ID: ${regData.user.id})`);

      // Sync state (which triggers Mercure publish)
      const syncRes = await fetch(`https://${DEV_DOMAIN}/api/v1/state/sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${regData.token}`,
          'Content-Type': 'application/json',
        },
      });
      const syncData = await syncRes.json();
      if (!syncRes.ok) {
        throw new Error(`State sync failed (${syncRes.status}): ${JSON.stringify(syncData)}`);
      }
      console.log(`✓ State sync succeeded: ${syncData.message}`);
      console.log('✓ Backend API and Mercure publishEvent verified successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Backend / Mercure publish check failed: ${msg}`);
      const containers = await trpcCall<DokployContainer[]>('docker.getContainersByAppNameMatch', 'GET', { appName: composeDetails.appName });
      const appC = containers.find((c) => c.name.endsWith('-app-1') || c.name.includes('-app-1'));
      if (appC) {
        const appLogs = await trpcCall<string>('compose.readLogs', 'GET', { composeId, containerId: appC.containerId });
        console.log(`\n--- ACTUAL APP CONTAINER LOGS (${appC.name}) ---`);
        console.log(appLogs.split('\n').slice(-30).join('\n'));
      }
    }
  }

  console.log('\n🎉 Dokploy dev environment configuration completed successfully!');
}

main().catch((err) => {
  console.error('\n❌ Error configuring Dokploy dev environment:', err.message);
  process.exit(1);
});
