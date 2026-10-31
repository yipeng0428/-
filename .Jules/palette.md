## 2024-05-23 - Focus States for Layer Switches
**Learning:** Found that the layer switch buttons (`#layerSw button` and `#zmLayers button`) lack a `focus-visible` outline in this application, making keyboard navigation difficult. They also have an `aria-pressed` missing. Adding `.layersw button:focus-visible` with a proper outline improves accessibility.

**Action:** Added `focus-visible` styling for layer switch buttons.
