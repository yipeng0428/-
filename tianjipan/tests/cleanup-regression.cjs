/* Compare matched workloads; never use a fresh cache as evidence of preserved user data. */
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict"),
  { spawnSync } = require("node:child_process"),
  { chromium } = require("playwright");
const root = path.resolve(__dirname, ".."),
  current = path.join(root, "releases/天机盘_v237.2_代码整理性能优化版.html"),
  baseline = path.join(root, "releases/天机盘_v237_安全稳定修订版.html");
const output = process.argv[2] || path.join(root, "reviews/V237.2-validation.json");
const report = {
  checks: [],
  limitations: [
    "Chromium 经本地 HTTP 测试；执行环境禁止 file://，未验证直接双击打开。",
    "匹配负载仅代表当前容器；不代表手机实机性能，也不验证历史星历的科学准确度。",
  ],
};
function pass(name, detail) {
  report.checks.push({ name, ok: true, detail });
  console.log("PASS " + name);
}
async function run() {
  const targeted = spawnSync(
    process.execPath,
    [path.join(__dirname, "v237-regression.cjs"), "/tmp/tj-r2-targeted.json"],
    {
      env: {
        ...process.env,
        TJ_HTML_PATH: current,
        TJ_BASELINE_PATH: baseline,
        TJ_EXPECT_VERSION: "v237.2",
        TJ_ON_DEMAND_VERIFY: "1",
      },
      encoding: "utf8",
    },
  );
  process.stdout.write(targeted.stdout);
  process.stderr.write(targeted.stderr);
  report.targeted = JSON.parse(fs.readFileSync("/tmp/tj-r2-targeted.json"));
  assert.equal(targeted.status, 0);
  pass("V237.1 stability regressions retained", {
    groups: report.targeted.checks.length,
  });
  const html = fs.readFileSync(current),
    before = fs.readFileSync(baseline),
    server = http.createServer((req, res) => {
      res.setHeader("Content-Type", "text/html;charset=utf-8");
      res.end(req.url === "/before" ? before : html);
    });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const origin = "http://127.0.0.1:" + server.address().port;
  report.artifact = {
    file: path.basename(current),
    bytes: html.length,
    sha256: require("node:crypto").createHash("sha256").update(html).digest("hex"),
  };
  const { parse } = require("acorn");
  const { simple } = require("acorn-walk");
  function embeddedAssets(bytes) {
    const assets = {};
    for (const block of bytes.toString().matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
      simple(parse(block[1], { ecmaVersion: "latest" }), {
        VariableDeclarator(node) {
          if (
            ["DONATE_IMG", "CZ_RAW", "NAME_DATA"].includes(node.id.name) &&
            node.init?.type === "Literal"
          )
            assets[node.id.name] = node.init.value;
        },
      });
    }
    return assets;
  }
  assert.deepEqual(embeddedAssets(html), embeddedAssets(before));
  pass("embedded classical text, names and donation image retain exact contents");
  const browser = await chromium.launch({
    executablePath: process.env.TJ_CHROMIUM || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  async function pageFor(route) {
    const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      }),
      page = await context.newPage(),
      errors = [],
      requests = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => {
      requests.push(r.request().url());
      return r.abort();
    });
    await page.addInitScript(() => {
      const c = (window.__cleanupMetrics = {
          storageWrites: {},
          bodyMutations: 0,
          intervals: [],
        }),
        write = Storage.prototype.setItem,
        interval = window.setInterval;
      Storage.prototype.setItem = function (k, v) {
        c.storageWrites[k] = (c.storageWrites[k] || 0) + 1;
        return write.call(this, k, v);
      };
      window.setInterval = function (fn, ms, ...args) {
        c.intervals.push(ms);
        return interval(fn, ms, ...args);
      };
      document.addEventListener("DOMContentLoaded", () =>
        new MutationObserver((m) => (c.bodyMutations += m.length)).observe(document.body, {
          childList: true,
          subtree: true,
        }),
      );
    });
    await page.goto(origin + route);
    await page.waitForTimeout(1000);
    return { context, page, errors, requests };
  }
  try {
    const old = await pageFor("/before"),
      fresh = await pageFor("/");
    const snapshot = (p) =>
      p.evaluate(() => {
        const out = [];
        for (const civ of [
          { y: 1950, m: 1, d: 31, h: 0, mi: 0, s: 0 },
          { y: 1990, m: 1, d: 15, h: 12, mi: 0, s: 0 },
          { y: 2000, m: 2, d: 29, h: 23, mi: 30, s: 0 },
          { y: 2024, m: 2, d: 29, h: 7, mi: 59, s: 59 },
          { y: 2025, m: 12, d: 21, h: 23, mi: 0, s: 0 },
          { y: 1988, m: 8, d: 8, h: 8, mi: 8, s: 0 },
        ])
          for (const gender of ["M", "F"])
            for (const lon of [0, 117.8]) {
              const r = computeAll(civ, {
                  lon,
                  lat: 24.5,
                  solar: true,
                  gender,
                }),
                q = qzCalc(r);
              out.push({
                civ,
                gender,
                lon,
                time: r.t,
                bazi: r.bz,
                lunar: r.lunar,
                qimen: r.qm,
                ziwei: r.zw,
                qizheng: {
                  isDay: q.isDay,
                  mingZhi: q.mingZhi,
                  mingDegreeLon: q.mingDegreeLon,
                  shenZhi: q.shenZhi,
                  planets: q.planets,
                  residuals: q.residuals,
                  dongwei: q.dongweiV236,
                },
              });
            }
        return JSON.parse(JSON.stringify(out));
      });
    const afterSamples = await snapshot(fresh.page);
    assert.deepEqual(afterSamples, await snapshot(old.page));
    pass("24 date/gender/longitude calculation snapshots match V237.1", {
      samples: afterSamples.length,
    });
    assert.equal(fresh.requests.length, 0);
    pass("default startup has zero external requests");
    const tabs = await fresh.page.evaluate(() => [
      ...new Set([...document.querySelectorAll(".tab[data-tab]")].map((n) => n.dataset.tab)),
    ]);
    assert(tabs.length >= 40, "Expected the real navigation entries");
    for (const tab of tabs) {
      await fresh.page.locator(`.tab[data-tab="${tab}"]`).first().click();
      await fresh.page.waitForTimeout(150);
      const state = await fresh.page.evaluate(
        (t) => ({
          exists: !!document.getElementById("pane-" + t),
          text: document.getElementById("pane-" + t)?.innerText || "",
        }),
        tab,
      );
      assert(state.exists, tab);
      assert(!/这一页渲染出错:|ReferenceError:|TypeError:/.test(state.text), tab);
    }
    assert.deepEqual(fresh.errors, []);
    pass("all top-level panes render without uncaught errors", { panes: tabs });
    await fresh.page.evaluate(() => selectTab("qizheng"));
    await fresh.page.waitForTimeout(300);
    const panels = await fresh.page.evaluate(() => ({
      ids: [...document.querySelectorAll("#pane-qizheng section[id]")].map((n) => n.id).sort(),
      scheduler: TianjiPaneScheduler.snapshot(),
    }));
    await old.page.evaluate(() => selectTab("qizheng"));
    await old.page.waitForTimeout(500);
    const oldIDs = await old.page.evaluate(() =>
      [...document.querySelectorAll("#pane-qizheng section[id]")].map((n) => n.id).sort(),
    );
    assert.deepEqual(panels.ids, oldIDs);
    assert(panels.ids.includes("q237ResidualDrift"));
    assert.equal(panels.scheduler.extensionCount, 18);
    pass("all Qizheng extension panels retained", panels);
    const a = await fresh.page.evaluate(() => TianjiPaneScheduler.snapshot());
    await fresh.page.waitForTimeout(1600);
    const b = await fresh.page.evaluate(() => TianjiPaneScheduler.snapshot());
    assert.equal(a.mounts, b.mounts);
    assert(!(await fresh.page.evaluate(() => __cleanupMetrics.intervals)).includes(1400));
    pass("no idle remount or retired 1400 ms poll");
    await fresh.page.evaluate(() =>
      TJPeople.add({
        id: "single-write",
        name: "单次保存",
        dt: "1992-01-01T12:00",
      }),
    );
    const writes = await fresh.page.evaluate(() => __cleanupMetrics.storageWrites);
    assert(!writes["tianjipan.people.v3"]);
    assert(writes["tianjipan.people.master.v1"]);
    pass("people persistence writes the authoritative record only", writes);
    await old.context.close();
    await fresh.context.close();
    const mc = await browser.newContext(),
      mp = await mc.newPage();
    await mp.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
    await mp.addInitScript(() => {
      localStorage.setItem(
        "tianji.vendor.iztro@2.6.1-b78dfe391f65",
        'throw new Error("retired-cache-executed")',
      );
      localStorage.setItem(
        "tianji.vendor.lunar-javascript@1.7.7",
        'throw new Error("retired-cache-executed")',
      );
      localStorage.setItem(
        "tianjipan.people.v3",
        JSON.stringify({
          people: [{ id: "v3-survivor", name: "旧库保留", dt: "1990-01-01T12:00" }],
          rels: [],
        }),
      );
      localStorage.setItem("personal-unrelated", "KEEP");
    });
    await mp.goto(origin);
    await mp.waitForTimeout(300);
    const stored = await mp.evaluate(() => ({
      a: localStorage.getItem("tianji.vendor.iztro@2.6.1-b78dfe391f65"),
      b: localStorage.getItem("tianji.vendor.lunar-javascript@1.7.7"),
      other: localStorage.getItem("personal-unrelated"),
      legacy: localStorage.getItem("tianjipan.people.v3"),
      people: TJPeople.list(),
    }));
    assert.equal(stored.a, null);
    assert.equal(stored.b, null);
    assert.equal(stored.other, "KEEP");
    assert(stored.legacy);
    assert(stored.people.some((p) => p.id === "v3-survivor"));
    pass("precise cache retirement preserves and migrates legacy people", stored);
    await mc.close();
    // Pinned vendor fixtures are optional; online execution must retain the same trust gate.
    if (process.env.TJ_VENDOR_DIR) {
      const ec = await browser.newContext(),
        ep = await ec.newPage();
      let valid = false,
        fetches = 0;
      const engineBytes = fs.readFileSync(
        path.join(process.env.TJ_VENDOR_DIR, "vendor-astronomy-engine.js"),
      );
      await ep.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => {
        const u = r.request().url();
        if (u.includes("astronomy-engine@2.1.19") || u.includes("cosinekitty/astronomy/")) {
          fetches++;
          return r.fulfill({
            status: 200,
            contentType: "text/javascript",
            headers: { "access-control-allow-origin": "*" },
            body: valid ? engineBytes : Buffer.from("window.__engineProbe=1;"),
          });
        }
        return r.abort();
      });
      await ep.goto(origin);
      await ep.waitForTimeout(250);
      const rejected = await ep.evaluate(async () => {
        window.__engineProbe = 0;
        try {
          await TianjiQizhengAdoptionV226.load();
          return { rejected: false };
        } catch (error) {
          return {
            rejected: true,
            message: error.message,
            probe: __engineProbe,
            loaded: TianjiQizhengEphemerisV225.loaded(),
            externalScripts: [...document.scripts].filter((s) => s.src).length,
          };
        }
      });
      assert(rejected.rejected);
      assert.equal(rejected.probe, 0);
      assert.equal(rejected.loaded, false);
      assert.equal(rejected.externalScripts, 0);
      pass("modified astronomy sources rejected without unverified script fallback", rejected);
      valid = true;
      const concurrent = await ep.evaluate(async () => {
        await Promise.all([
          TianjiQizhengVendorV227.cache(),
          TianjiQizhengEphemerisV225.load(),
          TianjiQizhengAdoptionV226.load(),
        ]);
        return {
          loaded: TianjiQizhengEphemerisV225.loaded(),
          cache: await TianjiQizhengVendorV227.verify(),
          planets: TianjiQizhengEphemerisV225.planets(2451545),
        };
      });
      assert(concurrent.loaded);
      assert(concurrent.cache.ok);
      assert(Array.isArray(concurrent.planets) && concurrent.planets.length >= 7);
      assert(concurrent.planets.every((p) => Number.isFinite(p.lon)));
      assert.equal(fetches, 3);
      pass("concurrent cache and engine load executes verified ephemeris", {
        requests: fetches,
        cache: concurrent.cache,
      });
      await ec.close();
    }
    if (process.env.TJ_VENDOR_DIR) {
      const vendorCheck = spawnSync(
        process.execPath,
        [path.join(__dirname, "vendor-loader-regression.cjs")],
        { env: process.env, encoding: "utf8" },
      );
      process.stdout.write(vendorCheck.stdout);
      process.stderr.write(vendorCheck.stderr);
      assert.equal(vendorCheck.status, 0);
      report.mystilight = JSON.parse(
        fs.readFileSync(path.join(root, "reviews/V237.2-vendor-loader.json")),
      );
      pass(
        "Mystilight checksum rejection and concurrent verified module loading",
        report.mystilight,
      );
    }
    const samples = [];
    for (let i = 0; i < 3; i++)
      for (const route of i % 2 ? ["/", "/before"] : ["/before", "/"]) {
        const entry = await pageFor(route);
        const startup = await entry.page.evaluate(() => ({
          dclMs: performance.getEntriesByType("navigation")[0].domContentLoadedEventEnd,
          ...__cleanupMetrics,
        }));
        startup.requests = entry.requests.length;
        await entry.page.evaluate(() => {
          window.__qzCalls = 0;
          __cleanupMetrics.bodyMutations = 0;
          const calc = qzCalc;
          qzCalc = function (...a) {
            __qzCalls++;
            return calc.apply(this, a);
          };
        });
        await entry.page.locator('.tab[data-tab="qizheng"]').first().click();
        await entry.page.waitForTimeout(500);
        const chart = await entry.page.evaluate(() => ({
          qzCalls: __qzCalls,
          domMutations: __cleanupMetrics.bodyMutations,
          scheduler: window.TianjiPaneScheduler?.snapshot(),
        }));
        samples.push({
          artifact: route === "/" ? "V237.2" : "V237.1",
          startup,
          chart,
        });
        assert.deepEqual(entry.errors, []);
        await entry.context.close();
      }
    const median = (a) => [...a].sort((a, b) => a - b)[Math.floor(a.length / 2)],
      comparison = {};
    for (const artifact of ["V237.1", "V237.2"]) {
      const ss = samples.filter((s) => s.artifact === artifact);
      comparison[artifact] = {
        dclMedianMs: median(ss.map((s) => s.startup.dclMs)),
        startupRequests: median(ss.map((s) => s.startup.requests)),
        startupDOMMutations: median(ss.map((s) => s.startup.bodyMutations)),
        qizhengPublicCalls: median(ss.map((s) => s.chart.qzCalls)),
        qizhengDOMMutations: median(ss.map((s) => s.chart.domMutations)),
      };
    }
    report.performance = {
      samples,
      comparison,
      bytes: { before: before.length, after: html.length },
      method:
        "同一 Chromium、全新 context、外网阻断、交替顺序，各 3 次；启动等待 1000 ms，点击七政页后等待 500 ms。DCL 不包含全部异步工作。",
    };
    assert(comparison["V237.2"].startupRequests < comparison["V237.1"].startupRequests);
    assert(html.length < before.length);
    pass("matched workload reduces payload and startup work", comparison);
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
}
run()
  .then(() => (report.ok = true))
  .catch((e) => {
    report.ok = false;
    report.error = e.stack;
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n"));
