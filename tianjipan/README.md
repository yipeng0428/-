# 天机盘

最新可用文件：[V237.1 安全稳定修订版](releases/天机盘_v237_安全稳定修订版.html)。它仍是一个 HTML 文件，页面显示版本 V237.1，用于区分用户上传的原始 V237。

**使用新版前，先在原版导出人物 JSON 备份，再在新版导入。** 浏览器本地数据按来源保存，换文件名、域名或浏览器后不保证自动共享。人物 JSON 不包含旧版单一全局童限设置；新版需要为当前出生输入重新设置人工校准。

- [修订说明、验证与后续建议](reviews/V237.1-changes-and-validation.md)
- [V236 深入技术审查](reviews/V236-technical-review.md)
- [V237.1 浏览器验证证据](reviews/V237.1-validation.json)
- `sources/`：用户提供的 V236、V237 原始文件，保留用于比较与恢复。
- `releases/`：交付 HTML。它不需要安装 Node 或运行构建工具。

开发时建议通过本地 HTTP 检查：

```bash
cd tianjipan
python -m http.server 8000 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8000/releases/天机盘_v237_安全稳定修订版.html`。直接双击的 `file://` 模式在本次云环境被策略禁止，未完成该模式验证。外部校验器需要联网或已验证缓存；核心排盘与校验器分别运行。非安全 HTTP 来源缺少 Web Crypto 时，两项校验器会拒绝执行无法验证的源码。

修订可从原始 V237 重建，无需联网：

```bash
python tianjipan/tools/rebuild-v237-r1.py
```

浏览器测试需要 Node、Playwright 和 Chromium，测试会自动启动临时回环 HTTP 服务、阻断外部请求：

```bash
node tianjipan/tests/v237-regression.cjs /tmp/v237-validation.json
```

可用 `TJ_CHROMIUM` 指定 Chromium 路径。可选 `TJ_VENDOR_DIR` 指向包含 `vendor-iztro.js` 和 `vendor-lunar-javascript.js` 的目录，运行可信外部校验器夹具及并发加载测试；文件需与 HTML 固定 SHA-256 匹配。本仓库不包含依赖缓存。构建脚本只接受登记 SHA-256 的原始 V237，遇到不同源文件应重新审查。

GitHub 保存的是源文件、交付文件、说明和测试，不会自动保存用户浏览器的人物库、接口密钥或聊天记录。
