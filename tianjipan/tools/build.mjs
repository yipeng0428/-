/** Deterministic standalone build from maintained sources; no historical patch replay. */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { minify } from "terser";
import postcss from "postcss";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "src");
const manifest = JSON.parse(await fs.readFile(path.join(sourceRoot, "blocks.json"), "utf8"));
let html = await fs.readFile(path.join(sourceRoot, "shell.html"), "utf8");
let duplicateRules = 0;
const assets = {
  DONATE_IMG: "donation-image.txt",
  CZ_RAW: "cz_raw.txt",
  NAME_DATA: "name_data.txt",
};

for (const block of manifest) {
  const filename = path.resolve(sourceRoot, block.path);
  if (!filename.startsWith(sourceRoot + path.sep)) throw new Error("Invalid source path");
  let code;
  if (block.parts) {
    const parts = [];
    for (const part of block.parts) {
      const source = path.resolve(sourceRoot, part);
      if (!source.startsWith(sourceRoot + path.sep)) throw new Error("Invalid source part");
      parts.push(await fs.readFile(source, "utf8"));
    }
    code = parts.join("\n");
  } else code = await fs.readFile(filename, "utf8");
  if (block.kind === "script") {
    for (const [name, asset] of Object.entries(assets)) {
      const marker = `__TJ_ASSET_${name}__`;
      if (code.includes(marker)) {
        const value = await fs.readFile(path.join(sourceRoot, "assets", asset), "utf8");
        code = code.replace(marker, JSON.stringify(value).replaceAll("<", "\\u003c"));
      }
    }
    const built = await minify(code, {
      mangle: false,
      compress: {
        defaults: false,
        dead_code: true,
        unused: true,
        side_effects: true,
        drop_debugger: true,
        toplevel: false,
      },
      keep_fnames: true,
      keep_classnames: true,
      format: {
        comments: /@license|@preserve|copyright|^!/i,
        inline_script: true,
      },
    });
    code = built.code;
  } else {
    const css = postcss.parse(code, { from: filename });
    const visit = (container) => {
      const seen = new Set();
      for (const node of [...(container.nodes || [])].reverse()) {
        if (node.type === "rule") {
          const signature = node.toString();
          if (seen.has(signature)) {
            node.remove();
            duplicateRules++;
            continue;
          }
          seen.add(signature);
        }
        if (node.nodes) visit(node);
      }
    };
    visit(css);
    css.walk((node) => {
      node.raws.before = "";
      node.raws.after = "";
      if (node.type === "decl") node.raws.between = ":";
      if (node.type === "rule" || node.type === "atrule") node.raws.between = "";
      if (node.type === "comment" && !/@license|copyright|^!/i.test(node.text)) node.remove();
    });
    css.raws.after = "";
    code = css.toString();
  }
  const marker = `<!-- TJ_BLOCK:${block.path} -->`;
  if (!html.includes(marker)) throw new Error(`Missing source slot: ${block.path}`);
  html = html.replace(marker, () => code);
}
if (html.includes("<!-- TJ_BLOCK:")) throw new Error("Unresolved source slot");
const output = path.join(root, "releases", "天机盘_v237.2_代码整理性能优化版.html");
await fs.writeFile(output, html);
const metadata = {
  file: path.basename(output),
  bytes: Buffer.byteLength(html),
  sha256: crypto.createHash("sha256").update(html).digest("hex"),
  scriptBlocks: manifest.filter((x) => x.kind === "script").length,
  styleBlocks: manifest.filter((x) => x.kind === "style").length,
  duplicateStyleRulesRemoved: duplicateRules,
};
await fs.writeFile(
  path.join(root, "reviews", "V237.2-build.json"),
  JSON.stringify(metadata, null, 2) + "\n",
);
console.log(JSON.stringify(metadata, null, 2));
