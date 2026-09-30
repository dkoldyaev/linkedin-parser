const API_BASE = "http://localhost:8000"; // Can be configured later

document.getElementById('add-btn').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  const addBtn = document.getElementById('add-btn');
  
  statusEl.textContent = "Extracting page data...";
  statusEl.className = "";
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
      statusEl.textContent = "Sending to server...";
      
      const res = await fetch(`${API_BASE}/api/extension/parse_and_add`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: tab.url, html: results[0].result })
      });
      
      if (res.ok) {
        statusEl.textContent = "Success! Vacancy added.";
        statusEl.className = "success";
      } else {
        const errorText = await res.text();
        statusEl.textContent = "Error: " + errorText;
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
