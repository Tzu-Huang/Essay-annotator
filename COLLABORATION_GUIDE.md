# Essay Annotator 協作指南

歡迎加入 Essay Annotator。開始第一張票前，請先讀完這份文件；約需 5 分鐘。

## 最重要的原則

1. **先討論，再寫程式。** 不要只看票的標題就開始實作。
2. **一張票一個 feature branch。** Branch 名稱要包含 Linear issue ID。
3. **完成實作不等於完成票。** 測試、review 與文件更新都屬於工作範圍。
4. **使用 Pull Request 合併。** 不直接 merge 或 push 到 `main`、`frontend-base`。
5. **`main` 是正式發佈分支。** 日常 feature 不直接合併進 `main`。

## 開始前需要的權限

確認自己可以存取 Linear、GitHub repository 與團隊使用的 Codex／OpenSpec Skills。若缺少任何權限，先通知 repository owner，不要用私人副本繞過團隊流程。

## 1. 開始實作前

開始一張 Linear 票時，先與 AI 討論約 10–20 分鐘，確認：

- 問題與預期結果是什麼。
- Acceptance Criteria 是否完整、可測試。
- 會修改哪些 frontend、backend、database 或 API。
- 有哪些安全性、資料遷移與相容性風險。
- 預計怎麼測試，以及 PR 應該合併到哪個 base branch。

如果票的內容不清楚，先在 Linear 留下問題或更新票的 Scope，不要自行擴大需求。

## 2. 建議使用 OpenSpec／Codex 開發流程

除非票上明確註明採用小型修改流程，否則使用以下完整流程：

### 討論與規劃

1. `/dev-explore ISSUE-ID`：閱讀票、探索程式與釐清需求。
2. `/dev-propose CHANGE-NAME --issue ISSUE-ID`：建立 OpenSpec proposal、設計與 tasks。

### 實作與驗證

1. `/dev-apply ISSUE-ID`：依 tasks 實作並建立小而清楚的 commits。
2. `/dev-test`：執行測試並留下可重現的驗證紀錄。
3. `/dev-review`：進行 closure review；有問題時使用 `/dev-fix`，修正後重新測試與 review。

Review 通過後再使用 `/dev-done` 完成 archive、push 與 Linear 狀態更新。

小型且風險低的修改可在團隊同意後使用 `/dev-quick`，但仍需要測試與 Pull Request。Proposal 與 feature branch 屬於規劃工作；完成 `/dev-propose` 後，先確認產出的 Scope 與 tasks，再將 Linear 票改成 In Progress。

## 3. Branch 與 Pull Request 規則

每張票從正確的 base branch 建立 feature branch，例如：

```text
feature/ZAC-123_short-description
fix/ZAC-123_short-description
```

目前已存在：

- `frontend-base`：frontend 工作的整合分支。
- `main`：穩定、可發佈的正式分支。

Backend 整合分支尚未正式建立。建立 `backend-base` 前，backend 票必須由 repository owner 在 Linear 上確認 target branch；不要自行建立新的長期分支。當 `backend-base` 正式存在於 GitHub，且 repository owner 在本文件或 Linear 公告後，才視為有效的 backend integration branch。

建議的合併路徑：

```text
Frontend:
feature branch → PR → frontend-base → release PR → main

Backend（若團隊正式建立 backend-base）:
feature branch → PR → backend-base → release PR → main
```

跨 frontend 與 backend 的功能，要在開始前決定共同的 integration strategy，避免兩邊分別合併後無法一起運作。

禁止直接 push 或直接 merge 到任何 integration／release branch，包括現在的 `frontend-base`、`main`，以及未來可能建立的 `backend-base`。

## 4. Pull Request 最低要求

送出 PR 前，確認：

- PR title 包含 Linear issue ID，例如 `[ZAC-123] Fix private essay visibility`。
- Description 說明問題、解法、風險與未處理範圍。
- 列出實際執行的測試指令與結果。
- UI 修改附 screenshot；API 修改附 request／response 範例。
- PR 已連結 Linear issue，並取得至少一位其他協作者的 approval。

未通過 CI、測試或 review 的 PR 不應合併。任何風險等級都不能由作者自行 approve 後合併。

## 5. 票完成的定義

只有符合以下條件，才將 Linear 票標記為 Done：

1. Acceptance Criteria 全部完成。
2. 新行為有自動化測試，既有測試通過。
3. `/dev-review` 或人工 code review 沒有未解決的 blocking finding。
4. PR 已合併到正確的 integration branch。
5. Linear 留有測試結果、PR 連結、必要的文件更新與後續事項。

## AI 協作提醒

AI 是協作者，不是最終決策者。使用 AI 產生或修改程式後，開發者仍需：

- 理解變更內容，不提交看不懂的程式。
- 檢查 AI 是否擴大票的 Scope。
- 確認沒有洩漏 API key、使用者文章或其他敏感資料。
- 親自閱讀 diff、測試結果與 PR。
- 對合併後的行為負責。

## 開始第一張票

1. 在 Linear 選擇一張 Backlog 票。
2. 將票指派給自己，但先不要改成 In Progress。
3. 在 Codex 執行 `/dev-explore ISSUE-ID`。
4. 確認 Scope、測試方式與 target branch。
5. 完成 `/dev-propose` 或經團隊同意採用 `/dev-quick` 後，才將票改成 In Progress 並開始實作。
