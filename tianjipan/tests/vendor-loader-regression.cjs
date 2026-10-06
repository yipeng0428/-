const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict"),
  { chromium } = require("playwright");
(async () => {
  const root = path.resolve(__dirname, ".."),
    bytes = fs.readFileSync(path.join(process.env.TJ_VENDOR_DIR, "vendor-mystilight.js"));
  const bad = Buffer.alloc(bytes.length, 32);
  bad.write("window.__mystilightProbe=1;");
  const html = fs.readFileSync(path.join(root, "releases/天机盘_v237.2_代码整理性能优化版.html"));
  const server = http.createServer((q, r) => {
    r.setHeader("Content-Type", "text/html;charset=utf-8");
    r.end(html);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({
    executablePath: process.env.TJ_CHROMIUM || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const p = await browser.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    let valid = false,
      requests = 0;
    await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => {
      if (r.request().url().includes("mystilight-8char")) {
        requests++;
        return r.fulfill({
          status: 200,
          contentType: "text/javascript",
          headers: { "access-control-allow-origin": "*" },
          body: valid ? bytes : bad,
        });
      }
      return r.abort();
    });
    await p.goto("http://127.0.0.1:" + server.address().port);
    await p.waitForTimeout(200);
    const rejected = await p.evaluate(async () => {
      window.__mystilightProbe = 0;
      await TianjiBaziVerifier.loadVendor(true);
      return {
        status: TianjiBaziVerifier.state.status,
        error: TianjiBaziVerifier.state.error,
        probe: __mystilightProbe,
      };
    });
    assert.equal(rejected.status, "unavailable");
    assert.equal(rejected.probe, 0);
    assert(rejected.error.includes("完整性"));
    assert.equal(requests, 3);
    valid = true;
    const accepted = await p.evaluate(async () => {
      await Promise.all([TianjiBaziVerifier.loadVendor(true), TianjiBaziVerifier.loadVendor(true)]);
      return {
        status: TianjiBaziVerifier.state.status,
        api: typeof TianjiBaziVerifier.state.vendor?.getCurrentEightCharJSON,
      };
    });
    assert.equal(accepted.status, "ready");
    assert.equal(accepted.api, "function");
    assert.equal(requests, 4);
    assert.deepEqual(errors, []);
    const result = {
      ok: true,
      rejected,
      accepted,
      requests,
      sourceSHA256: "75893e7a97aaae4029137077ee0e06f4ecb5b10ea9e47191b4480b0056ffc9a1",
      checks: [
        "same-length altered code is rejected before module execution",
        "fixed snapshot loads after validation",
        "parallel force loads share one fetch",
        "in-memory module URL is revoked in finally",
      ],
    };
    fs.writeFileSync(
      path.join(root, "reviews/V237.2-vendor-loader.json"),
      JSON.stringify(result, null, 2) + "\n",
    );
    console.log("PASS Mystilight pinned loader");
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
