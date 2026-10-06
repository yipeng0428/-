/** The only writer of visible release identity. */
(() => {
  "use strict";
  const build = window.TianjiBuild;
  const capabilities = {
    qimenExternalGolden: true,
    once: true,
    qimenSecondReference: true,
    qimenDoctrineRegistry: true,
    qimenDayPrimaryEvidence: true,
    qizhengFoundation: true,
    qizhengEphemerisAdapter: true,
    qizhengCoreAdopted: false,
    qizhengControlledAdoption: true,
    qizhengOfflineVendorCache: true,
    qizhengResidualEpoch: true,
    qizhengHistoricalXiuFrame: true,
    qizhengAbsoluteZero: true,
    qizhengResidualProviders: true,
    qizhengLifeRulePack: true,
    terminologyCorrected: true,
    qizhengStrengthRulePack: true,
    bianYaoExpanded: true,
    qizhengDongweiPreflight: true,
    qizhengLiangtianchi: true,
    qizhengLiangtianchiGrid: true,
    autoTongLimit: true,
    qizhengResidualLongBaseline: true,
  };
  // Retired executable shadow-verifier caches only; never clear personal records or settings.
  for (const key of [
    "tianji.vendor.iztro@2.6.1-b78dfe391f65",
    "tianji.vendor.lunar-javascript@1.7.7",
  ]) {
    try {
      localStorage.removeItem(key);
    } catch (_) {}
  }
  function publish() {
    document.title = "天机盘 " + build.display;
    const badge = document.getElementById("buildVersion"),
      text = "版本 · " + build.display;
    if (badge && badge.textContent !== text) badge.textContent = text;
    const data = document.documentElement.dataset;
    if (data.tjBuild !== build.version) data.tjBuild = build.version;
    if (data.tjEdition !== build.edition) data.tjEdition = build.edition;
    window.TianjiSystem = Object.freeze({
      ...window.TianjiSystem,
      ...capabilities,
      ...build,
      algorithmChanged: false,
      productionProviderChanged: false,
      singleBuildAuthority: true,
      paneLifecycle: true,
    });
  }
  window.TianjiRelease = Object.freeze({
    publish,
    capabilities: Object.freeze(capabilities),
  });
  TianjiPaneScheduler.install();
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", publish, { once: true });
  else publish();
})();
