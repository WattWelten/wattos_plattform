import http from "node:http";

const targets = [
  { name: "gateway", url: process.env.GATEWAY_URL ?? "http://localhost:3001/health" },
  { name: "web",     url: process.env.WEB_URL ?? "http://localhost:3000/api/health" },
  { name: "chat",    url: "http://localhost:3006/health" },
  { name: "agent",   url: "http://localhost:3003/health" },
  { name: "rag",     url: "http://localhost:3005/health" },
  { name: "avatar",  url: "http://localhost:3009/health" },
  { name: "voice",   url: "http://localhost:3016/health" },
  { name: "crawler", url: "http://localhost:3015/health" }
];

const get = (url) => new Promise((resolve) => {
  const req = http.get(url, (res) => resolve({ ok: res.statusCode === 200, code: res.statusCode }));
  req.on("error", () => resolve({ ok: false, code: 0 }));
  req.setTimeout(2000, () => { req.destroy(); resolve({ ok: false, code: 0 }); });
});

const run = async () => {
  let fail = false;
  for (const t of targets) {
    const r = await get(t.url);
    const status = r.ok ? "OK" : "FAIL";
    console.log(t.name.padEnd(8) + " -> " + status + " (" + r.code + ")");
    if (!r.ok) fail = true;
  }
  process.exit(fail ? 1 : 0);
};
run();
