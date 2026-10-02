const API_BASE = "http://localhost:8000";

// --- Queue fetching ---
async function fetchQueue() {
  try {
    // /api/queue/tasks returns List[TaskInfo] with title, company, stage, status
    const [tasksRes, statusRes] = await Promise.all([
      fetch(`${API_BASE}/api/queue/tasks`, { credentials: "include" }),
      fetch(`${API_BASE}/api/queue/status`, { credentials: "include" }),
    ]);
    const tasks = tasksRes.ok ? await tasksRes.json() : [];
    const status = statusRes.ok ? await statusRes.json() : {};
    return { tasks, total_remaining: status.total_remaining ?? tasks.length };
  } catch {
    return null;
  }
}


function renderQueue(queueData) {
  const listEl = document.getElementById("queue-list");
  const countEl = document.getElementById("queue-count");

  if (!queueData) {
    listEl.innerHTML = `<li class="queue-empty">Not connected</li>`;
    countEl.textContent = "?";
    return;
  }

  const tasks = queueData.tasks || [];
  const total = queueData.total_remaining ?? tasks.length;
  countEl.textContent = total;

  if (tasks.length === 0) {
    listEl.innerHTML = `<li class="queue-empty">Queue is empty ✓</li>`;
    return;
  }

  listEl.innerHTML = tasks.map(task => {
    const stage = task.stage || "scraping";
    const isActive = task.status === "processing";
    const isExt = stage === "pending_extension";
    const dotClass = isExt ? "dot dot-ext" : (isActive ? "dot dot-active" : "dot dot-wait");

    let pillClass = "stage-pill pill-scr";
    let pillText = "SCR";
    if (stage === "ai_analysis" || stage === "ai") { pillClass = "stage-pill pill-ai"; pillText = "AI"; }
    if (isExt) { pillClass = "stage-pill pill-ext"; pillText = "EXT"; }

    const title = task.title || task.url || task.task_id;
    const shortTitle = title.length > 35 ? title.slice(0, 35) + "…" : title;
    const company = task.company || "";

    return `
      <li class="queue-item">
        <span class="${dotClass}"></span>
        <div class="item-body">
          <div class="item-title" title="${escapeHtml(title)}">${escapeHtml(shortTitle)}</div>
          ${company ? `<div class="item-sub">${escapeHtml(company)}</div>` : ""}
        </div>
        <span class="${pillClass}">${pillText}</span>
      </li>
    `;
  }).join("");
}


function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function refreshQueue() {
  const refreshBtn = document.getElementById("refresh-btn");
  refreshBtn.classList.add("spinning");

  const [data] = await Promise.all([
    fetchQueue(),
    refreshBlockedTabs(),
  ]);

  renderQueue(data);
  refreshBtn.classList.remove("spinning");
}

// --- Blocked tabs (captcha) ---

async function refreshBlockedTabs() {
  try {
    const map = await chrome.runtime.sendMessage({ type: "GET_BLOCKED_TABS" });
    renderBlockedTabs(map || {});
  } catch {
    renderBlockedTabs({});
  }
}

function renderBlockedTabs(map) {
  const section = document.getElementById("attention-section");
  const listEl = document.getElementById("attention-list");
  const countEl = document.getElementById("attention-count");

  const entries = Object.entries(map); // [[tabId, entry], ...]
  countEl.textContent = entries.length;
  section.style.display = entries.length > 0 ? "" : "none";

  if (entries.length === 0) {
    listEl.innerHTML = "";
    return;
  }

  listEl.innerHTML = entries.map(([tabId, entry]) => {
    const shortUrl = entry.url?.length > 40
      ? entry.url.slice(0, 40) + "…"
      : (entry.url || "Unknown URL");
    const ago = entry.detected_at
      ? Math.round((Date.now() - entry.detected_at) / 1000) + "s ago"
      : "";

    return `
      <div class="attention-item" data-tab="${escapeHtml(tabId)}">
        <div class="attention-title" title="${escapeHtml(entry.url || '')}">
          ${escapeHtml(shortUrl)}
          ${ago ? `<span style="font-weight:400;font-size:10px;color:GrayText;margin-left:4px;">${ago}</span>` : ""}
        </div>
        <div class="attention-actions">
          <button class="btn-small primary" data-action="focus" data-tab="${escapeHtml(tabId)}">
            🔍 Solve captcha
          </button>
          <button class="btn-small" data-action="retry" data-tab="${escapeHtml(tabId)}" title="Extract now (if already solved)">
            ↺ Retry
          </button>
          <button class="btn-small danger" data-action="dismiss" data-tab="${escapeHtml(tabId)}" title="Give up and close tab">
            ✕
          </button>
        </div>
      </div>
    `;
  }).join("");

  // Bind buttons
  listEl.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const action = btn.dataset.action;
      const tabId = parseInt(btn.dataset.tab, 10);

      if (action === "focus") {
        await chrome.runtime.sendMessage({ type: "FOCUS_BLOCKED_TAB", tabId });
        window.close(); // close popup so user can see the tab
      } else if (action === "retry") {
        btn.disabled = true;
        btn.textContent = "…";
        await chrome.runtime.sendMessage({ type: "RETRY_BLOCKED_TAB", tabId });
        await refreshBlockedTabs();
      } else if (action === "dismiss") {
        await chrome.runtime.sendMessage({ type: "DISMISS_BLOCKED_TAB", tabId });
        await refreshBlockedTabs();
      }
    });
  });
}

// --- Show current URL ---
async function showCurrentUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const urlEl = document.getElementById("current-url");
      try {
        const hn = new URL(tab.url).hostname;
        urlEl.textContent = hn;
        urlEl.title = tab.url;
      } catch {
        urlEl.textContent = tab.url.slice(0, 50);
      }
    }
  } catch { /* ignore */ }
}

// --- Add button ---
document.getElementById("add-btn").addEventListener("click", async () => {
  const statusEl = document.getElementById("status");
  const addBtn = document.getElementById("add-btn");

  statusEl.textContent = "Extracting page…";
  statusEl.className = "info";
  addBtn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      statusEl.textContent = "No active tab found.";
      statusEl.className = "error";
      addBtn.disabled = false;
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.documentElement.outerHTML,
    });

    if (results && results[0] && results[0].result) {
      statusEl.textContent = "Sending to server…";

      const res = await fetch(`${API_BASE}/api/extension/parse_and_add`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: tab.url, html: results[0].result })
      });

      if (res.ok) {
        statusEl.textContent = `✓ Added! AI is analyzing…`;
        statusEl.className = "success";
        setTimeout(refreshQueue, 800);
      } else {
        const err = await res.text();
        statusEl.textContent = "Error: " + err.slice(0, 80);
        statusEl.className = "error";
      }
    } else {
      statusEl.textContent = "Failed to extract page data.";
      statusEl.className = "error";
    }
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Error: " + err.message;
    statusEl.className = "error";
  } finally {
    addBtn.disabled = false;
  }
});

// --- Refresh button ---
document.getElementById("refresh-btn").addEventListener("click", refreshQueue);

// --- Init ---
showCurrentUrl();
refreshQueue();
setInterval(refreshQueue, 5000);
