import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Parse CLI flags and environment variables
const args = process.argv.slice(2);
function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  const eq = args.find((a) => a.startsWith(`${flag}=`));
  if (eq) return eq.split("=").slice(1).join("=");
  return undefined;
}

const DEFAULT_URL =
  getArg("--url") ||
  process.env.JOB_TRACKER_URL ||
  process.env.APP_URL ||
  "http://localhost:8000";

const DEFAULT_API_KEY =
  getArg("--api-key") ||
  getArg("--token") ||
  process.env.JOB_TRACKER_API_KEY ||
  process.env.JOB_TRACKER_TOKEN ||
  process.env.API_KEY ||
  "";

class JobTrackerClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = DEFAULT_URL, apiKey: string = DEFAULT_API_KEY) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey.trim();
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  private async request<T = any>(
    method: string,
    path: string,
    options: { params?: Record<string, any>; body?: any } = {}
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (options.params) {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(options.params)) {
        if (v !== undefined && v !== null && v !== "") {
          sp.append(k, String(v));
        }
      }
      const qs = sp.toString();
      if (qs) url += (url.includes("?") ? "&" : "?") + qs;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });
    } catch (err: any) {
      throw new Error(
        `Could not connect to Job Tracker at ${this.baseUrl} (${err.message || err}). ` +
          `Make sure the application server is running and accessible.`
      );
    }

    if (response.status === 401) {
      throw new Error(
        `Authentication failed (401 Unauthorized). ` +
          `Please provide a valid JOB_TRACKER_API_KEY (via --api-key or env variable). ` +
          `You can generate a token in the Job Tracker Web UI under Settings -> MCP / API.`
      );
    }

    if (response.status === 404) {
      throw new Error(`Resource not found (404) at ${path}`);
    }

    if (!response.ok) {
      const text = await response.text();
      let detail = text;
      try {
        const json = JSON.parse(text);
        if (json.detail) detail = json.detail;
      } catch {}
      throw new Error(`Job Tracker API error (${response.status}): ${detail}`);
    }

    if (response.status === 204) {
      return null as any;
    }

    const text = await response.text();
    if (!text) return null as any;
    return JSON.parse(text);
  }

  async listVacancies(params: Record<string, any> = {}) {
    return this.request<any[]>("GET", "/api/vacancies", { params });
  }

  async getVacancy(id: number) {
    return this.request<any>("GET", `/api/vacancies/${id}`);
  }

  async createVacancy(data: Record<string, any>) {
    return this.request<any>("POST", "/api/vacancies", { body: data });
  }

  async updateVacancy(id: number, data: Record<string, any>) {
    return this.request<any>("PATCH", `/api/vacancies/${id}`, { body: data });
  }

  async deleteVacancy(id: number) {
    return this.request<void>("DELETE", `/api/vacancies/${id}`);
  }

  async addHistory(id: number, toStatus: string, comment?: string) {
    return this.request<any>("POST", `/api/vacancies/${id}/history`, {
      body: { to_status: toStatus, comment },
    });
  }

  async importBatch(urls: string[]) {
    return this.request<any>("POST", "/api/vacancies/batch", {
      body: { urls },
    });
  }

  async checkDuplicates(urls: string[]) {
    return this.request<any>("POST", "/api/vacancies/check-duplicates", {
      body: { urls },
    });
  }

  async resummarize(id: number) {
    return this.request<any>("POST", `/api/vacancies/${id}/resummarize`);
  }

  async reparse(id: number) {
    return this.request<any>("POST", `/api/vacancies/${id}/reparse`);
  }

  async getStats() {
    return this.request<any>("GET", "/api/stats");
  }

  async getColumns() {
    return this.request<any[]>("GET", "/api/columns");
  }

  async getTags() {
    return this.request<string[]>("GET", "/api/tags");
  }

  async getSources() {
    return this.request<string[]>("GET", "/api/sources");
  }
}

const client = new JobTrackerClient();

// Create MCP Server instance
const server = new McpServer({
  name: "job-tracker",
  version: "1.0.0",
});

// ==========================================
// MCP TOOLS
// ==========================================

// 1. list_vacancies
server.tool(
  "list_vacancies",
  "List tracked job vacancies with filtering options (status, search keywords, city, tags, etc.)",
  {
    status: z.string().optional().describe("Filter by Kanban status ('Еще не написан', 'Написал', 'Собеседование', 'Тестовое', 'Оффер', 'Отказ')"),
    search: z.string().optional().describe("Free-text search query in title, company, or tech stack"),
    tag: z.string().optional().describe("Filter by tag/label name"),
    city: z.string().optional().describe("Filter by city"),
    country: z.string().optional().describe("Filter by country"),
    source: z.string().optional().describe("Filter by source site ('LinkedIn', 'Habr Career', 'HeadHunter', 'Upwork', 'Avito', etc.)"),
    is_closed: z.boolean().optional().describe("Filter closed/archived job vacancies"),
    limit: z.number().optional().default(50).describe("Maximum number of vacancies to return (default 50)"),
  },
  async ({ status, search, tag, city, country, source, is_closed, limit }) => {
    let vacancies = await client.listVacancies({
      status,
      search,
      tag,
      city,
      country,
      source,
      is_closed,
    });
    if (limit && vacancies.length > limit) {
      vacancies = vacancies.slice(0, limit);
    }
    if (!vacancies.length) {
      return {
        content: [{ type: "text", text: "No vacancies found matching the specified criteria." }],
      };
    }

    const lines: string[] = [`Found ${vacancies.length} vacancy(ies):\n`];
    for (const v of vacancies) {
      const salParts: string[] = [];
      if (v.salary_min != null) salParts.push(`from ${v.salary_min}`);
      if (v.salary_max != null) salParts.push(`to ${v.salary_max}`);
      const curr = v.salary_currency || "";
      const period = v.salary_period ? `/${v.salary_period}` : "";
      const salaryStr = salParts.length ? `${salParts.join(" ")} ${curr}${period}`.trim() : "Not specified";

      const tagsStr = (v.tags || []).join(", ") || "None";
      const techStr = (v.tech_stack || []).join(", ") || "None";

      lines.push(
        `• [ID: ${v.id}] ${v.title || "Untitled"} @ ${v.company || "Unknown"}\n` +
          `  Status: ${v.status} | Source: ${v.source || "Direct"} | Location: ${v.location || "Not specified"}\n` +
          `  Salary: ${salaryStr} | Workplace: ${v.workplace_type || "Not specified"}\n` +
          `  Tags: ${tagsStr} | Tech Stack: ${techStr}\n` +
          `  URL: ${v.url}\n`
      );
    }
    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// 2. get_vacancy
server.tool(
  "get_vacancy",
  "Get full details of a specific job vacancy by ID (full description, AI summary, tech stack, salary, and status history)",
  {
    vacancy_id: z.number().describe("Unique integer ID of the vacancy"),
  },
  async ({ vacancy_id }) => {
    const v = await client.getVacancy(vacancy_id);
    const tagsStr = (v.tags || []).join(", ") || "None";
    const techStr = (v.tech_stack || []).join(", ") || "None";

    const salParts: string[] = [];
    if (v.salary_min != null) salParts.push(`from ${v.salary_min}`);
    if (v.salary_max != null) salParts.push(`to ${v.salary_max}`);
    const curr = v.salary_currency || "";
    const period = v.salary_period ? `/${v.salary_period}` : "";
    const salaryStr = salParts.length ? `${salParts.join(" ")} ${curr}${period}`.trim() : "Not specified";

    const historyLines: string[] = [];
    for (const h of v.history || []) {
      const fromSt = h.from_status || "Initial";
      const toSt = h.to_status;
      const comment = h.comment ? ` - '${h.comment}'` : "";
      const createdAt = (h.created_at || "").slice(0, 16);
      historyLines.push(`  • ${createdAt}: ${fromSt} → ${toSt}${comment}`);
    }
    const historyStr = historyLines.length ? historyLines.join("\n") : "  No transitions recorded yet.";

    const text =
      `Vacancy Details (ID: ${v.id})\n` +
      `================================\n` +
      `Title: ${v.title}\n` +
      `Company: ${v.company}\n` +
      `URL: ${v.url}\n` +
      `Company URL: ${v.company_url || "N/A"}\n` +
      `Source: ${v.source || "N/A"}\n` +
      `Status: ${v.status} (Lane: ${v.lane ?? 0})\n` +
      `Location: ${v.location || "N/A"} (City: ${v.city || "N/A"}, Country: ${v.country || "N/A"})\n` +
      `Workplace Type: ${v.workplace_type || "N/A"}\n` +
      `Closed/Archived: ${v.is_closed ? "Yes" : "No"}\n` +
      `Salary: ${salaryStr}\n` +
      `Tags: ${tagsStr}\n` +
      `Tech Stack: ${techStr}\n\n` +
      `AI Summary:\n${v.ai_summary || "No AI summary generated."}\n\n` +
      `Company Info:\n${v.company_info || "No company info available."}\n\n` +
      `Personal Notes:\n${v.notes || "No notes."}\n\n` +
      `Status History:\n${historyStr}\n\n` +
      `Full Description:\n${v.description || "No description available."}`;

    return { content: [{ type: "text", text }] };
  }
);

// 3. create_vacancy
server.tool(
  "create_vacancy",
  "Manually create a new vacancy card in the job tracker",
  {
    url: z.string().describe("Job posting URL"),
    title: z.string().describe("Job/Position title"),
    company: z.string().describe("Company name"),
    description: z.string().optional().describe("Job description text"),
    location: z.string().optional().describe("Location string (e.g. 'Berlin, Germany' or 'Remote')"),
    status: z.string().optional().default("Еще не написан").describe("Initial Kanban column"),
    notes: z.string().optional().describe("Personal notes or recruiter contacts"),
    tags: z.array(z.string()).optional().describe("List of colored tag names"),
    salary_min: z.number().optional().describe("Minimum salary amount"),
    salary_max: z.number().optional().describe("Maximum salary amount"),
    salary_currency: z.string().optional().describe("Salary currency ('$', '€', 'USD', 'EUR', 'RUB')"),
    salary_period: z.string().optional().describe("Salary period ('year', 'month', 'hour')"),
    workplace_type: z.string().optional().describe("Workplace type: 'remote', 'hybrid', or 'on-site'"),
  },
  async (params) => {
    const payload: Record<string, any> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) payload[k] = v;
    }
    const created = await client.createVacancy(payload);
    const text =
      `Successfully created vacancy ID ${created.id}:\n` +
      `• Title: ${created.title}\n` +
      `• Company: ${created.company}\n` +
      `• Status: ${created.status}\n` +
      `• URL: ${created.url}`;
    return { content: [{ type: "text", text }] };
  }
);

// 4. import_vacancies
server.tool(
  "import_vacancies",
  "Import vacancies by URLs. Automatically scrapes job details and runs AI summarization in the background",
  {
    urls: z.array(z.string()).describe("List of job posting URLs (LinkedIn, HeadHunter, Habr Career, Avito, Upwork, etc.)"),
  },
  async ({ urls }) => {
    if (!urls || urls.length === 0) {
      return { content: [{ type: "text", text: "No URLs provided to import." }] };
    }
    const res = await client.importBatch(urls);
    const text =
      `Import initiated for ${urls.length} vacancy URL(s).\n` +
      `• Status: ${res.status}\n` +
      `• Queued: ${res.queued ?? 0}\n` +
      `• Batch ID: ${res.batch_id || "N/A"}\n` +
      `• Details: ${res.message || "Batch import scheduled"}`;
    return { content: [{ type: "text", text }] };
  }
);

// 5. update_vacancy
server.tool(
  "update_vacancy",
  "Update fields of an existing vacancy (move between Kanban columns, edit personal notes, tags, salary, etc.)",
  {
    vacancy_id: z.number().describe("ID of the vacancy to update"),
    status: z.string().optional().describe("New Kanban column ('Еще не написан', 'Написал', 'Собеседование', 'Тестовое', 'Оффер', 'Отказ')"),
    status_comment: z.string().optional().describe("Optional comment to record in status transition history"),
    notes: z.string().optional().describe("Updated personal notes"),
    tags: z.array(z.string()).optional().describe("Updated tags list"),
    title: z.string().optional().describe("Updated position title"),
    company: z.string().optional().describe("Updated company name"),
    location: z.string().optional().describe("Updated location string"),
    salary_min: z.number().optional().describe("Updated minimum salary"),
    salary_max: z.number().optional().describe("Updated maximum salary"),
    salary_currency: z.string().optional().describe("Updated salary currency"),
    salary_period: z.string().optional().describe("Updated salary period ('year', 'month', 'hour')"),
    is_closed: z.boolean().optional().describe("Mark vacancy as closed/archived or open"),
    lane: z.number().optional().describe("Sub-lane index within column"),
  },
  async ({ vacancy_id, ...rest }) => {
    const payload: Record<string, any> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) payload[k] = v;
    }
    if (Object.keys(payload).length === 0) {
      return { content: [{ type: "text", text: "No update parameters provided." }] };
    }
    const updated = await client.updateVacancy(vacancy_id, payload);
    const text =
      `Vacancy ${updated.id} updated successfully:\n` +
      `• Title: ${updated.title}\n` +
      `• Company: ${updated.company}\n` +
      `• Status: ${updated.status}\n` +
      `• Tags: ${(updated.tags || []).join(", ") || "None"}\n` +
      `• Notes: ${updated.notes || "None"}`;
    return { content: [{ type: "text", text }] };
  }
);

// 6. delete_vacancy
server.tool(
  "delete_vacancy",
  "Permanently delete a job vacancy from the tracker",
  {
    vacancy_id: z.number().describe("ID of the vacancy to delete"),
  },
  async ({ vacancy_id }) => {
    await client.deleteVacancy(vacancy_id);
    return {
      content: [{ type: "text", text: `Vacancy ${vacancy_id} has been permanently deleted.` }],
    };
  }
);

// 7. add_status_history
server.tool(
  "add_status_history",
  "Record a status transition or log entry with a comment in the vacancy's history",
  {
    vacancy_id: z.number().describe("ID of the vacancy"),
    to_status: z.string().describe("Target status name"),
    comment: z.string().optional().describe("Comment or interview notes (e.g. 'Passed 1st HR screen, tech interview next week')"),
  },
  async ({ vacancy_id, to_status, comment }) => {
    const updated = await client.addHistory(vacancy_id, to_status, comment);
    const text =
      `Status change recorded for vacancy ${vacancy_id}:\n` +
      `• Current Status: ${updated.status}\n` +
      `• Comment: ${comment || "No comment"}`;
    return { content: [{ type: "text", text }] };
  }
);

// 8. resummarize_vacancy
server.tool(
  "resummarize_vacancy",
  "Trigger AI re-summarization and tech stack re-extraction for a vacancy",
  {
    vacancy_id: z.number().describe("ID of the vacancy"),
  },
  async ({ vacancy_id }) => {
    const updated = await client.resummarize(vacancy_id);
    const text =
      `AI re-analysis completed for vacancy ${vacancy_id}:\n` +
      `• Tech Stack: ${(updated.tech_stack || []).join(", ")}\n` +
      `• Summary: ${updated.ai_summary || "N/A"}`;
    return { content: [{ type: "text", text }] };
  }
);

// 9. reparse_vacancy
server.tool(
  "reparse_vacancy",
  "Refetch and reparse vacancy content from the original job posting URL",
  {
    vacancy_id: z.number().describe("ID of the vacancy"),
  },
  async ({ vacancy_id }) => {
    const res = await client.reparse(vacancy_id);
    return {
      content: [{ type: "text", text: `Reparsing scheduled for vacancy ${vacancy_id}: ${JSON.stringify(res)}` }],
    };
  }
);

// 10. get_stats
server.tool(
  "get_stats",
  "Get job search funnel statistics and conversion rates across Kanban columns",
  {},
  async () => {
    const stats = await client.getStats();
    return {
      content: [{ type: "text", text: `Job Application Statistics:\n${JSON.stringify(stats, null, 2)}` }],
    };
  }
);

// 11. get_columns
server.tool(
  "get_columns",
  "Get the list of active Kanban board columns and their configurations",
  {},
  async () => {
    const cols = await client.getColumns();
    const lines = ["Active Kanban Columns:"];
    for (const c of cols) {
      const lanesFlag = c.has_lanes ? " (has sub-lanes)" : "";
      lines.push(`• '${c.id}' [Color: ${c.color}]${lanesFlag}`);
    }
    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// 12. get_tags
server.tool(
  "get_tags",
  "Get all unique tags used across tracked vacancies",
  {},
  async () => {
    const tags = await client.getTags();
    if (!tags.length) {
      return { content: [{ type: "text", text: "No tags currently defined." }] };
    }
    return { content: [{ type: "text", text: `Existing tags:\n${tags.join(", ")}` }] };
  }
);

// 13. check_duplicates
server.tool(
  "check_duplicates",
  "Check if any of the given job posting URLs have already been imported into the tracker",
  {
    urls: z.array(z.string()).describe("List of URLs to verify for duplicates"),
  },
  async ({ urls }) => {
    const res = await client.checkDuplicates(urls);
    const duplicates = res.duplicates || [];
    if (!duplicates.length) {
      return {
        content: [{ type: "text", text: `None of the ${urls.length} URLs are currently in the tracker.` }],
      };
    }
    const lines: string[] = [`Found ${duplicates.length} duplicate(s):`];
    for (const d of duplicates) {
      lines.push(`• URL: ${d.url} -> Already imported as ID ${d.id}: '${d.title}' @ '${d.company}'`);
    }
    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// ==========================================
// MCP RESOURCES
// ==========================================

server.resource("vacancies", "job-tracker://vacancies", async (uri) => {
  const vacancies = await client.listVacancies({ limit: 200 });
  return {
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify(vacancies, null, 2),
        mimeType: "application/json",
      },
    ],
  };
});

server.resource("stats", "job-tracker://stats", async (uri) => {
  const stats = await client.getStats();
  return {
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify(stats, null, 2),
        mimeType: "application/json",
      },
    ],
  };
});

server.resource("columns", "job-tracker://columns", async (uri) => {
  const cols = await client.getColumns();
  return {
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify(cols, null, 2),
        mimeType: "application/json",
      },
    ],
  };
});

// ==========================================
// RUN SERVER
// ==========================================

async function main() {
  if (args.includes("--help") || args.includes("-h")) {
    console.error(`
Job Tracker MCP Server (Node.js / npx)

Usage:
  npx -y github:dkoldyaev/linkedin-parser [options]
  node bin/mcp-server.js [options]

Options:
  --url <url>        Base URL of Job Tracker backend (default: http://localhost:8000 or JOB_TRACKER_URL)
  --api-key <key>    User API Token (mcp_...) generated in Settings -> MCP / API (or JOB_TRACKER_API_KEY)
  --help, -h         Show this help message

Environment Variables:
  JOB_TRACKER_URL      URL of the Job Tracker backend
  JOB_TRACKER_API_KEY  User API Token
`);
    process.exit(0);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr only (stdout is reserved for JSON-RPC transport)
  console.error(
    `[job-tracker-mcp] Connected via stdio to Job Tracker at ${DEFAULT_URL} (${
      DEFAULT_API_KEY ? "API key provided" : "no API key"
    })`
  );
}

main().catch((err) => {
  console.error("[job-tracker-mcp] Fatal error:", err);
  process.exit(1);
});
