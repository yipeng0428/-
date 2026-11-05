# Quick Note App - Product Design Document

## 1. 核心定位
一款以“快”为核心的跨平台记事本应用。优先保证移动端体验，同时支持 Web 网页端和 Windows 桌面端的多端同步。最核心的卖点是：**随时随地，一步呼出，闪电记录**。

## 2. 核心功能模块

### 2.1 闪电速记 (Quick Note) - 核心特色
为了满足“被另外的独立呼出，进行快速记录”的需求，我们需要在不同平台实现“全局速记”的入口：
*   **Android 端:**
    *   **桌面小组件 (Widget):** 提供1x1的快捷记录按钮，点击直接弹出半透明输入框，记录后立即收起。
    *   **通知栏常驻快捷键 (Quick Settings Tile):** 下拉通知栏即可点击记录。
    *   **悬浮窗 (Floating Window - 可选):** 提供边缘隐藏的悬浮球，点击呼出。
*   **iOS 端:**
    *   **桌面小组件 (Widget) & 锁屏小组件:** 点击快速跳转到速记界面。
    *   **Share Extension (分享扩展):** 在浏览器或其他App中，选中文本或图片，直接分享到 Quick Note。
    *   **快捷指令 (Shortcuts):** 支持 Siri 语音记录或双击/三击手机背面呼出。
*   **Windows 端:**
    *   **全局快捷键 (如 `Ctrl + Shift + Space`):** 无论在什么界面，按下快捷键即可呼出屏幕中央的极简输入框（类似 Mac 的 Raycast/Spotlight 或系统自带的便笺）。
*   **速记体验要求:**
    *   启动时间 < 0.5 秒。
    *   默认聚焦输入框，呼出即可打字。
    *   支持离线暂存，网络恢复后自动同步。

### 2.2 基础记事本功能
参考主流记事本（Apple Notes, 备忘录, Evernote, Notion, 锤子便签）：
*   **富文本编辑:** 支持加粗、斜体、列表、待办事项 (Checklist)。
*   **多媒体支持:** 插入图片、录音（语音转文字是一大加分项）。
*   **标签与分类:** 支持文件夹体系和 #标签 (Tags)，方便后期整理。
*   **置顶与收藏:** 重要笔记一键置顶。
*   **搜索:** 全文搜索，支持按标签、时间过滤。

### 2.3 多端同步
*   **云端存储:** 使用云数据库实时同步。
*   **离线优先 (Offline First):** 本地数据库作为唯一事实来源，所有操作先在本地完成，后台静默同步到云端。保证无网状态下依然丝滑。

## 3. 技术栈建议

为了能够同时覆盖移动端 (Android/iOS)、Web端和 Windows 桌面端，建议采用跨平台技术方案，以降低开发成本并保证多端一致性。

### 3.1 前端/客户端 (Client)
*   **核心框架推荐: React Native (配合 Expo) 或 Flutter**
    *   *推荐理由:* 这两者都能用一套代码编译出 iOS 和 Android 原生应用。
    *   *React Native:* 如果你熟悉 React 和 JavaScript/TypeScript，这是首选。配合 Expo 可以极大简化开发和打包流程。支持 Web 端导出。
    *   *Flutter:* 性能上限更高，UI 一致性极强，使用 Dart 语言。同样支持 Web 和 Windows 桌面端编译。
*   **桌面端 (Windows):**
    *   方案 A: 使用 React Native for Windows 或 Flutter 的桌面端支持（原生性能较好）。
    *   方案 B: 使用 **Tauri** 或 **Electron** 包装 Web 版本。Tauri (Rust + Web) 打包体积更小，内存占用更低，更适合做全局快捷键呼出的轻量级应用。
*   **Web端:** 复用 React Native Web 或 Flutter Web，或者用 React/Vue 单独写一个轻量级 Web 版本。

### 3.2 后端与数据同步 (Backend & Sync)
*   **推荐方案: Supabase 或 Firebase**
    *   *理由:* 对于个人开发者或独立项目，BaaS (Backend as a Service) 是最快的选择。它们提供开箱即用的身份验证 (Auth)、数据库 (PostgreSQL/NoSQL)、实时订阅和云存储。
    *   *Supabase:* 开源的 Firebase 替代品，基于 PostgreSQL，对关系型数据（文件夹、标签）支持更好。
*   **本地存储:**
    *   React Native: `WatermelonDB` (专为离线优先和高性能设计) 或 `MMKV` (极速键值存储)。
    *   Flutter: `Isar` 或 `Hive`。

## 4. MVP (最小可行性产品) 第一阶段开发计划

既然最想先做的是手机端，我们第一阶段的重点是：
1.  搭建移动端基础框架 (React Native / Flutter)。
2.  实现基础的文本记录功能（创建、查看、修改、删除）。
3.  实现 **核心需求：独立的速记入口**。
    *   Android: 实现一个简单的桌面小组件或通知栏快捷方式。
    *   iOS: 实现 Share Extension 或一个能快速聚焦输入的纯净页面。
4.  集成简单的本地存储（暂不强求云端同步，先确保单机体验）。

## 5. UI/UX 设计方向
*   **极简 (Minimalist):** 界面不要有过多的线条和色块，大面积留白。
*   **直觉 (Intuitive):** 主界面直接是一个“新建”按钮或输入框，不要有复杂的导航层级。
*   **暗黑模式 (Dark Mode):** 必须支持，适合夜间速记。

---
*此文档将作为后续开发的指导方针，随着项目推进可随时迭代调整。*
