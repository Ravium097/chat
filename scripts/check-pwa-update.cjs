// Runs only against an isolated local server and a fresh browser context.
const { chromium } = require("playwright");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const dist = path.resolve(__dirname, "../dist");
let legacy = true;
const oldHTML =
  '<!doctype html><html><body><h1>Legacy SET</h1><button>Screenshot importieren</button><script>navigator.serviceWorker.register("/sw.js")</script></body></html>';
const oldSW = `self.addEventListener('install',e=>e.waitUntil(caches.open('set-legacy-test').then(c=>c.put('/index.html',new Response(${JSON.stringify(oldHTML)},{headers:{'Content-Type':'text/html'}})))));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(e.request.mode==='navigate')e.respondWith(caches.match('/index.html'))});`;
const mime = {
  ".js": "application/javascript",
  ".html": "text/html",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  res.setHeader("Cache-Control", "no-store");
  if (legacy) {
    res.setHeader(
      "Content-Type",
      pathname === "/sw.js" ? "application/javascript" : "text/html",
    );
    res.end(pathname === "/sw.js" ? oldSW : oldHTML);
    return;
  }
  let target = path.join(dist, pathname);
  if (!target.startsWith(dist)) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (!fs.existsSync(target) || fs.statSync(target).isDirectory())
    target = path.join(dist, "index.html");
  res.setHeader(
    "Content-Type",
    mime[path.extname(target)] || "application/octet-stream",
  );
  res.end(fs.readFileSync(target));
});
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 393, height: 852 },
    });
    const page = await context.newPage();
    await page.goto(origin);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    const sentinel = await page.evaluate(async () => {
      const workout = {
        id: "qa-preserved",
        name: "QA / Existing workout",
        date: "2026-11-01",
        started: null,
        duration: 120,
        status: "completed",
        exercises: [
          {
            id: "item",
            exerciseId: "ex",
            name: "QA Bench",
            sets: [{ id: "set", weight: 22.5, reps: 8, completed: true }],
          },
        ],
      };
      await new Promise((resolve, reject) => {
        const request = indexedDB.open("SET", 10);
        request.onupgradeneeded = () => {
          const db = request.result;
          const ex = db.createObjectStore("exercises", { keyPath: "id" });
          for (const key of ["name", "muscle", "equipment"])
            ex.createIndex(key, key);
          const ws = db.createObjectStore("workouts", { keyPath: "id" });
          for (const key of ["status", "date"]) ws.createIndex(key, key);
          db.createObjectStore("settings", { keyPath: "id" });
        };
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction(["workouts", "settings"], "readwrite");
          tx.objectStore("workouts").put(workout);
          tx.objectStore("settings").put({
            id: "settings",
            rest: 90,
            auto: true,
            timerEnd: null,
            paused: null,
          });
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
        request.onerror = () => reject(request.error);
      });
      window.updateActivated = false;
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => (window.updateActivated = true),
      );
      return workout;
    });
    legacy = false;
    await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      await reg.update();
    });
    await page.waitForFunction(
      () => window.updateActivated,
      {},
      { timeout: 30000 },
    );
    assert.equal(
      await page.getByText("Screenshot importieren").count(),
      1,
      "Existing screen must not be force-reloaded",
    );
    await page.reload();
    await page
      .getByRole("heading", { name: "Dein Training. Dein Fortschritt." })
      .waitFor();
    assert.equal(await page.getByText("Screenshot importieren").count(), 0);
    const readWorkout = () =>
      page.evaluate(
        () =>
          new Promise((resolve, reject) => {
            const req = indexedDB.open("SET");
            req.onsuccess = () => {
              const db = req.result;
              const get = db
                .transaction("workouts")
                .objectStore("workouts")
                .get("qa-preserved");
              get.onsuccess = () => {
                resolve(get.result);
                db.close();
              };
              get.onerror = () => reject(get.error);
            };
          }),
      );
    assert.deepEqual(await readWorkout(), sentinel);
    await page.goto(origin + "/settings");
    await page.getByRole("button", { name: "Auf Updates prüfen" }).waitFor();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "JSON-Backup exportieren" }).click();
    const download = await downloadPromise;
    const exported = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
    assert.deepEqual(exported.workouts[0], sentinel);
    await context.setOffline(true);
    await page.reload();
    await page.getByRole("heading", { name: "Einstellungen" }).waitFor();
    await page.getByRole("button", { name: "Auf Updates prüfen" }).click();
    await page
      .getByText("Offline. Deine gespeicherten Trainings bleiben verfügbar.")
      .waitFor();
    assert.deepEqual(await readWorkout(), sentinel);
    console.log(
      "PASS: legacy worker replaced with tab open; no forced reload; screenshot entry removed; exact workout retained; JSON export retained; offline reload and update feedback work.",
    );
  } finally {
    await browser.close();
  }
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => server.close());
