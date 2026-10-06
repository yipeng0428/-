(() => {
  const BUILD = "V195";
  try {
    const bv = document.getElementById("buildVersion");

    document
      .querySelectorAll("footer")
      .forEach((ft) =>
        ft.querySelectorAll('span[id$="Badge"],[id*="Badge"]').forEach((x) => x.remove()),
      );
  } catch (_) {}
})();
