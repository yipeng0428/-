/** Download test fixtures over verified TLS and validate pinned bytes before saving. */
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
const directory = path.resolve(
  process.argv[2] || path.join(os.tmpdir(), "tianjipan-test-fixtures"),
);
const fixtures = [
  {
    file: "vendor-mystilight.js",
    url: "https://raw.githubusercontent.com/mystilight/mystilight-8char/1ca2923784128fca4d38959e46ae714e4ab6b9cb/index.js",
    sha256: "75893e7a97aaae4029137077ee0e06f4ecb5b10ea9e47191b4480b0056ffc9a1",
  },
  {
    file: "vendor-iztro.js",
    url: "https://cdn.jsdelivr.net/npm/iztro@2.6.1/dist/iztro-v2.6.1.min.js",
    sha256: "effb3fa5123125ebc564ba7d80d61d6763e0d6ba96e82fc8a1790f2c156b7d9f",
  },
  {
    file: "vendor-lunar-javascript.js",
    url: "https://cdn.jsdelivr.net/npm/lunar-javascript@1.7.7/lunar.js",
    sha256: "9750324bfe1aa63c146f8c72b1143df924466c11c8a5277d7d9225c541a18aaa",
  },
  {
    file: "vendor-astronomy-engine.js",
    url: "https://raw.githubusercontent.com/cosinekitty/astronomy/865d3da7d8112bbc7911238052c6af4aaf877181/source/js/astronomy.browser.min.js",
    sha256: "d1b3ab4b86aa409f78c0f0d95162a847496cba7e938eb6f4712cf9c1c45f4a2e",
  },
];
await fs.mkdir(directory, { recursive: true });
for (const fixture of fixtures) {
  const response = await fetch(fixture.url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${fixture.file}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (crypto.createHash("sha256").update(bytes).digest("hex") !== fixture.sha256)
    throw new Error(`${fixture.file}: integrity mismatch`);
  await fs.writeFile(path.join(directory, fixture.file), bytes);
  console.log(`${fixture.file}: verified (${bytes.length} bytes)`);
}
console.log(directory);
