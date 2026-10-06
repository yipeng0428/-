(() => {
  "use strict";
  const B =
    window.TianjiBuild ||
    Object.freeze({
      version: "v219",
      display: "V219 · 融合工程版",
      build: "v219-fusion · 2026-10-06 19:29 +08:00",
      baseline: "v219-engineering",
    });
  /* 历史脚本中仍有延迟版本写入；最终权威只做轻量 textContent 校正，不扫描全 DOM。 */
  /* V221：最终版本 authority 移到文件尾；这里不再延迟抢写可见版本。 */
  window.TianjiFusionV219 = Object.freeze({
    version: B.version,
    display: B.display,
    build: B.build,
    manifest: () => ({
      base: "V219 工程重构版",
      stableFixesFromV218: [
        "紫微飞星状态净化",
        "缺失数据保护",
        "V203/V204 分段渲染错误边界",
        "飞星响应式容器修复",
      ],
      selectedIdeasFromV220: [
        "Runtime Lite",
        "Scope 生命周期",
        "模块登记/挂载/卸载",
        "统一 visibility resume scheduler",
        "PerformanceObserver long-task 计数",
        "更严格 HTML sanitizer",
      ],
      rejectedForNow: ["独立 runtime store", "Web Worker for JSON/SHA/sum"],
      fixes: [
        "主圆盘后台返回后 RAF 恢复条件 0/null bug",
        "删除紫微兼容层 V218 版本号抢写",
        "统一 TianjiBuild 单一版本权威",
      ],
      algorithmChanged: false,
    }),
  });
})();
