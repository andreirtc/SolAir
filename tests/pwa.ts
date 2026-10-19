import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = "http://127.0.0.1:4173";
await page.goto(base);
await page.waitForFunction(() => !!navigator.serviceWorker.controller, {
  timeout: 45000,
});
const worker=context.serviceWorkers().find(w=>w.url().endsWith('/sw.js'));
assert.ok(worker,'The application service worker must be running');
await worker.evaluate(()=>{
  const scope=globalThis as any;scope.solairUnhandledErrors=[];
  scope.addEventListener('unhandledrejection',(event:any)=>scope.solairUnhandledErrors.push(String(event.reason)));
  scope.addEventListener('error',(event:any)=>scope.solairUnhandledErrors.push(String(event.message)));
});
await page.getByLabel("Email address").fill("driver@solair.local");
await page.getByLabel("Password", { exact: true }).fill("SolairDemo!2026");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page
  .getByRole("heading", { name: "Ready for the road, Miguel." })
  .waitFor();
assert.equal(await page.getByLabel("Data mode").inputValue(), "hardware");
const manifest = await page.request
  .get(base + "/manifest.webmanifest")
  .then((r) => r.json());
assert.equal(manifest.display, "standalone");
// Consume responses immediately while cache writes run in the worker.
await page.evaluate(async()=>{
  await Promise.all(Array.from({length:8},(_,i)=>fetch('/bemac-white.png?cache-race-fixture='+i).then(r=>r.arrayBuffer())));
  await fetch('/_next/image?url=%2Fbemac-white.png&w=640&q=75').then(r=>r.arrayBuffer());
});
await page.waitForFunction(async()=>{
  const name=(await caches.keys()).find(k=>k.startsWith('solair-shell-'));
  const cache=await caches.open(name!);
  return !!await cache.match('/bemac-white.png?cache-race-fixture=7')&&!!await cache.match('/_next/image?url=%2Fbemac-white.png&w=640&q=75');
});
assert.deepEqual(await worker.evaluate(()=>(globalThis as any).solairUnhandledErrors),[]);
const cached = await page.evaluate(async () => {
  const name = (await caches.keys()).find(k => k.startsWith("solair-shell-"));
  const cache = await caches.open(name!);
  return (await cache.keys()).map((r) => r.url);
});
assert.ok(cached.some((u) => u.endsWith(".js")));
assert.ok(cached.some((u) => u.endsWith(".woff2")));
assert.ok(cached.every((u) => !u.includes("/api/")));
const cdp = await context.newCDPSession(page);
const installability = await cdp.send("Page.getInstallabilityErrors");
assert.deepEqual(installability.installabilityErrors, []);
await page.screenshot({
  path: "docs/screenshots/driver-real-mode.png",
  fullPage: true,
});
await context.setOffline(true);
await page.reload();
await page.getByRole("heading", { name: "Welcome to SOLAIR" }).waitFor();
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  true,
);
await page.screenshot({
  path: "docs/screenshots/offline-shell.png",
  fullPage: true,
});
assert.deepEqual(errors, []);
const result = {
  at: new Date().toISOString(),
  environment: "local production-build QA, not hosted deployment",
  results: [
    "Secure localhost session signs in",
    "Production defaults to hardware mode",
    "Manifest standalone/mobile/icons present",
    "Service worker controls page",
    "Chromium reports no PWA installability errors",
    "Hashed scripts and local fonts precached",
    "No API/location/message responses cached",
    "Cold offline shell renders",
    "390px production layout has no horizontal overflow",
    "No runtime errors",
    "Immediate image response consumption and background cache writes produce no service-worker errors",
  ],
  cachedAssets: cached.length,
  errors,
};
writeFileSync("docs/pwa-results.json", JSON.stringify(result, null, 2));
console.log(result);
await browser.close();
