import { spawn } from "child_process";
import http from "http";
import assert from "assert";

async function runTest() {
  console.log("=== Testing Node.js MCP Server over stdio ===");

  // 1. Start a mock Job Tracker API server
  const mockServer = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const authHeader = req.headers["authorization"] || "";
    const apiKeyHeader = req.headers["x-api-key"] || "";

    if (authHeader !== "Bearer mcp_test_token" && apiKeyHeader !== "mcp_test_token") {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ detail: "Invalid token" }));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/vacancies") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify([
          {
            id: 1,
            title: "Senior Node/Python Engineer",
            company: "Tech Corp",
            status: "Собеседование",
            source: "LinkedIn",
            location: "Remote",
            tags: ["remote", "backend"],
            tech_stack: ["Node.js", "Python", "FastAPI"],
            salary_min: 5000,
            salary_max: 7000,
            salary_currency: "$",
            salary_period: "month",
            url: "https://linkedin.com/jobs/view/123",
          },
        ])
      );
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/columns") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify([
          { id: "Еще не написан", color: "#64748b" },
          { id: "Написал", color: "#3b82f6" },
          { id: "Собеседование", color: "#8b5cf6" },
          { id: "Оффер", color: "#10b981" },
        ])
      );
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/stats") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ total: 10, by_status: { Оффер: 1 } }));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ detail: "Not found" }));
  });

  await new Promise((resolve) => mockServer.listen(0, resolve));
  const port = mockServer.address().port;
  const mockUrl = `http://localhost:${port}`;
  console.log(`Mock Job Tracker server listening on ${mockUrl}`);

  // 2. Spawn MCP server process
  const child = spawn("./bin/mcp-server.mjs", ["--url", mockUrl, "--api-key", "mcp_test_token"], {
    stdio: ["pipe", "pipe", "inherit"],
  });

  const responses = new Map();
  let buffer = "";

  child.stdout.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      if (line) {
        try {
          const json = JSON.parse(line);
          if (json.id) {
            responses.set(json.id, json);
          }
        } catch (e) {
          console.error("Non-JSON stdout:", line);
        }
      }
    }
    buffer = lines[lines.length - 1];
  });

  function sendRequest(id, method, params = {}) {
    const msg = JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n";
    child.stdin.write(msg);
  }

  async function waitForResponse(id, timeout = 3000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (responses.has(id)) return responses.get(id);
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error(`Timeout waiting for response id ${id}`);
  }

  try {
    // 3. Initialize
    sendRequest(1, "initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test-runner", version: "1.0.0" },
    });
    const initRes = await waitForResponse(1);
    assert.strictEqual(initRes.result.serverInfo.name, "job-tracker");
    console.log("✅ MCP initialize verified");

    // 4. Tools list
    sendRequest(2, "tools/list", {});
    const toolsRes = await waitForResponse(2);
    const toolNames = toolsRes.result.tools.map((t) => t.name);
    assert.strictEqual(toolNames.length, 13);
    assert.ok(toolNames.includes("list_vacancies"));
    assert.ok(toolNames.includes("get_vacancy"));
    assert.ok(toolNames.includes("import_vacancies"));
    assert.ok(toolNames.includes("update_vacancy"));
    assert.ok(toolNames.includes("get_stats"));
    console.log("✅ MCP tools/list verified (13 tools)");

    // 5. Resources list
    sendRequest(3, "resources/list", {});
    const resList = await waitForResponse(3);
    const uris = resList.result.resources.map((r) => r.uri);
    assert.ok(uris.includes("job-tracker://vacancies"));
    assert.ok(uris.includes("job-tracker://stats"));
    assert.ok(uris.includes("job-tracker://columns"));
    console.log("✅ MCP resources/list verified (3 resources)");

    // 6. Call tool: list_vacancies
    sendRequest(4, "tools/call", {
      name: "list_vacancies",
      arguments: {},
    });
    const callRes = await waitForResponse(4);
    assert.ok(callRes.result.content[0].text.includes("Senior Node/Python Engineer"));
    assert.ok(callRes.result.content[0].text.includes("Tech Corp"));
    console.log("✅ MCP tool call (list_vacancies) executed successfully");

    // 7. Call tool: get_columns
    sendRequest(5, "tools/call", {
      name: "get_columns",
      arguments: {},
    });
    const colsRes = await waitForResponse(5);
    assert.ok(colsRes.result.content[0].text.includes("Собеседование"));
    console.log("✅ MCP tool call (get_columns) executed successfully");

    // 8. Read resource: job-tracker://stats
    sendRequest(6, "resources/read", {
      uri: "job-tracker://stats",
    });
    const statRes = await waitForResponse(6);
    const parsedStat = JSON.parse(statRes.result.contents[0].text);
    assert.strictEqual(parsedStat.total, 10);
    console.log("✅ MCP resource read (job-tracker://stats) verified");

    console.log("\n🎉 All Node.js MCP Server tests PASSED successfully!");
  } finally {
    child.kill();
    mockServer.close();
  }
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
