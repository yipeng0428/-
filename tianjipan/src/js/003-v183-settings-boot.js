(function () {
  try {
    var K = "tianjipan.settings.v1",
      raw = null,
      s = null,
      old = null;
    try {
      raw = localStorage.getItem(K);
      s = raw ? JSON.parse(raw) : null;
    } catch (_) {}
    try {
      old = localStorage.getItem("tianjipan.theme");
    } catch (_) {}
    var choice =
      (s && s.appearance && s.appearance.theme) ||
      (old === "light" ? "xuanpaper" : old === "dark" ? "xuanye" : "auto");
    var actual = "dark";
    if (choice === "xuanpaper" || choice === "cinnabar" || choice === "jade") actual = "light";
    else if (choice === "xuanye" || choice === "ziwei") actual = "dark";
    else
      actual = matchMedia && matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    document.documentElement.setAttribute("data-tj-theme", choice);
    document.documentElement.setAttribute("data-theme", actual);
    var fs = (s && s.appearance && Number(s.appearance.fontScale)) || 1;
    fs = Math.max(0.85, Math.min(1.3, fs));
    document.documentElement.style.setProperty("--tj-font-scale", String(fs));
    var fk = (s && s.appearance && s.appearance.fontFamily) || "serif";
    if (!/^(serif|kai|fangsong|sans|system)$/.test(fk)) fk = "serif";
    document.documentElement.setAttribute("data-tj-font", fk);
    var ls = s && s.appearance && Number(s.appearance.letterSpacing);
    if (!isFinite(ls)) ls = 0.015;
    ls = Math.max(0, Math.min(0.08, ls));
    document.documentElement.style.setProperty("--tj-letter-spacing", ls + "em");
    if (s && s.appearance && s.appearance.reduceMotion)
      document.documentElement.setAttribute("data-tj-motion", "reduced");
    if (s && s.appearance && s.appearance.stars === false)
      document.documentElement.setAttribute("data-tj-stars", "off");
  } catch (e) {}
})();
