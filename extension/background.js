const API_BASE = "http://localhost:8000";

let eventSource = null;
let mercureConfig = null;

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
    const tasks = await res.json();
    return tasks;
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
      body: JSON.stringify({ url: "", html: html })
    });
  } catch (err) {
    console.error("Failed to submit result:", err);
  }
}

async function processTask(task) {
  console.log("Processing task:", task);
  const tab = await chrome.tabs.create({ url: task.url, active: false });
  
  // Wait for the page to load
  await new Promise((resolve) => setTimeout(resolve, 8000));
  
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.documentElement.outerHTML,
    });
    
    if (results && results[0] && results[0].result) {
      await submitTaskResult(task.task_id, results[0].result);
    }
  } catch (e) {
    console.error("Failed to extract HTML from tab", e);
  }
  
  // Close the tab
  await chrome.tabs.remove(tab.id);
}

async function processAllPendingTasks() {
  const tasks = await fetchTasks();
  if (!tasks || tasks.length === 0) return;
  for (const task of tasks) {
    await processTask(task);
  }
}

async function connectMercure() {
  if (eventSource) {
    eventSource.close();
  }
  
  mercureConfig = await fetchMercureConfig();
  if (!mercureConfig) {
    // If not logged in, retry later
    setTimeout(connectMercure, 10000);
    return;
  }
  
  const url = new URL(mercureConfig.mercure_hub_url);
  url.searchParams.append('topic', mercureConfig.topic);
  
  // withCredentials: false for Mercure Hub (usually it relies on standard CORS unless cookies are needed)
  // Actually, Mercure hub here doesn't require cookies for public subscribing, but we can set it anyway.
  eventSource = new EventSource(url.toString());
  
  eventSource.onopen = () => {
    console.log("Mercure connected");
    // On connect, fetch any tasks we might have missed
    processAllPendingTasks();
  };
  
  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.type === "extension_task") {
         processTask({ task_id: data.task_id, url: data.url });
      }
    } catch (err) {
      console.error("Error parsing Mercure message", err);
    }
  };
  
  eventSource.onerror = (err) => {
    console.error("Mercure error", err);
    eventSource.close();
    eventSource = null;
    setTimeout(connectMercure, 5000);
  };
}

// Initial connection
connectMercure();

chrome.runtime.onStartup.addListener(() => {
  connectMercure();
});

chrome.alarms.create("keepAlive", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
    if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
      connectMercure();
    }
  }
});
