import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq !== -1) {
    envVars[trimmed.substring(0, eq).trim()] = trimmed.substring(eq + 1).trim();
  }
}

const API_KEY = envVars.DOKPLOY_API_KEY;
const BASE_URL = (envVars.DOKPLOY_URL || 'https://dokploy.dkoldyaev.com').replace(/\/+$/, '');

function dokployRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}/api${endpoint}`);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    };

    let bodyData = null;
    if (body) {
      bodyData = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`[${res.statusCode}] ${endpoint}: ${json.message || JSON.stringify(json)}`));
          } else {
            resolve(json.data !== undefined ? json.data : json);
          }
        } catch {
          if (res.statusCode >= 400) {
            reject(new Error(`[${res.statusCode}] ${endpoint}: ${data}`));
          } else {
            resolve(data);
          }
        }
      });
    });

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

async function main() {
  const envName = process.argv[2];
  if (!envName) {
    console.error('Usage: node scripts/read-dokploy-logs.mjs <environment-name>');
    process.exit(1);
  }

  const projectName = envVars.PROJECT_NAME || 'linkedin-parser';
  console.log(`🔍 Fetching project ${projectName}...`);
  const projects = await dokployRequest('/project.all');
  const project = (projects || []).find((p) => p.name?.toLowerCase() === projectName.toLowerCase());
  if (!project) throw new Error(`Project ${projectName} not found`);

  const devEnv = project.environments?.find((e) => e.name === envName);
  if (!devEnv) throw new Error(`Environment ${envName} not found`);

  const compose = devEnv.compose?.[0];
  if (!compose) throw new Error(`No compose application found in environment ${envName}`);

  const composeId = compose.composeId;
  const composeAppName = compose.appName; // used in container names by Dokploy

  console.log(`📦 Fetching logs for Compose ID: ${composeId}`);
  const allContainers = await dokployRequest('/docker.getContainers');
  
  const appC = allContainers.find(c => c.name?.includes(composeAppName) && c.name?.includes('-app-'));
  const mercureC = allContainers.find(c => c.name?.includes(composeAppName) && c.name?.includes('-mercure-'));
  const browserC = allContainers.find(c => c.name?.includes(composeAppName) && c.name?.includes('-browser-'));

  if (appC) {
    const logs = await dokployRequest(`/compose.readLogs?composeId=${composeId}&containerId=${appC.containerId}&tail=50`);
    console.log('--- App Logs ---\n', logs);
  } else {
    console.log('App container not found.');
  }

  if (mercureC) {
    const logs = await dokployRequest(`/compose.readLogs?composeId=${composeId}&containerId=${mercureC.containerId}&tail=50`);
    console.log('--- Mercure Logs ---\n', logs);
  }

  if (browserC) {
    const logs = await dokployRequest(`/compose.readLogs?composeId=${composeId}&containerId=${browserC.containerId}&tail=50`);
    console.log('--- Browser Logs ---\n', logs);
  }
}

main().catch(console.error);
