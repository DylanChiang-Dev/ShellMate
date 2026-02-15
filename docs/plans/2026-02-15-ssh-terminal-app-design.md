# SSH Terminal App MVP Design

## 1) 目標 (MVP)

做一個 macOS 14+ (Apple Silicon) 終端 App：
- 多 Tab + 分屏 (pane)，每個 pane 是獨立 session，可連不同主機或本機 shell
- 保存 SSH Profiles (不碰 ~/.ssh/config)，支援 key + 密碼登入
- 內建「遠端檔案」：檔案樹 (新建/改名/刪除/上傳/下載) + 單檔編輯器 (一次只開 1 檔) + 保存回遠端
- 支援保存需要 sudo 的遠端檔案：保存時可用登入密碼 (key-only 則臨時輸入)
- 保存常用命令 (全局共用)，點選只「插入到當前終端輸入列」，不自動執行
- 內建 SSH/SFTP (不呼叫系統 ssh)
- keyboard-interactive 額外驗證 (含 2FA/OTP) 用彈窗表單手動輸入
- 匯入/匯出：手動；導出包「全包含」(profiles/命令/hostkeys/私鑰/保存的密碼)，用匯出密碼加密；導入採智能合併與衝突處理

**非目標 (MVP 不做)**
- App 重啟恢復上次 tabs/panes/連線狀態
- 本機 shell 對應的本機檔案樹/編輯 (檔案樹只跟遠端 pane)
- 多檔編輯 tab、diff/比較、全局搜尋替換
- Jump/Bastion、Port Forward、Agent Forward、Tmux 整合等進階 SSH 能力
- App Store 上架相容
- 快捷鍵定義 (MVP 只用右鍵選單)

---

## 2) 技術路線

- **殼**: Tauri
- **後端**: Rust (Session/PTY/SSH/SFTP/加密金庫/資料庫/匯入匯出)
- **前端**: React + TypeScript
- **終端渲染**: xterm.js
- **編輯器**: Monaco (MVP 以文字檔為主)
- **檔案樹**: React 樹狀元件 (支持大量節點的虛擬化)

---

## 3) UI/交互

**固定四區佈局**:
- **左側 Sidebar**: 上半部 Profiles 列表 + 快速搜尋；下半部命令片段列表 (點擊插入當前終端輸入列)
- **右上**: 檔案樹 (顯示當前聚焦 pane 的主機) + 單檔編輯器
- **右下**: 終端區 (Tab + split panes；聚焦 pane 決定右側檔案樹與編輯器對應主機)

**分屏操作**:
- 透過右鍵選單執行「水平分割」或「垂直分割」
- SSH session 和本機 shell 都支援分屏

**關鍵交互規則**:
- 「聚焦 pane」是全局焦點來源：檔案樹與編輯器自動切到該 pane 的主機
- 若聚焦 pane 是本機 shell：檔案樹區顯示占位提示 (不顯示本機檔案)
- 常用命令：固定顯示在左側 Sidebar 下半部，點擊後只插入到聚焦 pane 的輸入列
- Host Key 管理：在編輯 Profile 時顯示關聯的 Host Key

---

## 4) 核心架構與資料流

```
Tauri invoke/events
       │
       ▼
React UI: Tabs/Panes + FileTree + Editor + CommandSnippets
       │
       ▼
Rust Core:
  - Local PTY Sessions (zsh)
  - SSH Sessions (Shell + Exec)
  - SFTP Client
  - Encrypted Vault + Keychain Gate
  - SQLite (metadata)
```

- UI 只做渲染與交互；所有連線/檔案/加密都在 Rust
- 每個 pane 對應一個 session (Local 或 SSH)
- 終端 I/O：Rust 以事件流推送到前端 (每個 pane 一條輸出流)，前端餵給 xterm
- 檔案操作：UI 發出 request，Rust 執行 SFTP/SSH exec，回傳結果/錯誤與進度

---

## 5) 資料模型 (MVP)

### Profile
- `id` (UUID)
- `name`
- `host`
- `port`
- `username`
- `auth_method`: password | key | key+password
- `key_ref?` (指向 vault 內的私鑰條目)
- `password_ref?` (指向 vault 內保存的登入密碼)

### CommandSnippet
- `id` (UUID)
- `title`
- `command`
- `tags?`
- `updated_at`

**命令片段 UI**:
- 固定顯示在左側 Sidebar 下半部
- 點擊後只插入到聚焦 pane 的輸入列，不自動執行

### HostKey
- `host`
- `port`
- `algo`
- `fingerprint`
- `raw_key`
- `first_seen_at`

### Session
- `id` (UUID)
- `type`: local | ssh
- `profile_id?`
- `pane_id`
- `state`

**存儲策略**:
- SQLite: 存非敏感 metadata (profiles 的 host/user/port/name、命令、UI 設定、hostkeys)
- Vault: 存敏感資料 (私鑰內容、登入密碼、匯出包裡需要的秘密)

---

## 6) 安全與金庫

**目標**: 私鑰匯入 app 內、落地加密；啟動時用 Touch ID/系統密碼解一次鎖，本次運行可用

**設計**:
- **第一次啟動**:
  - 生成隨機 master_key (32 bytes)
  - 用 macOS Keychain 保存 master_key，並設置需要 User Presence (Touch ID 或系統密碼)
  - 建立 vault.enc (空 vault) 落盤
- **每次啟動**:
  - 讀 Keychain 取回 master_key (觸發一次系統授權)
  - 解密 vault.enc 到記憶體 (本次運行有效)
- **Vault 加密**: XChaCha20-Poly1305 或 AES-256-GCM
- **匯出包**:
  - 匯出密碼 → Argon2id 派生 export_key
  - 用 export_key 加密整包 (單檔案)，包含：SQLite dump (或 JSON)、vault 內容、hostkeys

---

## 7) SSH/SFTP 與認證

**SSH 庫候選**:
- **推薦 A**: ssh2 (libssh2 binding) - SFTP 一體、成熟
- **B**: russh (pure Rust) - 可控性強但整合需更多驗證

**認證流程**:
- **Password**: 從 vault 取，直接走庫的密碼認證
- **Key**: 從 vault 取私鑰 bytes (必要時解 passphrase)，用 memory auth
- **keyboard-interactive**:
  - 後端收到 prompts → 前端彈窗顯示 (支持多欄位/遮罩)
  - 使用者提交 → 後端回覆

**Host Key**:
- 首次連線時顯示指紋讓用戶確認後才保存
- Host Key 管理：編輯 Profile 時顯示關聯的 Host Key，可刪除

---

## 8) 終端 (Local PTY + SSH Shell)

- **Local session**: Rust 開 PTY，啟動使用者 shell (預設 zsh，可設)
- **SSH session**: 建立連線後開互動 shell channel (帶 PTY)，將字節流映射到 xterm
- **Pane/Tab**: 前端只管理佈局；後端管理 session 生命週期
- **Local PTY 功能**:
  - 基本輸入輸出
  - 系統剪貼簿整合 (複製/貼上)
  - xterm.js 搜尋功能 (`Cmd+F`)
  - 字體大小調整

## 8.1) Tab + Pane 管理

- 每個 Tab 可包含多個 pane (水平或垂直分割)
- 分屏透過右鍵選單操作
- SSH session 和本機 shell 都支援分屏
- 聚焦 pane 決定檔案樹與編輯器對應的主機

---

## 9) 遠端檔案樹 + 編輯器 + 保存 (含 sudo)

**檔案樹功能 (SFTP)**:
- list、stat、mkdir、rename、remove
- upload (上傳檔案到遠端)
- download (從遠端下載檔案)

**打開檔案**:
- 優先 SFTP 讀取
- 若 SFTP 權限不足但需要支援 sudo：用 SSH exec 讀取 (例如 `sudo cat`)

**保存檔案**:
- 若 SFTP 可寫：直接覆寫
- 否則走 sudo 保存：
  1. 先用 SSH exec 檢測是否可免密 sudo：`sudo -n true`
  2. 若不可免密：用保存的登入密碼作為預設 sudo 密碼 (key-only 連線則彈窗輸入一次)
  3. 走 `sudo tee <target> > /dev/null` 寫入

---

## 10) 匯入/匯出 (全包含 + 智能合併)

- **匯出**: 生成「資料快照」→ 用匯出密碼加密 → 輸出單檔
- **匯入**: 解密後讀入，進入合併流程：
  - Profile 衝突：同 UUID 或同名視為衝突，逐個提示 (保留兩份/覆蓋/跳過)
  - Command 衝突：同 title 視為衝突
  - HostKeys：以 (host,port,raw_key) 去重

---

## 11) 錯誤處理

- SSH 連線錯誤：顯示明確分類 (DNS/超時/拒絕/握手失敗/驗證失敗)
- keyboard-interactive：彈窗顯示 prompt 文案，支持重試與取消
- SFTP：權限不足時提示「可嘗試 sudo 打開/保存」
- sudo：錯密碼/無 sudo 權限要明確提示
- 檔案保存：保存成功後回寫「已保存」狀態；失敗要保留編輯內容不丟失

---

## 12) 測試與驗收

**單元測試 (Rust)**:
- vault 加解密、Keychain gate、匯入/匯出加解密、合併策略

**集成測試 (可選)**:
- 用 Docker/本機 VM 起 sshd + sftp + sudo 場景

**MVP 驗收清單**:
- [ ] 多 tab + 分屏，聚焦切換正確
- [ ] Local shell 可用
- [ ] SSH profile 新建/連線成功 (password、key)
- [ ] 檔案樹基本操作可用
- [ ] 打開/編輯/保存可用 (含 sudo 保存)
- [ ] 常用命令可插入當前輸入列
- [ ] 匯入/匯出可完成且可在另一台機器復原
