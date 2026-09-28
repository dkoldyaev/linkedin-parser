import { spawn } from 'child_process';

const targetUrl = process.argv[2] || 'http://localhost:5174';
const device = process.argv[3] || 'mobile'; // 'mobile' or 'desktop'
const toolToCall = process.argv[4] || 'run_audit';

console.log(`Running Lighthouse MCP tool "${toolToCall}" for ${targetUrl} (device: ${device})...`);

const proc = spawn('npx', ['-y', '@danielsogl/lighthouse-mcp@latest'], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

let buffer = '';
let nextId = 1;
const pending = new Map();

function send(msg) {
  proc.stdin.write(JSON.stringify(msg) + '\n');
}

function callTool(name, args) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    send({
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    });
  });
}

proc.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const msg = JSON.parse(trimmed);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) {
          reject(msg.error);
        } else {
          resolve(msg.result);
        }
      }
    } catch (e) {
      console.error('Error parsing line:', trimmed, e);
    }
  }
});

async function main() {
  const initRes = await new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    send({
      jsonrpc: '2.0',
      id,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'lighthouse-runner', version: '1.0' },
      },
    });
  });

  send({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
  });

  console.log('Connected to Lighthouse MCP server:', initRes.serverInfo);

  try {
    let result;
    if (toolToCall === 'list_tools') {
      result = await new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        send({
          jsonrpc: '2.0',
          id,
          method: 'tools/list',
          params: {},
        });
      });
      console.log('\n=== AVAILABLE TOOLS ===');
      console.log(JSON.stringify(result.tools.map(t => ({ name: t.name, description: t.description })), null, 2));
      return;
    } else {
      result = await callTool(toolToCall, {
        url: targetUrl,
        device: device,
        includeDetails: true,
      });
    }

    console.log(`\n=== LIGHTHOUSE ${toolToCall.toUpperCase()} RESULT ===`);
    if (result.content) {
      for (const item of result.content) {
        if (item.type === 'text') {
          console.log(item.text);
        }
      }
    }
    if (result.structuredContent?.data?.audits) {
      const failing = result.structuredContent.data.audits
        .filter(a => a.score !== null && a.score < 100);
      console.log('\n=== FAILING AUDITS (< 100) DETAILS ===');
      for (const a of failing) {
        console.log(`-- ${a.title} (score: ${a.score}) --`);
        console.log(JSON.stringify(a.details || a, null, 2));
      }
    }
    if (result.structuredContent) {
      console.log('\nStructured Content (summary):');
      console.log('Score:', result.structuredContent.data?.accessibilityScore ?? result.structuredContent.data?.performanceScore ?? result.structuredContent.data?.categories);
      console.log('Summary:', result.structuredContent.summary);
      console.log('Recommendations:', result.structuredContent.recommendations);
    }
  } catch (err) {
    console.error('Lighthouse MCP tool call failed:', err);
  } finally {
    proc.kill();
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  proc.kill();
  process.exit(1);
});
