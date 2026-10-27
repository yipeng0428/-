## 2026-10-27 - Icon-only buttons lacking ARIA labels
**Learning:** Found multiple instances of icon-only zoom buttons (using symbols like `−` and `＋`) in `tianjipan/src/js/038-v71-dizhi-hand-js.js` that lack accessible names (no `aria-label` or `title`), which impacts screen reader users and tooltip accessibility.
**Action:** Added proper `aria-label` and `title` attributes ("缩小" for minus, "放大" for plus) to improve accessibility and hover context for icon-only buttons.
