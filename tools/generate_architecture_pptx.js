const pptxgen = require("../.pptx-tools/node_modules/pptxgenjs");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Essay Annotator";
pptx.subject = "Essay Annotator 架構、GitHub/AWS 部署與網站更新流程";
pptx.title = "Essay Annotator 架構與網站更新流程";
pptx.company = "Essay Annotator";
pptx.lang = "zh-TW";
pptx.theme = {
  headFontFace: "Microsoft JhengHei",
  bodyFontFace: "Microsoft JhengHei",
  lang: "zh-TW",
};
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";

const C = {
  navy: "17233C",
  navy2: "223457",
  teal: "0E8F8F",
  mint: "53C7B7",
  coral: "F06A5F",
  amber: "F2B84B",
  ink: "172033",
  muted: "5E6B7E",
  line: "CCD5E2",
  pale: "F3F6F9",
  paleTeal: "E7F6F4",
  paleCoral: "FFF0ED",
  paleAmber: "FFF6DE",
  white: "FFFFFF",
  green: "2D9B69",
  red: "C7443E",
};

const S = pptx.ShapeType;
const FONT = "Microsoft JhengHei";
const shadow = () => ({ type: "outer", color: "000000", blur: 3, angle: 45, distance: 1, opacity: 0.12 });

function addHeader(slide, title, kicker, dark = false) {
  slide.background = { color: dark ? C.navy : C.pale };
  if (kicker) slide.addText(kicker.toUpperCase(), { x: 0.65, y: 0.32, w: 4.2, h: 0.25, fontFace: FONT, fontSize: 10, bold: true, charSpacing: 1.4, color: dark ? C.mint : C.teal, margin: 0 });
  slide.addText(title, { x: 0.65, y: 0.62, w: 12.0, h: 0.58, fontFace: FONT, fontSize: 28, bold: true, color: dark ? C.white : C.ink, margin: 0, breakLine: false, fit: "shrink" });
}

function footer(slide, n, label = "Essay Annotator｜架構與發版") {
  slide.addText(label, { x: 0.65, y: 7.18, w: 5.4, h: 0.16, fontFace: FONT, fontSize: 8, color: "7C899A", margin: 0 });
  slide.addText(String(n).padStart(2, "0"), { x: 12.15, y: 7.12, w: 0.52, h: 0.22, fontFace: FONT, fontSize: 9, bold: true, color: C.teal, align: "right", margin: 0 });
}

function card(slide, x, y, w, h, title, body, opts = {}) {
  const fill = opts.fill || C.white;
  const border = opts.border || C.line;
  slide.addShape(S.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: border, width: opts.lineWidth || 1 }, shadow: opts.shadow === false ? undefined : shadow() });
  if (opts.badge) {
    slide.addShape(S.ellipse, { x: x + 0.22, y: y + 0.2, w: 0.48, h: 0.48, fill: { color: opts.accent || C.teal }, line: { color: opts.accent || C.teal } });
    slide.addText(opts.badge, { x: x + 0.22, y: y + 0.205, w: 0.48, h: 0.46, fontFace: FONT, fontSize: opts.badgeSize || 13, bold: true, color: C.white, align: "center", valign: "mid", margin: 0 });
  }
  const tx = x + (opts.badge ? 0.84 : 0.24);
  slide.addText(title, { x: tx, y: y + 0.18, w: w - (tx - x) - 0.2, h: 0.34, fontFace: FONT, fontSize: opts.titleSize || 16, bold: true, color: opts.titleColor || C.ink, margin: 0, fit: "shrink" });
  if (body) slide.addText(body, { x: x + 0.24, y: y + (opts.bodyY || 0.72), w: w - 0.48, h: h - (opts.bodyY || 0.72) - 0.18, fontFace: FONT, fontSize: opts.bodySize || 11.5, color: opts.bodyColor || C.muted, margin: 0, breakLine: false, valign: "top", fit: "shrink", paraSpaceAfterPt: 5 });
}

function pill(slide, x, y, w, text, color, textColor = C.white) {
  slide.addShape(S.roundRect, { x, y, w, h: 0.34, rectRadius: 0.1, fill: { color }, line: { color } });
  slide.addText(text, { x, y: y + 0.02, w, h: 0.27, fontFace: FONT, fontSize: 9.5, bold: true, color: textColor, align: "center", valign: "mid", margin: 0, fit: "shrink" });
}

function arrow(slide, x, y, w, h = 0, color = C.teal, width = 2.4, dashed = false) {
  slide.addShape(S.line, { x, y, w, h, line: { color, width, dash: dashed ? "dash" : "solid", endArrowType: "triangle" } });
}

function label(slide, x, y, w, text, color = C.muted, size = 10, align = "center") {
  slide.addText(text, { x, y, w, h: 0.32, fontFace: FONT, fontSize: size, color, bold: false, align, margin: 0, fit: "shrink" });
}

function note(slide, text) {
  // Keep speaker-note copy in the generator source. PptxGenJS currently emits
  // notesMasterIdLst in an order rejected by strict Open XML validation.
  void slide;
  void text;
}

// 1 — Title
{
  const slide = pptx.addSlide();
  slide.background = { color: C.navy };
  slide.addShape(S.arc, { x: 9.35, y: -0.65, w: 4.7, h: 4.7, adjustPoint: 0.22, rotate: 18, fill: { color: C.teal, transparency: 18 }, line: { color: C.teal, transparency: 100 } });
  slide.addShape(S.ellipse, { x: 10.55, y: 4.5, w: 2.1, h: 2.1, fill: { color: C.coral, transparency: 5 }, line: { color: C.coral } });
  slide.addText("ESSAY ANNOTATOR", { x: 0.78, y: 0.7, w: 4.8, h: 0.35, fontFace: FONT, fontSize: 12, bold: true, charSpacing: 2.3, color: C.mint, margin: 0 });
  slide.addText("架構與網站更新流程", { x: 0.78, y: 1.55, w: 8.7, h: 0.9, fontFace: FONT, fontSize: 43, bold: true, color: C.white, margin: 0 });
  slide.addText("從 Linear、Git branch、GitHub Actions，一路到 AWS EC2、RDS 與 essayannotator.com", { x: 0.82, y: 2.72, w: 8.75, h: 0.88, fontFace: FONT, fontSize: 17, color: "D9E4F0", margin: 0, breakLine: false, fit: "shrink" });
  pill(slide, 0.82, 4.45, 1.55, "開發流程", C.teal);
  pill(slide, 2.55, 4.45, 1.55, "部署控制", C.coral);
  pill(slide, 4.28, 4.45, 1.55, "AWS 運行", C.amber, C.ink);
  slide.addText("核心觀念", { x: 0.82, y: 5.35, w: 1.2, h: 0.28, fontFace: FONT, fontSize: 11, bold: true, color: C.mint, margin: 0 });
  slide.addText("GitHub 決定「哪一版可以被送出」；AWS 負責「真正把網站跑起來」。", { x: 0.82, y: 5.78, w: 8.75, h: 0.6, fontFace: FONT, fontSize: 19.5, bold: true, color: C.white, margin: 0, fit: "shrink" });
  footer(slide, 1, "Essay Annotator｜中文架構說明");
  note(slide, "這份簡報先建立整體心智模型，再分別說明分支、GitHub、AWS、資料與網站更新步驟。最重要的區分：main 是正式程式碼來源，不是伺服器；AWS 才是網站實際運行的位置。");
}

// 2 — Mental model
{
  const slide = pptx.addSlide();
  addHeader(slide, "先記住這張圖：從工作需求到網站輸出的五個節點", "01｜整體心智模型");
  const xs = [0.72, 3.35, 6.0, 8.65, 11.03];
  arrow(slide, 2.86, 3.02, 0.4, 0, C.line, 2);
  arrow(slide, 5.49, 3.02, 0.4, 0, C.line, 2);
  arrow(slide, 8.14, 3.02, 0.4, 0, C.line, 2);
  arrow(slide, 10.78, 3.02, 0.18, 0, C.line, 2);
  card(slide, xs[0], 1.72, 2.12, 2.55, "Linear", "記錄要做什麼\n票號、狀態、驗收條件\n\n不保存 production 程式", { badge: "1", accent: C.coral, fill: C.paleCoral });
  card(slide, xs[1], 1.72, 2.12, 2.55, "Git branch", "保存不同版本\nfeature / fix / main\n\n決定改動屬於哪一版", { badge: "2", accent: C.teal, fill: C.paleTeal });
  card(slide, xs[2], 1.72, 2.12, 2.55, "GitHub", "PR、CI、review\n建立 release\n等待 production 批准", { badge: "3", accent: C.navy2 });
  card(slide, xs[3], 1.72, 2.12, 2.55, "AWS", "S3 保存 release\nSSM 命令 EC2\nRDS 保存 PostgreSQL", { badge: "4", accent: C.amber, fill: C.paleAmber });
  card(slide, xs[4], 1.72, 1.58, 2.55, "網站", "EC2 上的 Nginx\n+ FastAPI\n\n對外提供 HTTPS", { badge: "5", accent: C.green, titleSize: 15, bodySize: 10.5 });
  slide.addShape(S.roundRect, { x: 1.15, y: 5.0, w: 11.0, h: 1.12, rectRadius: 0.08, fill: { color: C.navy }, line: { color: C.navy } });
  slide.addText("main ≠ 網站主機", { x: 1.52, y: 5.25, w: 2.45, h: 0.32, fontFace: FONT, fontSize: 18, bold: true, color: C.mint, margin: 0 });
  slide.addText("main 是『正式程式碼來源』；只有部署成功後，AWS 上的網站才會切換到該版本。", { x: 4.12, y: 5.22, w: 7.55, h: 0.45, fontFace: FONT, fontSize: 16, color: C.white, margin: 0, fit: "shrink" });
  footer(slide, 2);
  note(slide, "Linear 是管理工作；branch 是管理版本；GitHub 是測試、審批和部署入口；AWS 是實際運行環境。即使 main 已更新，只要部署尚未成功，網站仍可能跑上一版。");
}

// 3 — Branches
{
  const slide = pptx.addSlide();
  addHeader(slide, "Branch 現況：名稱與實際角色沒有完全一致", "02｜版本與分支");
  slide.addText("目前實務", { x: 0.72, y: 1.35, w: 2.1, h: 0.4, fontFace: FONT, fontSize: 19, bold: true, color: C.coral, margin: 0 });
  arrow(slide, 2.6, 2.65, 0.8, 0, C.coral);
  arrow(slide, 6.2, 2.65, 0.8, 0, C.coral);
  card(slide, 0.75, 1.92, 1.8, 1.65, "feature / fix", "每張 Linear 票的短期工作分支", { fill: C.white, border: C.coral, shadow: false });
  card(slide, 3.45, 1.92, 2.7, 1.65, "backend_base", "實際被當成整合／測試區\n包含 frontend、backend、AWS 與部署設定", { fill: C.paleCoral, border: C.coral, shadow: false });
  card(slide, 7.05, 1.92, 2.15, 1.65, "main", "人工升版後的正式來源\n理論上對應 production baseline", { fill: C.paleAmber, border: C.amber, shadow: false });
  card(slide, 10.05, 1.92, 2.35, 1.65, "frontend_base", "正式規格標為 legacy\n不應再作為發布來源", { fill: "ECEFF3", border: "A7B1C0", shadow: false });
  pill(slide, 3.82, 3.72, 1.95, "目前多 61 commits*", C.coral);
  slide.addShape(S.line, { x: 0.7, y: 4.4, w: 11.95, h: 0, line: { color: C.line, width: 1 } });
  slide.addText("正式規格（目標流程）", { x: 0.72, y: 4.7, w: 2.7, h: 0.4, fontFace: FONT, fontSize: 19, bold: true, color: C.teal, margin: 0 });
  arrow(slide, 3.28, 5.75, 1.0, 0, C.teal);
  arrow(slide, 6.52, 5.75, 1.0, 0, C.teal);
  card(slide, 1.35, 5.25, 1.85, 1.02, "main", "開發基準", { fill: C.paleTeal, border: C.teal, shadow: false, bodyY: 0.58, bodySize: 10.5 });
  card(slide, 4.35, 5.25, 2.1, 1.02, "短期 feature / fix", "實作＋測試＋review", { fill: C.white, border: C.teal, shadow: false, bodyY: 0.58, bodySize: 10.5 });
  card(slide, 7.6, 5.25, 1.85, 1.02, "PR → main", "通過才升版", { fill: C.paleTeal, border: C.teal, shadow: false, bodyY: 0.58, bodySize: 10.5 });
  slide.addText("關鍵問題：實務使用 backend_base，但規格要求從 main 開發。團隊需明確選擇並寫成唯一規則。", { x: 9.9, y: 5.1, w: 2.5, h: 1.28, fontFace: FONT, fontSize: 12, bold: true, color: C.ink, margin: 0.08, fill: { color: C.paleAmber }, fit: "shrink" });
  slide.addText("*依本機保存的 origin refs；外部 GitHub 狀態需另行核對。", { x: 0.75, y: 6.68, w: 5.8, h: 0.2, fontFace: FONT, fontSize: 8.5, color: C.muted, margin: 0 });
  footer(slide, 3);
  note(slide, "backend_base 的名稱會讓人以為只有後端，但目前它包含整套產品與基礎設施改動。frontend_base 已被規格列為舊分支。正式規格偏向 trunk-based：main 當基準、短期分支、PR 回 main；目前實務則多了一個 backend_base 整合層。");
}

// 4 — Ticket flow
{
  const slide = pptx.addSlide();
  addHeader(slide, "一張 Linear 票，Agent 實際會經過哪些階段？", "03｜開發與驗證");
  const steps = [
    ["1", "需求／提案", "理解需求\n建立 OpenSpec 設計與 tasks", C.coral],
    ["2", "建立分支", "feature/ZAC-xx\n或 fix/ZAC-xx", C.teal],
    ["3", "實作", "frontend、backend、database\n或 deploy 設定", C.navy2],
    ["4", "測試與 review", "lint、unit tests、build\nsecurity、code review", C.amber],
    ["5", "升版", "PR 合併到約定分支\n最後進 main", C.green],
  ];
  for (let i = 0; i < steps.length - 1; i++) arrow(slide, 2.55 + i * 2.55, 3.05, 0.42, 0, C.line, 2);
  steps.forEach((s, i) => card(slide, 0.55 + i * 2.55, 1.82, 2.0, 2.45, s[1], s[2], { badge: s[0], accent: s[3], fill: i % 2 ? C.white : C.pale, bodySize: 11 }));
  slide.addShape(S.roundRect, { x: 0.82, y: 4.85, w: 11.75, h: 1.15, rectRadius: 0.06, fill: { color: C.white }, line: { color: C.line, width: 1 } });
  slide.addText("每次 Agent 開始前都應回答", { x: 1.15, y: 5.12, w: 2.45, h: 0.28, fontFace: FONT, fontSize: 15, bold: true, color: C.teal, margin: 0 });
  slide.addText("改哪一層？　從哪個 branch 開始？　PR 到哪裡？　會不會碰 production？　哪一步需要人類批准？", { x: 3.75, y: 5.05, w: 8.15, h: 0.48, fontFace: FONT, fontSize: 14, bold: true, color: C.ink, margin: 0, fit: "shrink" });
  slide.addText("Linear 管進度；OpenSpec 管設計與證據；Git commit 管實際變更。三者票號應一致。", { x: 2.08, y: 6.35, w: 9.2, h: 0.38, fontFace: FONT, fontSize: 14, color: C.muted, align: "center", margin: 0 });
  footer(slide, 4);
  note(slide, "這一頁用來閱讀 Agent 的行為。Agent 不應只說『完成了』，而應能指出分支、commit、測試、review 和最終合併位置。OpenSpec 是開發證據，不是 production 本身。");
}

// 5 — GitHub responsibilities
{
  const slide = pptx.addSlide();
  addHeader(slide, "GitHub 不承載網站，但它是 production 的控制入口", "04｜GitHub 的角色");
  const cx = 6.67, cy = 3.65;
  arrow(slide, 3.2, 2.25, 2.1, 0, C.teal, 2.2);
  arrow(slide, 3.2, 5.1, 2.1, 0, C.teal, 2.2);
  arrow(slide, 8.05, 2.25, 2.1, 0, C.coral, 2.2);
  arrow(slide, 8.05, 5.1, 2.1, 0, C.coral, 2.2);
  slide.addShape(S.ellipse, { x: 5.3, y: 2.28, w: 2.75, h: 2.75, fill: { color: C.navy }, line: { color: C.navy }, shadow: shadow() });
  slide.addText("GitHub", { x: 5.7, y: 3.02, w: 1.95, h: 0.4, fontFace: FONT, fontSize: 27, bold: true, color: C.white, align: "center", margin: 0 });
  slide.addText("版本＋自動化＋審批", { x: 5.55, y: 3.58, w: 2.25, h: 0.3, fontFace: FONT, fontSize: 11, color: C.mint, align: "center", margin: 0 });
  card(slide, 0.75, 1.42, 2.45, 1.5, "Pull Request", "比較改動、留言、review\n決定能否進 main", { badge: "PR", badgeSize: 10, accent: C.teal, fill: C.paleTeal });
  card(slide, 0.75, 4.45, 2.45, 1.5, "CI Quality Gates", "Frontend lint/test/build\nBackend tests／security scan", { badge: "CI", badgeSize: 10, accent: C.teal, fill: C.paleTeal });
  card(slide, 10.15, 1.42, 2.45, 1.5, "Immutable Release", "以完整 commit SHA 打包\n附 SHA-256 checksum", { badge: "R", accent: C.coral, fill: C.paleCoral });
  card(slide, 10.15, 4.45, 2.45, 1.5, "Production Approval", "Required reviewer 按批准後\n才可申請 AWS OIDC 權限", { badge: "✓", accent: C.coral, fill: C.paleCoral });
  slide.addShape(S.roundRect, { x: 3.92, y: 5.75, w: 5.5, h: 0.75, rectRadius: 0.04, fill: { color: C.paleAmber }, line: { color: C.amber } });
  slide.addText("GitHub 的 runner 是暫時工作機；真正網站仍在 AWS EC2。", { x: 4.15, y: 5.98, w: 5.04, h: 0.26, fontFace: FONT, fontSize: 13.5, bold: true, color: C.ink, align: "center", margin: 0 });
  footer(slide, 5);
  note(slide, "Build immutable release 指同一個 commit 對應固定的壓縮檔與 checksum，不能用同一名稱偷偷覆蓋。Review production 是部署批准，不是一般 code review。GitHub runner 完成打包後即消失，不是網站主機。");
}

// 6 — Public + OIDC
{
  const slide = pptx.addSlide();
  addHeader(slide, "Public repo 為什麼不等於公開 AWS 權限？", "05｜GitHub ↔ AWS 信任邊界");
  // arrows behind nodes
  arrow(slide, 3.0, 3.0, 0.34, 0, C.line, 2);
  arrow(slide, 6.65, 3.0, 1.1, 0, C.teal, 3);
  arrow(slide, 10.45, 3.0, 0.7, 0, C.teal, 3);
  card(slide, 0.7, 1.95, 2.3, 2.2, "陌生人／Fork", "可以閱讀程式碼\n可以提交 Pull Request\n可以在自己的 fork 執行 Actions", { badge: "外", accent: C.muted, fill: "ECEFF3" });
  card(slide, 4.2, 1.72, 2.45, 2.65, "GitHub production", "必須是指定 repo\n必須進入 production Environment\n應等待 Required reviewer", { badge: "GH", badgeSize: 9, accent: C.coral, fill: C.paleCoral, border: C.coral });
  card(slide, 7.75, 1.72, 2.7, 2.65, "AWS OIDC 驗證", "aud = sts.amazonaws.com\nsub = repo:Tzu-Huang/Essay-annotator:\nenvironment:production", { badge: "ID", badgeSize: 9, accent: C.teal, fill: C.paleTeal, border: C.teal, bodySize: 10.5 });
  card(slide, 11.15, 1.95, 1.55, 2.2, "短效 Role", "只准指定\nS3 prefix\nSSM 文件\nEC2 instance", { accent: C.amber, fill: C.paleAmber, border: C.amber, titleSize: 14, bodySize: 9.5 });
  slide.addShape(S.line, { x: 3.45, y: 1.35, w: 0, h: 3.75, line: { color: C.red, width: 2.5, dash: "dash" } });
  label(slide, 2.65, 1.1, 1.7, "不能跨過的信任邊界", C.red, 10);
  slide.addShape(S.roundRect, { x: 1.0, y: 5.1, w: 11.25, h: 1.15, rectRadius: 0.06, fill: { color: C.navy }, line: { color: C.navy } });
  slide.addText("Public 安全的必要條件", { x: 1.35, y: 5.4, w: 2.15, h: 0.27, fontFace: FONT, fontSize: 15, bold: true, color: C.mint, margin: 0 });
  slide.addText("main 有保護　＋　production 需人工批准　＋　OIDC trust 精準　＋　AWS Role 最小權限", { x: 3.7, y: 5.34, w: 7.95, h: 0.4, fontFace: FONT, fontSize: 13.2, bold: true, color: C.white, margin: 0, fit: "shrink" });
  pill(slide, 4.9, 6.48, 3.55, "外部平台設定仍需實際驗證", C.coral);
  footer(slide, 6);
  note(slide, "公開 repo 讓人看見 AWS Account ID、Instance ID 或 bucket 名稱，但這些不是密碼。真正授權由 OIDC token 的 audience、subject，以及 IAM policy 決定。風險來自主分支未保護、Environment 無 reviewer、或 IAM 權限過大，而不是 Public 這個字本身。");
}

// 7 — AWS map
{
  const slide = pptx.addSlide();
  addHeader(slide, "AWS 上有哪些元件？每個元件只做一件主要的事", "06｜AWS 生產環境");
  // connectors first
  arrow(slide, 2.75, 3.12, 1.25, 0, C.teal);
  arrow(slide, 6.95, 3.12, 1.25, 0, C.teal);
  arrow(slide, 10.95, 3.12, 0.35, 0, C.teal);
  card(slide, 0.6, 2.02, 2.15, 2.15, "GitHub Actions", "建立 release\n取得短效 OIDC credential\n送出部署命令", { badge: "GH", badgeSize: 9, accent: C.navy2 });
  card(slide, 4.0, 2.02, 2.95, 2.15, "IAM + OIDC", "判斷 GitHub 身分\n發短效 Role\n限制可操作的 AWS 資源", { badge: "IAM", badgeSize: 7, accent: C.coral, fill: C.paleCoral });
  card(slide, 8.2, 2.02, 2.75, 2.15, "S3 + SSM", "S3：保存不可變 release\nSSM：把固定部署命令送到 EC2", { badge: "OPS", badgeSize: 7, accent: C.amber, fill: C.paleAmber });
  card(slide, 11.3, 2.02, 1.35, 2.15, "EC2", "真正運行網站", { accent: C.green, titleSize: 14, bodySize: 10, fill: C.paleTeal, border: C.green });
  card(slide, 3.95, 5.25, 3.05, 1.1, "Security Group / DNS / TLS", "限制 80/443 與管理流量；domain 指向 EC2；Nginx 處理 HTTPS", { fill: C.white, border: C.line, shadow: false, bodyY: 0.58, bodySize: 10.5 });
  card(slide, 8.0, 5.25, 3.0, 1.1, "RDS PostgreSQL", "保存結構化資料；保持 private，只接受應用程式安全群組", { fill: C.paleTeal, border: C.teal, shadow: false, bodyY: 0.58, bodySize: 10.5 });
  slide.addText("AWS 是執行環境；GitHub 只是以受限身分要求 AWS 執行一次部署。", { x: 2.2, y: 6.62, w: 8.95, h: 0.3, fontFace: FONT, fontSize: 14, bold: true, color: C.ink, align: "center", margin: 0 });
  footer(slide, 7);
  note(slide, "IAM 和 OIDC 是門禁；S3 是 release 倉庫；SSM 是受控遙控器；EC2 是主機；RDS 是資料庫。部署不應使用 SSH 私鑰或長效 AWS key。Role policy 只允許指定 S3 prefix、指定 SSM document 和指定 EC2 instance。");
}

// 8 — Runtime traffic
{
  const slide = pptx.addSlide();
  addHeader(slide, "使用者打開 essayannotator.com 時，請求怎麼走？", "07｜網站運行流量");
  arrow(slide, 2.8, 3.05, 0.75, 0, C.teal, 3);
  arrow(slide, 6.45, 2.0, 0.95, 0, C.coral, 2.5);
  arrow(slide, 6.45, 4.2, 0.95, 0, C.teal, 2.5);
  arrow(slide, 10.4, 3.95, 0.55, 0, C.teal, 2.5);
  card(slide, 0.4, 1.95, 2.4, 2.2, "瀏覽器", "HTTPS 請求\nessayannotator.com", { badge: "人", accent: C.navy2, bodySize: 10.5 });
  card(slide, 3.55, 1.72, 2.9, 2.65, "EC2：Nginx", "唯一公開入口\n80 → 443 redirect\n提供 frontend 靜態檔\n把 /api/* 轉給 FastAPI", { badge: "N", accent: C.coral, fill: C.paleCoral });
  card(slide, 7.4, 1.05, 3.0, 1.85, "Frontend /", "Vite build 的 HTML、CSS、JS\nSPA route 回到 index.html", { badge: "UI", badgeSize: 9, accent: C.amber, fill: C.paleAmber });
  card(slide, 7.4, 3.28, 3.0, 1.85, "FastAPI /api/*", "只監聽 127.0.0.1:8000\nsystemd 管理；失敗自動重啟", { badge: "API", badgeSize: 7, accent: C.teal, fill: C.paleTeal });
  card(slide, 10.95, 3.28, 1.7, 1.85, "RDS／持久資料", "PostgreSQL\n＋ shared files", { accent: C.green, fill: C.paleTeal, border: C.green, titleSize: 13, bodySize: 9.5 });
  slide.addShape(S.roundRect, { x: 2.05, y: 5.65, w: 9.2, h: 0.85, rectRadius: 0.05, fill: { color: C.navy }, line: { color: C.navy } });
  slide.addText("Port 8000 不對外開放；外界只能透過 Nginx 的 HTTPS 入口呼叫 API。", { x: 2.45, y: 5.91, w: 8.4, h: 0.28, fontFace: FONT, fontSize: 15, bold: true, color: C.white, align: "center", margin: 0 });
  footer(slide, 8);
  note(slide, "Nginx 同時服務 frontend 與代理 backend，因此瀏覽器只看到同一個 domain。FastAPI 綁定 loopback，Security Group 不應公開 8000。systemd 使用 current symlink 指向目前 release，讓版本切換與回滾可控。");
}

// 9 — Data locations
{
  const slide = pptx.addSlide();
  addHeader(slide, "資料不是全部放在同一個 database：程式、資料、秘密要分開", "08｜資料與持久化");
  const items = [
    ["程式碼", "GitHub", "Frontend、Backend、deploy scripts\n不包含 production 資料與秘密", C.navy2],
    ["Release", "AWS S3", "以 commit SHA 命名的 .tgz\n搭配 SHA-256 checksum", C.amber],
    ["結構化資料", "AWS RDS", "PostgreSQL：essay metadata、管理資料等", C.teal],
    ["Embedding／JSONL", "EC2 shared data", "/var/lib/essay-annotator\n不隨 release 切換", C.green],
    ["Secrets", "Root-managed / AWS", "OpenAI key、POSTGRES_URL\n不得進 Git 或 release", C.coral],
  ];
  items.forEach((it, i) => {
    const y = 1.45 + i * 1.04;
    slide.addShape(S.roundRect, { x: 0.75, y, w: 11.85, h: 0.82, rectRadius: 0.04, fill: { color: i % 2 ? C.white : "EEF2F6" }, line: { color: C.line, width: 0.7 } });
    slide.addShape(S.ellipse, { x: 1.0, y: y + 0.14, w: 0.52, h: 0.52, fill: { color: it[3] }, line: { color: it[3] } });
    slide.addText(String(i + 1), { x: 1.0, y: y + 0.16, w: 0.52, h: 0.42, fontFace: FONT, fontSize: 12, bold: true, color: C.white, align: "center", margin: 0 });
    slide.addText(it[0], { x: 1.75, y: y + 0.18, w: 1.7, h: 0.28, fontFace: FONT, fontSize: 15, bold: true, color: C.ink, margin: 0 });
    pill(slide, 3.58, y + 0.23, 1.9, it[1], it[3]);
    slide.addText(it[2], { x: 5.8, y: y + 0.13, w: 6.2, h: 0.52, fontFace: FONT, fontSize: 11.5, color: C.muted, margin: 0, fit: "shrink" });
  });
  slide.addText("部署只替換程式版本，不應覆蓋 RDS、shared essay data 或 production secrets。", { x: 1.45, y: 6.68, w: 10.45, h: 0.32, fontFace: FONT, fontSize: 14, bold: true, color: C.coral, align: "center", margin: 0 });
  footer(slide, 9);
  note(slide, "RDS 不是唯一持久化位置。Embedding 與 JSONL 目前保留為 shared runtime files，因此 release 目錄必須是不可變程式，shared data 則獨立。這也是 release 打包時排除 .env、jsonl、sqlite、db 和 private key 的原因。");
}

// 10 — Release pipeline
{
  const slide = pptx.addSlide();
  addHeader(slide, "當 main 更新：GitHub 如何把一個 commit 變成可部署版本？", "09｜自動發版管線");
  const y = 2.2;
  const data = [
    ["1", "選 commit", "只接受 main 可追溯 SHA", C.navy2],
    ["2", "重新驗證", "frontend / backend / security", C.teal],
    ["3", "不可變打包", ".tgz + SHA-256", C.amber],
    ["4", "人工批准", "GitHub production Environment", C.coral],
    ["5", "送到 AWS", "S3 → SSM → EC2", C.green],
  ];
  for (let i = 0; i < 4; i++) arrow(slide, 2.63 + i * 2.58, 3.15, 0.45, 0, "8291A6", 2.2);
  data.forEach((d, i) => card(slide, 0.5 + i * 2.58, y, 2.12, 2.02, d[1], d[2], { badge: d[0], accent: d[3], fill: i === 3 ? C.paleCoral : C.white, border: i === 3 ? C.coral : C.line, titleSize: 13.5, bodySize: 10.5 }));
  slide.addShape(S.roundRect, { x: 1.1, y: 4.95, w: 11.1, h: 1.15, rectRadius: 0.06, fill: { color: C.paleTeal }, line: { color: C.teal, width: 1.2 } });
  slide.addText("為什麼要 immutable？", { x: 1.48, y: 5.25, w: 2.4, h: 0.3, fontFace: FONT, fontSize: 16, bold: true, color: C.teal, margin: 0 });
  slide.addText("同一個 SHA 不可被其他內容覆蓋；每次部署都能追溯來源、checksum、目前與上一版。", { x: 3.95, y: 5.18, w: 7.75, h: 0.45, fontFace: FONT, fontSize: 13.5, color: C.ink, margin: 0, fit: "shrink" });
  pill(slide, 4.75, 6.43, 3.8, "Workflow 目前位於 backend_base", C.coral);
  footer(slide, 10);
  note(slide, "production-release workflow 會再次執行測試，而不是直接相信先前結果。打包排除 runtime data 和 secrets。批准後才給 id-token: write，使用 OIDC 換短效 AWS credential。依本機 refs，這個 workflow 尚未存在 origin/main，因此現階段更像待啟用設計。");
}

// 11 — Website update steps
{
  const slide = pptx.addSlide();
  addHeader(slide, "要更新網站：人類與 Agent 的 5 個大步驟", "10｜網站更新 SOP", true);
  const rows = [
    ["01", "開發候選版", "從約定基準建立 feature/fix branch；Agent 實作並留下 commit、tests、OpenSpec 證據。", C.teal],
    ["02", "整合與驗收", "PR 到約定整合分支；CI、code review、安全掃描通過。現在實務通常先進 backend_base。", C.mint],
    ["03", "升到 main", "人工確認 release scope、資料 migration、已知限制與 rollback plan，再把候選版合併進 main。", C.amber],
    ["04", "批准 production", "GitHub 建立 immutable release；Required reviewer 確認 commit SHA 後批准 production job。", C.coral],
    ["05", "部署後確認", "EC2 切換 current release；檢查 HTTPS 首頁、/api/ready、主要功能與資料，再保留上一版。", C.green],
  ];
  rows.forEach((r, i) => {
    const y = 1.38 + i * 1.05;
    if (i < rows.length - 1) slide.addShape(S.line, { x: 1.33, y: y + 0.82, w: 0, h: 0.28, line: { color: "6B7C95", width: 2, endArrowType: "triangle" } });
    slide.addShape(S.ellipse, { x: 0.82, y: y + 0.08, w: 1.02, h: 0.72, fill: { color: r[3] }, line: { color: r[3] } });
    slide.addText(r[0], { x: 0.82, y: y + 0.21, w: 1.02, h: 0.3, fontFace: FONT, fontSize: 15, bold: true, color: i === 2 ? C.ink : C.white, align: "center", margin: 0 });
    slide.addText(r[1], { x: 2.12, y: y + 0.02, w: 2.15, h: 0.34, fontFace: FONT, fontSize: 18, bold: true, color: C.white, margin: 0 });
    slide.addText(r[2], { x: 4.28, y: y, w: 7.85, h: 0.7, fontFace: FONT, fontSize: 12.5, color: "D9E4F0", margin: 0, fit: "shrink", valign: "mid" });
  });
  slide.addShape(S.roundRect, { x: 9.55, y: 6.55, w: 2.7, h: 0.42, rectRadius: 0.08, fill: { color: C.white, transparency: 88 }, line: { color: C.mint, transparency: 35 } });
  slide.addText("只有 Step 4–5 會碰 production", { x: 9.65, y: 6.65, w: 2.5, h: 0.18, fontFace: FONT, fontSize: 9.5, bold: true, color: C.mint, align: "center", margin: 0 });
  footer(slide, 11, "Essay Annotator｜網站更新 SOP");
  note(slide, "前三步主要是程式碼與驗證；第四步才授權 production；第五步才在 EC2 切版。任何 database migration 都必須在第三步明確列出備份和回滾方案，不能把它當一般程式部署。");
}

// 12 — Activation and rollback
{
  const slide = pptx.addSlide();
  addHeader(slide, "EC2 如何安全切版？失敗時如何回滾？", "11｜Atomic deployment 與 rollback");
  arrow(slide, 3.0, 2.38, 0.85, 0, C.teal);
  arrow(slide, 6.65, 2.38, 0.85, 0, C.teal);
  arrow(slide, 10.25, 2.38, 0.85, 0, C.teal);
  card(slide, 0.75, 1.42, 2.25, 1.9, "下載與驗證", "EC2 從 S3 下載\n比對完整 SHA-256\n掃描 artifact 內容", { badge: "1", accent: C.teal, fill: C.paleTeal });
  card(slide, 3.85, 1.42, 2.8, 1.9, "準備新 release", "/opt/essay-annotator/releases/<sha>\n建立獨立 venv，不覆寫舊版本", { badge: "2", accent: C.teal, fill: C.paleTeal });
  card(slide, 7.5, 1.42, 2.75, 1.9, "原子切換", "current symlink → 新 SHA\nrestart essay-api.service", { badge: "3", accent: C.amber, fill: C.paleAmber });
  card(slide, 11.1, 1.42, 1.55, 1.9, "健康檢查", "127.0.0.1\n/api/ready\n＋公開 HTTPS", { badge: "4", accent: C.green, bodySize: 9.5 });
  slide.addShape(S.line, { x: 11.88, y: 3.45, w: 0, h: 0.95, line: { color: C.line, width: 2 } });
  slide.addShape(S.line, { x: 4.33, y: 4.4, w: 7.55, h: 0, line: { color: C.red, width: 2.5, beginArrowType: "triangle" } });
  label(slide, 7.3, 3.72, 3.7, "健康檢查失敗", C.red, 12);
  card(slide, 2.0, 4.4, 2.35, 1.7, "自動回滾", "current symlink 指回 previous SHA\n重啟服務並再次驗證", { badge: "↶", accent: C.red, fill: C.paleCoral, border: C.red });
  arrow(slide, 4.4, 5.25, 1.05, 0, C.green, 2.5);
  card(slide, 5.5, 4.4, 2.55, 1.7, "網站回復舊版", "Release code 回復\nShared data、secrets 不變", { badge: "✓", accent: C.green, fill: C.paleTeal, border: C.green, bodySize: 10.8 });
  card(slide, 9.15, 4.4, 2.8, 1.7, "仍需人工確認", "首頁、登入、搜尋、Admin\n資料一致性與 deployment summary", { badge: "人", accent: C.navy2, fill: C.white });
  slide.addText("Atomic 的意思：切換一個 symlink，而不是在正在運行的資料夾裡執行 git pull。", { x: 2.2, y: 6.55, w: 8.95, h: 0.3, fontFace: FONT, fontSize: 14, bold: true, color: C.ink, align: "center", margin: 0 });
  footer(slide, 12);
  note(slide, "新版本先在獨立目錄準備完成，才切 current symlink。若 restart 或 readiness 失敗，腳本切回 previous release。資料與 secrets 位於 release 之外，因此回滾程式碼不會自動回滾資料庫；有 schema migration 時必須另外設計。");
}

// 13 — Current state / decision checklist
{
  const slide = pptx.addSlide();
  addHeader(slide, "目前狀態：哪些已寫好，哪些必須先補證據？", "12｜上線前檢查", true);
  slide.addText("程式碼層已具備", { x: 0.85, y: 1.45, w: 2.6, h: 0.4, fontFace: FONT, fontSize: 21, bold: true, color: C.mint, margin: 0 });
  const done = ["CI：frontend / backend / security", "Immutable release + checksum", "OIDC / IAM 最小權限模板", "SSM → EC2 atomic deploy", "Readiness check + rollback"];
  done.forEach((t, i) => {
    slide.addShape(S.ellipse, { x: 0.9, y: 2.1 + i * 0.72, w: 0.34, h: 0.34, fill: { color: C.green }, line: { color: C.green } });
    slide.addText("✓", { x: 0.9, y: 2.12 + i * 0.72, w: 0.34, h: 0.26, fontFace: FONT, fontSize: 10, bold: true, color: C.white, align: "center", margin: 0 });
    slide.addText(t, { x: 1.45, y: 2.07 + i * 0.72, w: 4.65, h: 0.34, fontFace: FONT, fontSize: 14, color: C.white, margin: 0 });
  });
  slide.addShape(S.line, { x: 6.55, y: 1.45, w: 0, h: 4.55, line: { color: "4A5C79", width: 1.3 } });
  slide.addText("外部平台仍需驗證", { x: 7.05, y: 1.45, w: 3.0, h: 0.4, fontFace: FONT, fontSize: 21, bold: true, color: C.coral, margin: 0 });
  const todo = ["GitHub production Required reviewers", "main branch protection 與 required checks", "AWS OIDC trust 已實際安裝且 subject 正確", "指定 S3 / SSM / EC2 的 IAM policy 已套用", "用 main SHA 完成 deploy + rollback drill"];
  todo.forEach((t, i) => {
    slide.addShape(S.ellipse, { x: 7.1, y: 2.1 + i * 0.72, w: 0.34, h: 0.34, fill: { color: C.coral }, line: { color: C.coral } });
    slide.addText("!", { x: 7.1, y: 2.12 + i * 0.72, w: 0.34, h: 0.26, fontFace: FONT, fontSize: 10, bold: true, color: C.white, align: "center", margin: 0 });
    slide.addText(t, { x: 7.65, y: 2.07 + i * 0.72, w: 4.7, h: 0.34, fontFace: FONT, fontSize: 14, color: C.white, margin: 0, fit: "shrink" });
  });
  slide.addShape(S.roundRect, { x: 1.25, y: 6.05, w: 10.85, h: 0.72, rectRadius: 0.05, fill: { color: C.white }, line: { color: C.white } });
  slide.addText("建議下一個決策：正式定義 branch promotion 規則，並完成 production Environment 與 AWS preflight 驗證。", { x: 1.45, y: 6.23, w: 10.45, h: 0.32, fontFace: FONT, fontSize: 13.5, bold: true, color: C.ink, align: "center", margin: 0, fit: "shrink" });
  footer(slide, 13, "Essay Annotator｜目前狀態與下一步");
  note(slide, "這一頁區分『repo 裡已經寫了什麼』和『GitHub/AWS 平台上已經啟用什麼』。目前無法只靠程式碼證明 Environment reviewer、branch protection、AWS trust 和實際部署都完成。應先完成外部設定驗證，再把 production workflow 升到 main。");
}

async function writePresentation() {
  if (process.env.MAX_SLIDES) pptx._slides = pptx._slides.slice(0, Number(process.env.MAX_SLIDES));
  const output = process.env.PPTX_OUTPUT || "docs/Essay_Annotator_Architecture_and_Release_CN.pptx";
  await pptx.writeFile({ fileName: output });
}

writePresentation().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
