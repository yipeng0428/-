(() => {
  "use strict";
  const BUILD = "v219 · 2026-10-06 17:00 +08:00";
  function inspect() {
    const issues = [];
    try {
      if (typeof zfPage !== "function") issues.push("zfPage missing");
      if (typeof zfBind !== "function") issues.push("zfBind missing");
      if (typeof zfSanitizeState !== "function") issues.push("zfSanitizeState missing");
      if (window.TianjiZiweiFlyingDepthV2?.selfTest) {
        const t = TianjiZiweiFlyingDepthV2.selfTest();
        if (t?.ok === false) issues.push("TianjiZiweiFlyingDepthV2 selfTest FAIL");
      }
      if (typeof R !== "undefined" && R?.zw) {
        zfSanitizeState(R.zw);
        if (!Array.isArray(R.zw.pal) || R.zw.pal.length < 12) issues.push("紫微十二宫数据不完整");
      }
    } catch (err) {
      issues.push(String(err?.message || err));
    }
    return {
      ok: issues.length === 0,
      issues,
      build: BUILD,
      state: {
        layer: typeof ZF !== "undefined" ? ZF.layer : null,
        sel: typeof ZF !== "undefined" ? ZF.sel : null,
        year: typeof ZF !== "undefined" ? ZF.year : null,
      },
    };
  }
  window.TianjiZiweiRenderFixV219 = Object.freeze({
    version: "1.0.0",
    build: BUILD,
    inspect,
    sanitize: () => {
      try {
        return typeof zfSanitizeState === "function" ? zfSanitizeState(R?.zw || null) : null;
      } catch (_) {
        return null;
      }
    },
    rerender: () => {
      try {
        refRender("zwfly");
        return true;
      } catch (_) {
        return false;
      }
    },
    manifest: () => ({
      module: "Ziwei Flying Render Fix V219 · compatibility layer",
      scope: "render-state/layout only",
      fixes: [
        "非法/旧焦点宫状态净化",
        "非法年份/层级净化",
        "缺失紫微数据时不再触发 bind 空指针",
        "V203 焦点宫 select 首帧合法化",
        "V203/V204 分段渲染错误边界",
        "飞星容器移动端/横向溢出加固",
      ],
      algorithmChanged: false,
    }),
  });
  window.TianjiSystemV219 = {
    version: "v219",
    build: BUILD,
    ziweiFlyingRenderFix: true,
    algorithmChanged: false,
    baseline: "v217",
  };
  /* V219 融合：可见版本号只由 TianjiBuild / final authority 管理，避免历史层互相抢写。 */
})();
