# ShellMate

一款 macOS 原生終端應用程式，支援 SSH/SFTP 遠端連線、本機 shell、加密 credential 儲存，以及遠端檔案編輯。

## 功能特色

### 終端功能
- **多 Tab + 分屏**：支援多個 Tab，每個 Tab 可分割成多個 pane
- **本機 Shell**：內建本機終端，直接在 App 中執行 zsh
- **SSH 連線**：內建 SSH/SFTP，無需呼叫系統指令

### 檔案管理
- **遠端檔案樹**：瀏覽遠端主機的檔案系統
- **檔案編輯**：Monaco 編輯器，支援語法高亮
- **sudo 儲存**：支援編輯需要 sudo 權限的檔案

### 安全性
- **加密金庫**：私鑰匯入 App，落地加密儲存
- **Touch ID 解鎖**：每次啟動需 Touch ID 或系統密碼驗證
- **Keychain 整合**：密碼安全儲存於 macOS Keychain

### 實用功能
- **常用命令**：儲存常用指令片段，一鍵插入終端
- **匯入/匯出**：加密備份，還原到新裝置
- **Host Key 管理**：自動儲存主機指紋

## 技術架構

- **框架**：Tauri 2.x
- **後端**：Rust
- **前端**：React + TypeScript
- **終端**：xterm.js
- **編輯器**：Monaco Editor
- **資料庫**：SQLite
- **加密**：ChaCha20-Poly1305

## 系統需求

- macOS 14.0 (Sonoma) 或更高版本
- Apple Silicon (M 系列晶片)

## 開發中狀態

ShellMate 目前處於 MVP 開發階段，主要功能正在實作中。

## 授權

MIT License - 詳見 [LICENSE](LICENSE) 檔案

## 聯絡

如有任何問題或建議，歡迎開 Issue 討論。
