import fs from 'fs';

async function main() {
  console.log("Authenticating...");
  const authRes = await fetch("http://127.0.0.1:8000/api/auth/dev-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", name: "Dev User" })
  });
  if (!authRes.ok) {
    console.error("Auth failed", await authRes.text());
    return;
  }
  const cookies = authRes.headers.get("set-cookie");
  console.log("Cookies:", cookies);

  const URL = "https://www.upwork.com/jobs/Junior-Developer-Python-Vue-Flutter-Remote_~022104418223352040840/?referrer_url_path=find_work_home";
  console.log(`Sending parse request for ${URL}`);
  const parseRes = await fetch("http://127.0.0.1:8000/api/vacancies/batch", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": cookies
    },
    body: JSON.stringify({ urls: [URL], default_tags: ["upwork_test"] })
  });
  console.log("Response:", parseRes.status, await parseRes.text());
}

main().catch(console.error);
