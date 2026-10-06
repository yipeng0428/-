# 天机盘

最新文件：[V237.2 代码整理与性能优化版](releases/天机盘_v237.2_代码整理性能优化版.html)。交付仍是一个独立 HTML，使用时不需要 Node、构建工具或后台服务。

- [V237.2 整理说明与验证结果](reviews/V237.2-cleanup-and-validation.md)
- [V237.2 浏览器验证证据](reviews/V237.2-validation.json)
- [V237.1 安全稳定修订记录](reviews/V237.1-changes-and-validation.md)
- [V236 深入技术审查](reviews/V236-technical-review.md)

`src/` 是当前维护入口，`sources/` 保留用户上传的原始文件，`releases/` 保留交付版本。浏览器人物资料按来源保存；换文件名、域名或浏览器后，不保证自动共享，可通过原版人物 JSON 导出、再导入新版。GitHub 保存项目文件，不会自动保存浏览器人物库、接口密钥或聊天记录。

## 维护与构建

需要 Node 和 npm（本次使用 Node 24），无需安装运行时框架：

```bash
cd tianjipan
bash tools/setup-cloud.sh
npm run format:check
npm run build
```

安装脚本使用锁文件校验依赖，缓存放在 `/tmp`；`node_modules/` 和缓存不会提交。构建产物为 `releases/天机盘_v237.2_代码整理性能优化版.html`。修改 `src/` 后重新构建，不直接修改产物；当前构建不依赖历史补丁脚本。`rebuild-v237-r1.py` 只用于重建历史 V237.1。

`src/blocks.json` 保存原有执行、样式顺序。`src/js/core/` 将主脚本拆成时间与计算、规则、典籍与姓名、天文、渲染、人物与关系、导出、盘库、参考页面、出生与启动十个部分；构建时按顺序拼接到同一个经典脚本，保留全局词法作用域。各功能模块不重排；紫微、七政等历史算法依赖仍保留。`src/assets/` 的静态典籍、姓名和图片内容构建时原样嵌回。源码可读，交付文件压缩，并保留许可注释。

## 验证

需要 Playwright（锁文件安装）和 Chromium（当前环境 `/usr/bin/chromium`）。可通过 `TJ_CHROMIUM` 指定已安装浏览器路径；安装脚本不自动下载浏览器。测试会启动自己的临时 HTTP 服务，默认阻断外网。

```bash
cd tianjipan
npm test
```

默认测试覆盖安全回归、日期与人物输入、存储失败回滚、手机布局、24 组新旧计算对照、全部主页面、旧数据迁移和性能采样。可选可信外部库测试：

```bash
node --use-env-proxy tools/fetch-test-fixtures.mjs /tmp/tianjipan-test-fixtures
TJ_VENDOR_DIR=/tmp/tianjipan-test-fixtures npm test
```

上述下载命令在当前 Node 24 云环境验证通过，使用正常 TLS 与已固定 SHA-256；不匹配时停止。夹具放在 `/tmp`，不会打包或提交到仓库。四个夹具用于验证按需加载、脚本篡改拒绝与并发加载。性能测试交替加载新旧文件，各取三次样本；数据反映当前容器，不代表手机实机。

## 使用方式与边界

开发检查可使用本地 HTTP：

```bash
cd tianjipan
python -m http.server 8000 --bind 127.0.0.1
```

直接双击的 `file://` 模式在本次云环境被策略禁止，未完成验证。历法、紫微、八字交叉校验器改为按需联网，不再保存可执行源码到 localStorage；主排盘独立运行。可选 Astronomy Engine 仍保留固定来源、完整性校验和离线缓存，须明确选择启用。个人数据、设置与人工校准不作为缓存删除。

当前版本仍保留较多全局函数及实际使用的算法兼容层，尚未完成整个应用的状态隔离；极早日期和边界日期须继续结合底层农历支持范围验证。此次验证确认计算结果一致，不证明传统解释或历史星历的科学准确度。
