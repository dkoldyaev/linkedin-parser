const API_BASE = "http://localhost:8000";

let eventSource = null;
let mercureConfig = null;

// ─── Captcha / block detection ────────────────────────────────────────────
//
// Runs inside the target tab's page context (no extension APIs available here).
// Returns true if the page looks like a CAPTCHA or block screen.
//
function detectCaptchaInPage() {
  const html = document.documentElement.innerHTML.toLowerCase();
  const title = document.title.toLowerCase();
  const url = location.href.toLowerCase();

  const HTML_SIGNALS = [
    "cf-browser-verification",   // Cloudflare classic
    "cf-challenge",              // Cloudflare challenge
    "cloudflare ray id",
    "g-recaptcha",               // Google reCAPTCHA
    "h-captcha",                 // hCaptcha
    "data-hcaptcha-response",
    "__cf_chl",                  // Cloudflare challenge form
    "datadome",                  // DataDome
    "px-captcha",                // PerimeterX
    "_pxCaptcha",
    "turnstile",                 // Cloudflare Turnstile
    "challenge-form",
    "interstitial-wrapper",      // LinkedIn interstitial
    "authwall",                  // LinkedIn auth wall
  ];

  const TITLE_SIGNALS = [
    "robot", "captcha", "access denied", "blocked",
    "security check", "human verification", "attention required",
    "just a moment",             // Cloudflare waiting room
    "verification required",
  ];

  const URL_SIGNALS = [
    "captcha", "challenge", "blocked", "checkpoint",
  ];

  if (HTML_SIGNALS.some(s => html.includes(s))) return true;
  if (TITLE_SIGNALS.some(s => title.includes(s))) return true;
  if (URL_SIGNALS.some(s => url.includes(s))) return true;

  // HTTP 403 / 429 sometimes render a short page with no main content
  const bodyText = (document.body?.innerText || "").trim();
  if (bodyText.length < 300 && (title.includes("403") || title.includes("429") || title.includes("denied"))) return true;

  return false;
}

// ─── Blocked-tabs registry (in-memory + chrome.storage.session) ───────────

async function getBlockedTabs() {
  const data = await chrome.storage.session.get("blockedTabs");
  return data.blockedTabs || {};
}

async function setBlockedTabs(map) {
  await chrome.storage.session.set({ blockedTabs: map });
}

async function addBlockedTab(tabId, entry) {
  const map = await getBlockedTabs();
  map[tabId] = entry;
  await setBlockedTabs(map);
}

async function removeBlockedTab(tabId) {
  const map = await getBlockedTabs();
  delete map[tabId];
  await setBlockedTabs(map);
}

// ─── Tab-completion watcher ───────────────────────────────────────────────
// When a blocked tab finishes navigating (user solved captcha and page reloaded),
// automatically retry extraction.

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status !== "complete") return;

  const map = await getBlockedTabs();
  if (!(tabId in map)) return;

  const entry = map[tabId];
  console.log(`Blocked tab ${tabId} finished loading — re-checking for captcha`);

  // Give JS a moment to render
  await new Promise(r => setTimeout(r, 2000));

  const isCaptcha = await checkTabForCaptcha(tabId);
  if (isCaptcha) {
    console.log(`Tab ${tabId} still blocked — waiting for user`);
    // Keep it in the map; popup already shows it
    return;
  }

  // Captcha is solved — extract and submit
  console.log(`Tab ${tabId} looks unblocked — extracting HTML`);
  await extractAndSubmit(tabId, entry);
});

// ─── Core helpers ─────────────────────────────────────────────────────────

async function checkTabForCaptcha(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: detectCaptchaInPage,
    });
    return results?.[0]?.result === true;
  } catch {
    return false;
  }
}

async function extractAndSubmit(tabId, entry) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => document.documentElement.outerHTML,
    });

    const html = results?.[0]?.result;
    if (html) {
      await submitTaskResult(entry.task_id, html);
    }
  } catch (e) {
    console.error("Failed to extract HTML after captcha solve:", e);
  } finally {
    await removeBlockedTab(tabId);
    try { await chrome.tabs.remove(tabId); } catch {}
  }
}

// ─── Context Menu ──────────────────────────────────────────────────────────

function setupContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "add-link-vacancy",
      title: "➕ Add to Job Tracker",
      contexts: ["link"],
    });
    chrome.contextMenus.create({
      id: "add-page-vacancy",
      title: "➕ Add current page to Job Tracker",
      contexts: ["page"],
    });
  });
}

chrome.runtime.onInstalled.addListener(setupContextMenu);
chrome.runtime.onStartup.addListener(setupContextMenu);

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "add-link-vacancy") {
    const url = info.linkUrl;
    if (!url) return;
    try {
      const res = await fetch(`${API_BASE}/api/extension/parse_and_add`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, html: null }),
      });
      if (res.ok) {
        notify("Job Tracker", `Added: ${url.slice(0, 70)}`);
      } else {
        const err = await res.text().catch(() => String(res.status));
        notify("Job Tracker — Error", err.slice(0, 120));
      }
    } catch (e) {
      notify("Job Tracker — Error", e.message);
    }
  }

  if (info.menuItemId === "add-page-vacancy") {
    if (!tab) return;
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.documentElement.outerHTML,
      });
      const html = results?.[0]?.result ?? null;
      const res = await fetch(`${API_BASE}/api/extension/parse_and_add`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: tab.url, html }),
      });
      if (res.ok) {
        notify("Job Tracker", `Added: ${tab.title?.slice(0, 60) || tab.url.slice(0, 60)}`);
      } else {
        const err = await res.text().catch(() => String(res.status));
        notify("Job Tracker — Error", err.slice(0, 120));
      }
    } catch (e) {
      notify("Job Tracker — Error", e.message);
    }
  }
});

function notify(title, message) {
  try {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title,
      message,
    });
  } catch {
    console.log(title, message);
  }
}

// ─── Message handler (from popup) ─────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "GET_BLOCKED_TABS") {
    getBlockedTabs().then(sendResponse);
    return true; // async
  }

  if (msg.type === "FOCUS_BLOCKED_TAB") {
    // Make tab visible so user can solve captcha
    chrome.tabs.update(msg.tabId, { active: true });
    // Also focus the window that contains it
    chrome.tabs.get(msg.tabId, (tab) => {
      if (tab?.windowId) chrome.windows.update(tab.windowId, { focused: true });
    });
    sendResponse({ ok: true });
  }

  if (msg.type === "RETRY_BLOCKED_TAB") {
    // User says they solved the captcha manually — extract now
    getBlockedTabs().then(async (map) => {
      const entry = map[msg.tabId];
      if (!entry) { sendResponse({ ok: false }); return; }
      await extractAndSubmit(msg.tabId, entry);
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === "DISMISS_BLOCKED_TAB") {
    // User gives up — close the tab and remove from list
    removeBlockedTab(msg.tabId).then(() => {
      try { chrome.tabs.remove(msg.tabId); } catch {}
      sendResponse({ ok: true });
    });
    return true;
  }
});

// ─── Extension task queue (Mercure-driven) ────────────────────────────────

async function fetchMercureConfig() {
  try {
    const res = await fetch(`${API_BASE}/api/extension/mercure_config`, { credentials: "include" });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch Mercure config:", err);
    return null;
  }
}

async function fetchTasks() {
  try {
    const res = await fetch(`${API_BASE}/api/extension/tasks`, { credentials: "include" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch extension tasks:", err);
    return [];
  }
}

async function submitTaskResult(taskId, html) {
  try {
    await fetch(`${API_BASE}/api/extension/tasks/${taskId}/result`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "", html }),
    });
  } catch (err) {
    console.error("Failed to submit result:", err);
  }
}

async function processTask(task) {
  console.log("Processing task:", task);
  const tab = await chrome.tabs.create({ url: task.url, active: false });

  // Wait for page to load
  await new Promise((resolve) => setTimeout(resolve, 8000));

  try {
    // 1. Check for captcha / block screen
    const isCaptcha = await checkTabForCaptcha(tab.id);

    if (isCaptcha) {
      console.log(`Captcha detected on tab ${tab.id} for ${task.url}`);
      // Store in blocked registry — tab stays open
      await addBlockedTab(tab.id, {
        task_id: task.task_id,
        url: task.url,
        title: task.title || task.url,
        detected_at: Date.now(),
      });
      // Notify user via system notification
      notify(
        "⚠️ Job Tracker — Action Required",
        `CAPTCHA or block detected:\n${task.url.slice(0, 80)}`
      );
      // Tab stays open; user will handle it via popup or system notification
      return;
    }

    // 2. No captcha — extract and submit
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.documentElement.outerHTML,
    });

    if (results?.[0]?.result) {
      await submitTaskResult(task.task_id, results[0].result);
    }
  } catch (e) {
    console.error("Failed to process tab", e);
  }

  // Only close if NOT in blocked registry
  const map = await getBlockedTabs();
  if (!(tab.id in map)) {
    try { await chrome.tabs.remove(tab.id); } catch {}
  }
}

async function processAllPendingTasks() {
  const tasks = await fetchTasks();
  if (!tasks || tasks.length === 0) return;
  for (const task of tasks) {
    await processTask(task);
  }
}

async function connectMercure() {
  if (eventSource) eventSource.close();

  mercureConfig = await fetchMercureConfig();
  if (!mercureConfig) {
    setTimeout(connectMercure, 10000);
    return;
  }

  const url = new URL(mercureConfig.mercure_hub_url);
  url.searchParams.append("topic", mercureConfig.topic);
  eventSource = new EventSource(url.toString());

  eventSource.onopen = () => {
    console.log("Mercure connected");
    processAllPendingTasks();
  };

  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.type === "extension_task") {
        processTask({ task_id: data.task_id, url: data.url, title: data.title });
      }
    } catch (err) {
      console.error("Error parsing Mercure message", err);
    }
  };

  eventSource.onerror = () => {
    eventSource.close();
    eventSource = null;
    setTimeout(connectMercure, 5000);
  };
}

// Initial connection
connectMercure();

chrome.runtime.onStartup.addListener(() => {
  connectMercure();
  setupContextMenu();
});

chrome.alarms.create("keepAlive", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
    if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
      connectMercure();
    }
  }
});
