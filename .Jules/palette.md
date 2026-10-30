## 2026-10-30 - Added aria-pressed to toggle buttons
**Learning:** Found toggle buttons (layer switches) lacking `aria-pressed` state for screen reader awareness.
**Action:** Ensure toggle UI elements provide screen-reader visible state updates via `aria-pressed` or `aria-expanded` whenever active state toggles via CSS class like `.on`.
