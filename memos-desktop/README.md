# Memos Desktop (Tauri)

This folder will house the Tauri configuration.
Because Tauri relies on Rust and the local system environment for OS-specific compilation,
we are setting up the structure here.

To run this locally on a Windows/macOS machine:
1. Ensure Rust and Node.js are installed.
2. Initialize Tauri: \`npx create-tauri-app@latest\`
3. Link the `../memos-app/dist` (web export of Expo) to Tauri's `distDir`.
4. Configure \`tauri.conf.json\` and use the \`@tauri-apps/api/globalShortcut\` to bind \`Ctrl+Space\` to trigger the quick note window.
