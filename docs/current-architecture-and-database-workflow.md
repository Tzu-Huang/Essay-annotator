# Essay Annotator 現行架構與資料庫工作流程

> 文件狀態：現況紀錄與未來共識  
> 最後確認日期：2026-08-24  
> 適用範圍：Local 開發環境、AWS Production、Supabase、AWS RDS、Admin Console

## 1. 文件目的

本文件回答以下問題：

- Local 與 AWS Production 各自如何運作？
- 兩個環境分別使用哪一個資料庫？
- 為什麼以前 Local frontend 會呼叫 AWS 公開 IP，現在不會？
- Local 完整測試時需要啟動哪些服務？
- `database.jsonl`、Supabase、AWS RDS 與 `embed.jsonl` 有什麼關係？
- Admin Console 在不同環境應連到哪裡？
- 未來修改程式或資料庫結構時，應遵循什麼流程？

---

## 2. 最重要的架構共識

```text
Local 開發環境
Local Frontend → Local Backend → Supabase PostgreSQL

AWS Production
essayannotator.com → AWS Backend → AWS RDS PostgreSQL
```

核心原則：

1. Local 與 Production 必須分開，Local 測試不可直接修改 Production 資料。
2. Supabase 是團隊共用的 Local／Development 測試資料庫。
3. AWS RDS 是 `essayannotator.com` 使用的 Production 正式資料庫。
4. Supabase 和 AWS RDS 都是 PostgreSQL；服務商不同，但資料庫系統相同。
5. 兩個環境的資料內容不必完全相同，但資料表結構必須一致。
6. Frontend 統一呼叫相對路徑 `/api`，不再寫死 AWS IP。
7. Admin Console 依執行環境連接對應的 Backend 與 Database。

重要限制：上述內容是預期設定，不是只靠網址就能保證的結果。`/api` 決定 request 送到哪一個 Backend；Backend 的 `POSTGRES_URL` 才真正決定它連到 Supabase、RDS 或其他資料庫。

---

## 3. Local 開發環境

### 3.1 架構

```text
瀏覽器
  ↓
Local Frontend（通常是 http://localhost:5173）
  ↓ /api
Vite development proxy
  ↓
Local Backend（http://localhost:8000）
  ↓ POSTGRES_URL
Supabase PostgreSQL（測試資料）
```

Frontend 不會直接連 Supabase。Frontend 先把 API request 交給 Local Backend，再由 Backend 讀寫 Supabase。

### 3.2 完整測試需要兩個 Terminal

只執行 `npm run dev` 只會啟動 frontend。需要 API、登入、Essay、搜尋或 Admin 功能時，Local Backend 也必須同時運行。

Terminal 1－Backend：

```powershell
cd BackEnd
python -m uvicorn app.main:app --reload
```

Terminal 2－Frontend：

```powershell
cd frontend
npm run dev
```

如果 Python 套件安裝在 virtual environment，應先啟用該環境，再啟動 Backend。

### 3.3 Local Database

目前 Local Backend 的 `POSTGRES_URL` 指向 Supabase PostgreSQL。

未來共識：

- 團隊的 Local Backend 共用 Supabase 作為測試資料庫。
- Local 測試資料可以直接透過 Supabase Dashboard 管理。
- Local 測試不得使用 Production RDS 帳密。
- 測試資料可以與 Production 不同，但 schema 必須相容。

如果 Local Backend 沒有設定 `POSTGRES_URL`，程式有 SQLite fallback；這只適合部分腳本或隔離測試，不是團隊共用開發資料庫的正式方案。

目前尚缺少強制防呆：如果有人把 Local Backend 的 `POSTGRES_URL` 錯誤設成 RDS，Local request 仍可能碰到 Production。未來應加入啟動檢查，至少做到：

- `APP_ENV=local` 時拒絕已知的 Production database host。
- Local 與 Production 使用不同且最小權限的 database credentials。
- 啟動與 health 資訊顯示經過遮罩的環境／資料庫識別，讓操作者能確認目標，但不得洩漏帳密。

---

## 4. AWS Production 環境

### 4.1 架構

```text
使用者瀏覽器
  ↓ HTTPS
https://essayannotator.com
  ↓ /api
AWS EC2 上的 Nginx reverse proxy
  ↓ proxy /api
FastAPI／Uvicorn Backend
  ↓ POSTGRES_URL
AWS RDS PostgreSQL
```

Production Backend 在 AWS EC2 上以 FastAPI／Uvicorn 運行。systemd 服務會讀取：

```text
/etc/essay-annotator/production.env
```

該環境設定中的 `POSTGRES_URL` 指向 AWS RDS。正式帳密由 AWS Secrets Manager 管理並同步至 Production 環境，不應寫入 Git。

### 4.2 已確認的 Production 狀態

2026-08-24 透過以下唯讀健康端點確認：

```text
https://essayannotator.com/api/health
```

當時回傳的關鍵狀態：

```text
ready: true
essay_count: 219
data_path: postgres
startup_error: null
```

因此可以確認：

- Production Backend 當時成功使用 PostgreSQL 資料。
- 當時載入 219 篇 Essay。
- Backend 沒有因 PostgreSQL 無資料而 fallback 到 `database.jsonl`。

健康端點只能證明 Backend 當下使用 PostgreSQL，不能單靠 `data_path: postgres` 證明該 PostgreSQL host 一定是 RDS。結合 Production 設定契約可判斷預期目標為 RDS；若要驗證實際 host，仍需要一個不洩漏帳密的 database identity 檢查。RDS 內各 table 的完整內容應使用受控的 Admin 功能或資料庫工具檢查。

### 4.3 RDS 如何被存取

一般使用者與 frontend 不直接連接 RDS：

```text
Frontend → AWS Backend → RDS
```

Backend 使用 SQLAlchemy 與 `POSTGRES_URL` 建立連線，讀寫例如：

- `users`
- `essays`
- `essay_embeddings`
- `admin_audit_logs`
- `openai_usage_events`

RDS 應保持 private，由允許的 AWS 應用程式環境存取；不應為了方便從個人電腦查看資料而直接公開到 Internet。

---

## 5. 舊 AWS IP 串接與改版歷程

### 5.1 IP 更正

口頭記憶中的 `44.261...` 不是有效 IPv4，因為每一段最大為 255。Git 歷史中實際出現的舊 Backend IP 是：

```text
44.201.62.0:8000
```

### 5.2 舊架構

以前部分 frontend 程式會使用 `VITE_API_URL`，Admin Console 也曾有以下 AWS fallback：

```text
http://44.201.62.0:8000
```

因此當時可能出現：

```text
Local Frontend
  ↓ 直接呼叫公開 AWS IP
AWS Backend
  ↓
AWS RDS
```

這也解釋了為什麼以前只啟動 Local frontend，部分功能仍可能運作：實際處理 API 的是 AWS Backend，不是 Local Backend。

### 5.3 目前架構

2026-07-31 的 Git 變更 `bb3c85f` 將 frontend 改為 same-origin API routing。Frontend 現在統一使用：

```text
/api
```

因此相同 frontend 程式會依所在環境自然選擇 Backend：

```text
localhost:5173/api
  → Vite proxy
  → localhost:8000

essayannotator.com/api
  → AWS Web routing
  → AWS Backend
```

目前 application request code 不再使用寫死的 AWS IP，也不再依賴 `VITE_API_URL` 決定主要 API host。即使舊 `.env` 還保留 `VITE_API_URL`，目前主要 frontend API helper 仍固定使用 `/api`。

相關實作位置：

- Local proxy：`frontend/vite.config.js`
- Frontend API helper：`frontend/src/api.mjs`
- Production Nginx routing：`deploy/nginx/essay-annotator.conf.template`

---

## 6. `database.jsonl`、Supabase、RDS 與 Embedding

### 6.1 `database.jsonl`

主要位置：

```text
BackEnd/drive_data/finalized_data_jsonl/database.jsonl
```

它是舊有 Essay 資料集與匯入來源，每一行代表一篇 Essay。它不是 Supabase 或 RDS 的即時鏡像。

### 6.2 匯入 PostgreSQL

匯入工具：

```text
BackEnd/scripts/import_essays_to_postgres.py
```

資料流：

```text
database.jsonl
  ↓ import_essays_to_postgres.py
POSTGRES_URL 指向的 PostgreSQL
```

因此：

- `POSTGRES_URL` 指向 Supabase，資料就匯入 Supabase。
- `POSTGRES_URL` 指向 RDS，資料就匯入 RDS。
- Backend 每次啟動不會自動執行這支匯入程式。
- 修改 `database.jsonl` 本身不會自動修改 Supabase 或 RDS。

目前匯入邏輯主要用於新增：

- 新 ID／新內容可以被新增。
- 已存在的 ID 或重複內容會被略過。
- 修改 JSONL 中既有 Essay 不會自動覆蓋 PostgreSQL 舊資料。
- 從 JSONL 刪除 Essay 不會自動刪除 PostgreSQL 資料。

### 6.3 RDS 初始 219 篇資料的來源

已知事實：

- RDS 當時有 219 篇 Essay。
- Local `database.jsonl` 當時也有 219 行。
- Backend 啟動與 Production deployment 不會自動呼叫匯入程式。

合理推論：RDS 的初始 219 篇 Essay 很可能曾由 `database.jsonl` 手動匯入。

目前沒有足夠的 audit evidence 證明確切匯入日期、命令或操作者，因此不能把「由哪一個人手動執行」寫成已確認事實。

### 6.4 `embed.jsonl`

主要位置：

```text
BackEnd/drive_data/embed_output/embed.jsonl
```

它保存語意搜尋使用的向量索引，與 Essay 文字資料用途不同：

| 儲存位置 | 主要用途 |
|---|---|
| `database.jsonl` | 舊 Essay 資料集與匯入來源 |
| Supabase `essays` | Local／Development 的主要 Essay 資料 |
| RDS `essays` | Production 的主要 Essay 資料 |
| `embed.jsonl` | 執行語意搜尋所需的向量索引 |

修改 Essay 的 topic、content、type 或 school 時，除了 PostgreSQL 資料，也需要考慮 embedding 是否必須重新產生。

---

## 7. Admin Console 的環境串接共識

Admin Console 使用同一份 frontend 程式。以下是應維持的環境設定：

| Admin URL | Backend | Database |
|---|---|---|
| `http://localhost:5173/admin` | Local Backend | Supabase |
| `https://essayannotator.com/admin` | AWS Backend | AWS RDS |

資料流：

```text
Local /admin
  → /api
  → Local Backend
  → Supabase

Production /admin
  → /api
  → AWS Backend
  → RDS
```

這樣設計的原因：

- Local Admin 可以測試畫面、認證與 API 行為，而不會修改正式資料。
- 同一份 frontend 部署後會自然使用 AWS Backend，不需要重新改 API URL。
- 要查看正式 AWS／RDS 狀態時，應使用 `essayannotator.com/admin`。
- Local 測試資料可以直接在 Supabase Dashboard 修改。

必須注意：Admin URL 本身不保證 database target。實際路徑是：

```text
Admin URL
  → /api routing 決定 Backend
  → Backend POSTGRES_URL 決定 Database
```

因此部署或啟動前必須檢查 Backend 環境設定，不能只看到 `localhost` 或 `essayannotator.com` 就假設資料庫一定正確。

### 7.1 Production Admin 的定位

目前共識是 Production Admin 主要作為 AWS Production 與 RDS 的管理／檢查入口，優先提供：

- 網站與 Backend 健康狀態
- AWS 服務狀態
- RDS／PostgreSQL 連線狀態
- 正式 Essay 資料檢視
- Audit log 與操作結果

任何會修改 Production 的功能，例如新增、修改、刪除 Essay、重新產生 embedding、restart 或 redeploy，都應具備：

1. 獨立且明確的權限。
2. 二次確認。
3. Audit log。
4. 失敗處理與可恢復方案。

不能只依靠「團隊約定不按按鈕」保護 Production；如果某項操作目前不應使用，應在 Production UI 或 Backend 權限層停用或限制。

---

## 7.2 Production Admin Google 驗證設定與修正紀錄

Frontend 建置時的 `VITE_GOOGLE_LOGIN_ID` 與 Backend 執行時的 `GOOGLE_CLIENT_ID` 必須完全一致。目前 Production 使用的公開 OAuth Client ID 為：

```text
388331799253-n0pang3tlaremkka4f4n3t1v03sl5nen.apps.googleusercontent.com
```

Backend 從 `/etc/essay-annotator/production.env` 載入設定，先向 Google 驗證 bearer access token，再檢查 `ADMIN_EMAILS`。目前 `Invalid or expired Google credential` 同時涵蓋 token 無效、Google 驗證連線失敗或 Client ID 不符等情況，不能僅凭訊息判定是使用者憑證過期。

2026-09-13 確認 Production 的 `GOOGLE_CLIENT_ID` 尾端誤多了一個 `n`，導致新登入取得的憑證也遭拒絕。已備份環境檔、只移除該字元並重啟 `essay-api`；操作持有部署鎖，驗證失敗時會還原設定。備份位置為 `/etc/essay-annotator/production.env.before-google-client-id-fix.20260913T152349Z`，僅存於正式主機，未將環境檔內容帶回 repository。

修正後已確認執行中程序的 Client ID 與前端建置設定一致、內部 readiness 通過，公開 `/api/health` 回傳 `ready: true`、`essay_count: 219`、`data_path: postgres`、`startup_error: null`。使用者本人登入 Admin 的端到端驗證仍待確認。AWS SSM 操作紀錄：`fb7972ac-de27-43dd-b756-e06189b530fb`。

---

2026-09-13 後續確認 `ADMIN_EMAILS` 也被截斷：Tzu 的項目只有 `tzuhuan`，Amanda 未列入。已備份並修正為以下四個完整帳號，重啟後確認執行中程序載入正確名單且 readiness 通過：

- `zackeryliu98@gmail.com`
- `zackery032895@gmail.com`
- `tzuhuangliu@gmail.com`
- `amanda.tsai11@gmail.com`

此次僅修正登入／檢視權限，保留 `ADMIN_WRITE_EMAILS` 現狀。因此 Amanda 與 Tzu 目前只有 Admin 檢視權限。寫入名單仍包含兩個 Zackery 帳號與無效的截斷項目 `t`；如需授予其他人寫入權限，須另行明確指定。備份：`/etc/essay-annotator/production.env.before-admin-allowlist-fix.20260913T153417Z`；SSM 操作紀錄：`2879bacf-fad1-4000-b4aa-033fd8951f13`。兩人本人登入的端到端驗證仍待確認。

---

## 8. 一般程式修改流程

若修改內容不涉及資料庫 schema，例如 UI、搜尋邏輯或顯示方式：

```text
1. 在 Local 修改程式
2. 同時啟動 Local frontend 與 Local backend
3. 使用 Supabase 測試資料驗證
4. 執行 automated tests
5. 完成 review 與核准
6. 部署相同程式版本到 AWS
7. 驗證 essayannotator.com 與 Production health
```

Frontend 不需要在部署前把 Local Backend URL 改成 AWS URL。`/api` routing 會依環境處理。

---

## 9. Database 修改流程

> 現況警告：本節是未來標準，不是目前已完成的自動化 runbook。Alembic、schema drift check、migration runner 與 restore drill 尚未全部建立；完成前，Production schema 變更必須逐次審查。

### 9.1 「修改資料」與「修改結構」不同

修改資料：

- 新增一篇 Essay
- 修改 Essay 內容
- 修改 `public` 狀態

修改結構（schema）：

- 新增一個 column
- 修改 column type
- 新增 table 或 index
- 新增 constraint

Schema 修改的風險較高，不能只在 Supabase 手動改完就部署程式。

### 9.2 未來標準流程

```text
1. 定義 schema 變更與 rollback 方法
2. 建立可重複執行、可追蹤版本的 migration
3. 將 migration 套用到 Supabase
4. 啟動 Local frontend 與 backend 完成測試
5. 執行 PostgreSQL integration tests
6. 在修改 RDS 前建立並確認可用備份
7. 依核准流程將同一份 migration 套用到 RDS
8. 優先採用 expand／contract：先做向後相容的 schema 擴充，再部署相容程式與 backfill；確認穩定後，才在另一個受控變更中移除舊結構
9. 驗證 health、資料與主要使用流程
10. 發生問題時依既定 rollback／restore 流程處理
```

### 9.3 Migration 工具

目前 `create_tables()` 可以建立尚不存在的 table，但不足以可靠管理以下變更：

- 對既有 table 新增或刪除 column
- 修改 column type
- 資料 backfill
- 版本追蹤
- rollback

未來應導入 Alembic 或等效的 migration 機制，讓 Supabase 與 RDS 套用同一份、受版本控制的 schema 變更。

此外需要加入 schema version／drift check，部署前比較 Supabase、預備測試 PostgreSQL 與 RDS 的 migration version。Database rollback 不一定等於執行 down migration；若新版本已寫入資料，可能需要回復舊程式、forward fix 或使用經過驗證的 RDS point-in-time restore。每次高風險變更都必須事先指定負責人、核准人、備份類型、驗證條件與停止條件。

### 9.4 Database 變更禁止事項

- 不使用 Local Backend 直接測試 Production RDS。
- 不把 RDS 帳密複製到 frontend 或 Git。
- 不假設修改 `database.jsonl` 會更新 PostgreSQL。
- 不在沒有備份與 rollback 計畫時修改 RDS schema。
- 不只修改 Supabase schema，卻忘記為 RDS 準備相同 migration。
- 不把 Production 使用者資料任意複製到測試環境。

---

## 10. CI 與自動測試的注意事項

目前 GitHub Actions 的 Backend tests 使用隔離的 SQLite URL，不會使用 Supabase 或 RDS。這適合快速且安全的單元測試，但 SQLite 與 PostgreSQL 並非完全相同。

未來對重要的 database migration 或 PostgreSQL-specific 行為，應增加隔離的 PostgreSQL integration test。CI 不得取得 Production RDS credentials。

---

## 11. 日常操作速查

### 我要在 Local 測試網站

```text
啟動 Local Backend
+
啟動 Local Frontend
+
使用 Supabase 測試資料
```

### 我要修改 Local 測試資料

```text
使用 Supabase Dashboard
```

### 我要查看 Production 狀態

```text
使用 https://essayannotator.com/admin
或唯讀 health endpoint
```

### 我要修改 Production 資料

```text
使用受權限與 audit 保護的 Production Admin 功能
```

不要透過 Local frontend 或 Local Backend 直接修改 RDS。

### 我要修改資料庫結構

```text
先建立 migration
→ Supabase 測試
→ RDS 備份與核准
→ 套用同一份 migration
→ 部署後驗證
```

---

## 12. 尚未完成的改善項目

1. 導入正式 migration 工具，例如 Alembic。
2. 建立 PostgreSQL integration test，降低 SQLite 與 PostgreSQL 差異造成的風險。
3. 明確區分 Production Admin 的唯讀能力與高風險寫入能力。
4. 為所有 Production 寫入、restart 與 redeploy 操作加入權限、確認與 audit。
5. 建立並演練 RDS schema migration、rollback 與 restore runbook。

在上述項目完成前，任何 Production database schema 修改都應視為受控維運工作，而不是一般程式部署的一部分。

---

## 13. 主要證據來源

本文件的現況判斷主要來自以下 repository 檔案與 Git 紀錄：

- `frontend/vite.config.js`：Local `/api` proxy 到 `localhost:8000`。
- `frontend/src/api.mjs`：Frontend 統一使用 `/api`。
- `BackEnd/database/create.py`：`POSTGRES_URL`、SQLAlchemy engine 與 SQLite fallback。
- `BackEnd/app/main.py`：啟動時優先讀 PostgreSQL、空資料時 fallback 到 JSONL，以及 health response。
- `BackEnd/database/essays.py`：JSONL 匯入、去重與 PostgreSQL Essay 操作。
- `BackEnd/scripts/import_essays_to_postgres.py`：手動 JSONL-to-PostgreSQL 匯入入口。
- `deploy/systemd/essay-api.service`：Production Backend service 與環境檔位置。
- `deploy/nginx/essay-annotator.conf.template`：Production `/api` reverse proxy。
- `deploy/scripts/sync-production-secrets.py`：Production RDS secret 與 `POSTGRES_URL` 同步契約。
- `.github/workflows/ci.yml`：CI 使用隔離的 SQLite URL。
- Git commit `bb3c85f`：改為 same-origin `/api` routing 並移除舊 AWS IP fallback。

健康資訊是 2026-08-24 的單次觀測，不代表永久狀態。平台設定與外部資源仍可能在不修改 repository 的情況下改變，因此正式操作前必須重新驗證。
