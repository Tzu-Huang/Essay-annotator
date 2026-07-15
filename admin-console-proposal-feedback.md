# Admin Console Proposal 回覆與延伸討論

> 回覆對象：`Admin Console — The Complete Guide` 提案作者  
> 文件性質：Proposal feedback / discussion draft  
> 目的：確認方向、指出需要補強的風險，並保留尚未適合過早定案的設計問題

## 整體回覆

整體而言，我認同這份 proposal 的兩個主要方向：

1. 把 Essay Database Manager 從「看起來可以操作，但部分流程沒有真正閉環」的管理畫面，補成可觀察、可復原、可追蹤的資料管理工具。
2. 把常見的 AWS 維運工作收斂成少數固定操作，避免把任意 shell 暴露在瀏覽器中。

提案對目前問題的追查相當具體，尤其是 embedding 實際寫入 `embed.jsonl` 後，Postgres 狀態與記憶體搜尋向量並沒有同步更新，以及 restart 無法可靠串流自身輸出等問題。這些都表示設計不是只停留在 UI，而有考慮實際執行路徑。

不過，這兩個 Guide 涉及的風險等級並不相同。Essay Manager 主要處理資料正確性與誤刪；Ops Panel 則能直接中斷或改變 production。建議不要因為它們同屬 Admin Console，就綁成同一個上線決策。兩者可以共享介面與 audit 能力，但應分開評估、分階段推出。

以下建議不是要求現在一次把所有細節訂死，而是希望在 implementation planning 前，先把不可逆決策、失敗模式和系統邊界說清楚。

## 建議先確立的設計原則

### 1. 後端狀態才是權威，前端只反映後端結果

確認文字、按鈕 disable、狀態 pill 等前端機制都屬於 UX，不應被視為安全或一致性保證。權限、狀態轉換、重複請求處理與前置條件都要由後端再次驗證。

### 2. 高風險操作需要可追蹤，也需要可恢復

Audit log 很重要，但 audit 只能回答「發生了什麼」，不能取代 backup、rollback 或 reconciliation。Restore、Hard Delete、Import、Regenerate、Restart、Redeploy 應各自說明：

- 操作到一半失敗時會留下什麼狀態？
- 重送同一個請求是否安全？
- 服務在中途重啟後如何判斷前一個工作是否完成？
- 有沒有人工修復或自動重建路徑？

### 3. 權限應依能力分層，不只依頁面分層

`read`、`essay_write`、`import`、`regenerate_embedding`、`hard_delete`、`ops_health`、`ops_execute` 不一定要全部拆成獨立角色，但至少應先確認哪些能力不該自然地跟著其他權限一起取得。

### 4. 優先讓系統容易理解，再追求操作方便

若某個設計會讓同一筆資料同時存在三個「看起來都像真相來源」的地方，或讓被刪除的資料仍可自由編輯，短期雖然方便，長期會提高故障排查與使用者理解成本。

## Guide 01：Essay Database Manager

### 認同的方向

- 排序放在 server side，再進行 pagination，這是正確修正。
- Restore 與 Hard Delete 分開，且 Hard Delete 只能作用於已 soft-delete 的資料，可以降低誤操作。
- 使用 `content_hash` 防止 embedding 生成期間的內容變更被錯誤標成 `current`，值得保留。
- 已經是 `current` 時跳過不必要的 OpenAI 呼叫，可以避免浪費成本。
- Import 遇到個別無效檔案時繼續執行並回報統計，比整批中止更適合管理工具。
- 將 CLI 與 API 共用的 import/embedding 邏輯抽出，也能避免兩條流程日後產生不同結果。

### 建議補強：先決定真正的資料來源

目前一個 embedding 操作可能同時影響：

```text
Postgres Essay / EssayEmbedding
        ↓
embed.jsonl
        ↓
in-memory topic_V / content_V
```

這裡最大的問題不只是 thread safety，而是三者之間缺少明確的權威順序。即使每個寫入都有 lock，只要第二或第三步失敗，仍可能出現部分成功。

建議在 implementation planning 先討論：

- Postgres 是否應成為唯一權威資料來源？
- `embed.jsonl` 是否只是可以重建的產物或 cache？
- 記憶體索引是否可以從 Postgres 或 artifact 完整重載？
- 系統啟動時是否會檢查模型版本、content hash、資料筆數與索引版本？
- 是否需要 reconciliation 工作，定期找出 `current` 但實際缺少向量的資料？

不一定要在第一版移除 `embed.jsonl`，但應清楚定義它不是另一個無法核對的真相來源。

### 建議補強：重新考慮同步 embedding request

同步呼叫 OpenAI 的優點是流程直觀，但它也會遇到 request timeout、rate limit、使用者關閉頁面、服務重啟，以及「OpenAI 已成功但 HTTP response 丟失」等情況。

可以先比較兩個方案，不急著在此文件定案：

**方案 A：同步執行**

- 實作較小，適合低流量、單一管理者環境。
- 需要明確 timeout、idempotency，以及 response 遺失後的查詢方式。

**方案 B：背景 job**

- API 建立工作並回傳 `job_id`，前端輪詢或接收狀態更新。
- 可呈現 `queued`、`running`、`succeeded`、`failed`，也較容易支援重試與批次匯入。
- 會增加 job 儲存、worker 與故障恢復的複雜度。

若第一版先做同步，也建議資料模型不要只保留 `current/stale`。可以評估是否需要 `pending/running/failed`、最後錯誤、最後成功時間、embedding model/version 與 content hash，避免未來轉成 job 時需要重新解釋既有狀態。

### 建議補強：lock 的作用範圍

文件中的 single-writer lock 和 import lock 需要說明是：

- 單一 thread lock；
- 單一 process lock；或
- 能跨 uvicorn workers / 多台 instance 的分散式 lock。

如果目前永遠只有單一 process，可以先採較簡單做法；但最好把這個部署假設寫進 proposal。若可能有多 worker，則可討論 PostgreSQL advisory lock、job table 或其他共享鎖定方式。也要定義服務中途重啟後，鎖消失但工作可能只完成一半時如何復原。

### 建議補強：Import 應不應該有 staging

目前設計是一鍵掃描、匯入並生成 embedding。這對可信任且格式穩定的來源很方便，但 shared Drive 內容未必都已經人工確認。

可以討論是否需要兩階段：

1. Preview：顯示預計新增、重複、無效、可能衝突的項目。
2. Confirm：正式匯入，預設保持 `public: false`。

若第一版不做 preview，至少建議保留 dry-run 的 API/服務層介面，並把來源檔名、來源 hash 和 import batch ID 記錄下來，讓後續能回答「這篇作文是從哪一次匯入進來的」。

### 建議補強：Hard Delete 與 audit snapshot 的矛盾

提案一方面稱為 permanent delete，另一方面又在 audit log 永久保留完整內容 snapshot。若 Hard Delete 可能用來回應隱私、資料保留期限或使用者刪除要求，保留全文可能等於資料其實沒有被刪除。

建議先確認 Hard Delete 的真正目的：

- 只是從產品資料集中移除，但允許內部留存？
- 還是代表所有可識別內容都應消失？

不同目的會導向不同 audit 設計。可能的折衷是 audit 只保留 essay ID、hash、操作者、原因、時間與受影響資源，不保留全文；也可能依資料分類決定是否保留加密 snapshot。這部分不應只由工程方便性決定。

### 建議補強：刪除狀態下是否可編輯

我的初步偏好是預設禁止編輯 soft-deleted essay，若要修正則先 Restore，因為這讓狀態轉換和 audit 較容易理解。但這不是唯一合理答案。

若確實有「刪除期間修正、確認後再恢復」的使用情境，也可以允許編輯，只是應在 UI 明確提示資料仍處於 deleted 狀態，並記錄 edit action。希望先由實際管理流程決定，而不是延續目前 endpoint 剛好允許的行為。

### 其他可能尚未涵蓋的細節

- `metadata_json` 是否需要大小上限、schema validation、敏感欄位限制與前端截斷？
- embedding model 或維度升級時，`current` 的定義是否包含 model version？
- Regenerate 是否需要「內容未變但強制重建」的管理能力？
- Import duplicate 的判斷依據是 ID、來源檔案、content hash，還是其他業務鍵？
- 標題自動生成失敗時，文章是否仍可匯入？會使用什麼 fallback？
- Hard Delete 執行前是否需要確認近期 backup 可用，而不只是輸入 essay ID？
- 大量 stale essays 是否需要批次重建、節流、成本預估與取消能力？
- OpenAI 回應成功但本地寫入失敗時，是否會重試寫入而不重複付費呼叫？
- 搜尋請求正在使用舊索引時，索引切換是否採 copy-and-swap，舊資料何時釋放？
- 匯入完成但 embedding 部分失敗時，整批應顯示 partial success 還是 failed？

## Guide 02：AWS Ops Control Panel

### 認同的方向

- 不提供任意 command input，只提供固定 action 與固定 argument list。
- 使用獨立的 `ADMIN_OPS_EMAILS`，不讓一般 essay editor 自動取得 production 維運權限。
- Restart/Redeploy 要求確認文字，並由 server side 再次驗證。
- 保留 SSH 作為 fallback，不讓控制面板成為唯一救援路徑。
- 同一時間只允許一個 ops action，避免 restart 與 redeploy 競爭。
- 對輸出做 secret scrubbing，並設定 timeout 和 non-interactive git 行為。

### Hard blocker：先完成可信任的身分驗證

這點同意原 proposal 的判斷：在 `X-Admin-Email` 可被直接偽造的前提下，不應開放 Restart 或 Redeploy。

這裡除了「換掉 header」之外，還需要確認：

- 使用者身分由哪個可信任元件驗證？
- backend 能否被繞過 proxy 直接存取？
- 是否有 session expiry、撤銷與 MFA 要求？
- 是否需要 CSRF 防護和 action rate limit？
- ops 權限異動後，既有 session 多久失效？
- 是否要對 production action 要求近期重新驗證，而不只依賴長效 session？

Security group 或 private network 限制可以作為第二層，但不應取代應用層的真實身分驗證。

### 建議補強：誰來控制承載 Admin API 的服務

讓 API 重啟自己雖然能用 fire-and-forget 加 polling 實現，但它仍是較脆弱的控制路徑。若 API 已經卡死，這個管理頁也很可能無法呼叫 restart；若 restart 中途有問題，提供狀態的服務本身也可能不存在。

可以先比較：

**方案 A：由現有 API 執行固定 systemd 操作**

- 第一版成本低。
- 需要接受「API 完全故障時只能回到 SSH」這個限制。

**方案 B：獨立的 ops agent / control service**

- 與 essay API 分離，能在主服務故障時繼續提供有限控制。
- 權限與攻擊面更清楚，但多一個需要部署、驗證與維護的元件。

第一版未必需要方案 B，不過建議在 proposal 中明確寫出 control plane 與 managed service 同生共死的限制，而不是只處理串流中斷。

### 建議補強：Redeploy 不應只被定義為 `git pull`

`git pull --ff-only` 比自動 merge 安全，但 production deployment 若直接改動 working tree，仍缺少版本固定、preflight、migration 與 rollback 的語意。

可以先保留現有實作方向，但建議至少補上：

- 顯示並 audit `before_sha` 與 `target/after_sha`。
- 部署前確認 working tree 乾淨、remote 可達、目標 commit 明確。
- pull 成功不等於 deployment 成功；restart 後 readiness 通過才算完成。
- 若有 schema migration，定義順序、相容性與失敗處理。
- 保留上一個已知可運作版本的人工 rollback runbook。
- 釐清 frontend/build artifact 是否也包含在 `make deploy` 中。

中期可再討論是否改成部署已測試的 commit SHA、release artifact、container image 或 CI/CD workflow，而不是在機器上拉取目前 branch。這不一定是第一版 blocker，但會影響未來 rollback 與可重現性。

### 建議補強：Health 不應只等於 process running

`systemctl status` 可以回答 process 是否存在，但不一定代表服務可用。建議把 health 拆成幾種訊號：

- Liveness：process 是否存活。
- Readiness：API 是否能接收正常流量。
- Dependency：Postgres、必要檔案與外部服務是否可用。
- Data readiness：搜尋索引是否載入、版本是否一致。
- Capacity：disk、memory 是否接近警戒值。

UI 可以先呈現簡化狀態，但 audit 和故障診斷最好保留各檢查項目的結果，不要只回傳單一 `ready: true/false`。

### 建議補強：操作紀錄與輸出保存

即時輸出和 audit log 不一定適合保存完全相同的內容。建議討論：

- 串流輸出的最大長度與截斷方式。
- audit 保存期限與可查看角色。
- scrub 規則是在寫入前統一套用，還是前端顯示時才套用。
- 是否可能出現 access token、remote URL credential、環境變數、檔案內容或個資。
- scrub 規則本身如何測試，避免只處理已知格式。
- 若 browser 中斷，使用者是否能用 operation ID 重新查看結果。

Audit row 建議包含 operation ID、actor、action、request time、start/end time、結果、exit code、版本資訊與摘要；完整 stdout/stderr 是否長期保存則可以另行決定。

### 其他可能尚未涵蓋的細節

- Sync Drive 和 Import essays 的責任是否重疊？兩者的順序與重複執行語意是什麼？
- Ops action lock 若服務重啟後消失，如何判斷上一個 action 是否仍在 OS 層執行？
- Restart 被快速連點或重送 HTTP request 時，是否具有 idempotency？
- Reverse proxy、load balancer、browser timeout 對 streaming 的具體限制為何？
- Redeploy 執行期間，舊連線與正在處理的 request 如何結束？是否需要 graceful shutdown？
- Disk 快滿時是否仍允許 deploy/sync？是否要設定 guardrail？
- `systemctl restart` 成功但 readiness 一直失敗時，UI 如何提示下一步？
- 是否要提供 runbook link，而不是嘗試把所有修復行為都放進控制台？
- Audit database 如果不可用，ops action 應拒絕執行，還是允許執行並寫入 fallback log？
- 當 git remote、Drive 或 OpenAI 無法連線時，管理員看到的錯誤是否足以採取下一步，又不會暴露秘密？

## 跨兩個 Guide 的共同建議

### 1. 將長時間操作抽象成一致的 Operation 模型

Import、Regenerate、Drive Sync、Redeploy 都有相似需求：執行中狀態、輸出、timeout、取消、重試、互斥、audit 和斷線後查詢。與其各自建立不同介面，可以先討論是否需要共用的 operation/job 模型。

這不代表第一版一定要導入完整 queue；即使仍在 request 內執行，也可以使用 operation ID 和一致的狀態欄位，降低之後演進成本。

### 2. 明確區分「業務 audit」與「技術執行 log」

- Audit：誰在何時要求做什麼、對哪個資源、結果為何；應穩定、結構化且限制修改。
- Execution log：stdout/stderr、錯誤堆疊和診斷資訊；可能很大、可能包含敏感資訊，也可能有不同保存期限。

兩者可以關聯到同一個 operation ID，但不必存成同一份資料。

### 3. 補上 observability 和告警邊界

即使本輪不做 Slack/email notification，也應先定義哪些事件需要被看見，例如：

- embedding 長時間 stale 或連續失敗；
- import partial failure；
- hard-delete 執行；
- production restart/redeploy；
- readiness 在 deploy 後超時；
- disk/memory 超過門檻。

第一版可以只寫 structured log 或 dashboard，不一定立刻發通知。

### 4. 補上備份與復原驗證

Hard Delete 和 Redeploy 都會提高不可逆風險。除了「有 backup」，也應確認最近一次 restore test 是何時、可以恢復哪些資料、需要多久，以及 `embed.jsonl`/搜尋索引是否應備份或直接重建。

### 5. 分階段 rollout

一個可能的順序如下，仍可依團隊優先度調整：

1. 完成可信任的 admin authentication/authorization。
2. 先推出 server-side table、查看與 Restore。
3. 整理 embedding 狀態與單一資料來源，再推出 Regenerate。
4. 推出 Import，先保留 `public: false`，視需要加入 preview。
5. 在資料保留政策確認後推出 Hard Delete。
6. Ops 先推出 read-only Health。
7. 再推出 Drive Sync。
8. 最後才開放 Restart/Redeploy，並以 feature flag 或極小 allowlist 試行。

這個順序的目的不是增加流程，而是讓每一階段都能獨立驗證，並避免較低風險功能被 Ops 的安全 blocker 一起拖住。

## 希望提案作者協助回答的問題

以下問題不需要一次全部回答；可以先挑會影響架構或上線安全的部分。

### Product / workflow

1. Hard Delete 的主要業務原因是資料清理、誤匯入，還是隱私刪除要求？
2. 是否真的有編輯 soft-deleted essay 的使用情境？如果有，具體流程是什麼？
3. Drive 中的新作文是否已經過人工審核？Import 前需要預覽嗎？
4. 管理者通常是單人使用，還是可能有多人同時操作？
5. 對管理者而言，Regenerate 必須立即完成，還是看到 job 已排入即可？

### Architecture / data

6. Postgres、`database.jsonl`、`embed.jsonl` 各自目前扮演什麼角色？哪些是歷史相容需求？
7. production uvicorn 目前與預計會有幾個 worker？未來是否可能多 instance？
8. 搜尋索引能否由資料庫完整重建？重建時間大約多久？
9. embedding model/version 變更目前如何被偵測和處理？
10. Import duplicate 的正式定義是什麼？內容相同但 metadata 不同應如何處理？

### Security / operations

11. admin authentication 的獨立專案預計採用什麼信任來源，何時會完成？
12. backend 是否只能經過受信任 proxy 存取，還是 EC2 port 可被直接連線？
13. `make deploy` 現在實際包含哪些步驟？是否包含 frontend build、dependency install 或 migration？
14. production 是否有可用且實際演練過的 rollback/restore runbook？
15. 若 audit 寫入失敗，高風險 action 應 fail closed 還是仍允許執行？
16. 誰應該能看完整 ops output？它的保存期限應為多久？

## 建議繼續與 AI 討論的題目

以下題目適合分開討論，不建議一次要求 AI 產生完整實作，否則容易把未確認的假設直接固化成程式碼。

1. **Embedding consistency design**  
   提供目前 schema、`make_embedding.py`、`AppData` 載入流程與 worker model，請 AI 比較「Postgres 為唯一來源」和「保留 JSONL 雙寫」的失敗模式。

2. **Operation/job state machine**  
   請 AI 為 Import、Regenerate、Sync、Redeploy 提出最小共用狀態機，列出 retry、timeout、cancel、service restart 與 duplicate request 的轉換。

3. **Hard-delete threat and retention review**  
   先提供資料類型與刪除目的，再請 AI 檢查 audit snapshot、backup、log、search cache 中是否仍殘留被刪內容。

4. **Admin authorization matrix**  
   列出所有 endpoint 和角色，請 AI 用 least privilege 原則找出權限綁得太寬或可繞過的地方。

5. **Deployment failure-mode exercise**  
   逐一模擬 git pull 失敗、dependency 安裝失敗、migration 失敗、restart 成功但 readiness 失敗、stream 中斷，確認每個情境的系統狀態與人工下一步。

6. **Concurrency review**  
   提供實際 uvicorn/systemd 設定，請 AI 判斷 Python lock 是否足夠，以及哪些操作需要 database-backed lock 或 idempotency key。

7. **Observability and secret-redaction review**  
   提供可能的 command output 範例，請 AI 協助定義結構化 audit 欄位、敏感資訊類型與測試案例，但不要只依賴 regex 作為唯一保護。

8. **Reader/UX failure testing**  
   以管理員角度模擬部分成功、長時間執行、斷線重連、權限不足、資料已被另一人修改等情境，檢查 UI 是否會讓人誤判結果。

## 建議在 implementation plan 補上的驗收情境

這些不是完整 test list，而是容易在 happy-path spec 中遺漏的情境：

- 同一個 Regenerate request 被重送兩次，不會重複花費或錯誤覆蓋狀態。
- embedding 完成前 essay 被再次修改，最後不會被標成錯誤的 `current`。
- OpenAI 成功但本地索引寫入失敗，系統能辨識並恢復不一致。
- Import 中途服務重啟，重新執行不會產生重複資料。
- Hard Delete 在任何子步驟失敗時，不會留下無法解釋的半刪除狀態。
- 被刪資料不會意外留在搜尋結果、cache、未遮罩 log 或不應保留的 audit 欄位。
- Restart/Redeploy request 重送不會無限制重啟 production。
- Redeploy pull 成功但 readiness 失敗時，不會顯示為成功。
- 使用者在串流中斷後，仍能透過 operation ID 查到最終結果。
- 無 ops 權限者即使直接呼叫 endpoint，也無法執行或讀取敏感輸出。
- Audit 寫入失敗、資料庫中斷、磁碟滿、lock 被占用時，行為都有明確定義。

## 文件層級的小修正建議

- Guide 01 顯示「4 New or changed endpoints」，表格實際包含一個修改後的 GET 與四個 POST；建議寫成「1 changed + 4 new endpoints」避免誤解。
- 「See the whole database at once」和每頁 50 筆略有衝突，可改成「Browse the complete dataset with server-side pagination and sorting」。
- Guide 02 顯示「2 Must fix before shipping」，正文目前最明確的是 auth blocker；建議把第二個 blocker 獨立命名，而不是藏在同一段中。
- 建議在每個 Guide 增加 Assumptions，例如單 instance、單 worker、資料量級、管理者人數及可接受停機時間。
- 建議增加 Failure behavior 與 Rollback/Recovery 小節，讓 implementation planning 不只從 endpoint happy path 展開。

## 建議的下一步

在開始切 implementation tasks 前，建議先完成三個短討論：

1. 確認 authentication 專案與 Admin Console 的依賴關係，明確標示哪些功能會被它阻擋。
2. 畫出 Essay、embedding、JSONL 與 in-memory index 的權威來源和失敗恢復流程。
3. 決定第一版是否需要共用 operation/job 模型，以及目前的單 process/單 worker 假設是否成立。

上述三點確認後，其他問題多半可以在實作中逐步收斂，不需要現在全部定案。建議保留一份 decision log，記錄每個 open question 最後的選擇、理由和未採方案，避免後續只剩程式碼而失去決策背景。
