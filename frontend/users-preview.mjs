import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";

// Render the real UI components with fictional records; no server or database.
const result = await build({
  stdin: { contents: `
    import React from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import { UsersView } from './src/pages/admin/UsersTab.jsx';
    import Sidebar from './src/pages/admin/AdminSidebar.jsx';
    import { Activity, BookOpen, Users, BarChart3, Cloud, ClipboardList } from 'lucide-react';
    const items = [
      ['demo-1', 'Alex Chen', 'alex@example.com', 24],
      ['demo-2', 'Jamie Lin', 'jamie@example.com', 12],
      ['demo-3', 'Taylor Wang', 'taylor@example.com', 8],
      ['demo-4', 'Morgan Lee', 'morgan@example.com', 3],
    ].map(([id, name, email, login_count], i) => ({id, name, email, login_count,
      created_at: '2026-09-12T10:00:00', last_login: '2026-10-' + (27-i) + 'T09:30:00'}));
    export const html = renderToStaticMarkup(<main className="admin-shell">
      <Sidebar navItems={[["overview","Overview",Activity],["essays","Essays",BookOpen],["users","Users",Users],["usage","Usage",BarChart3],["logs","Logs",Cloud],["audit","Audit",ClipboardList]]} activeTab="users" apiBase="/api" />
      <section className="admin-main">
        <header className="admin-topbar"><div><p className="admin-kicker">Developer Operations</p><h1>Users</h1></div></header>
        <div className="admin-message">UI preview · Fictional sample data · Not connected to RDS</div>
        <UsersView data={{items, total:4, page:1, page_size:15}} search="" />
      </section>
    </main>);
  `, resolveDir: process.cwd(), loader: "jsx" },
  bundle: true, platform: "node", format: "esm", packages: "external", jsx: "automatic", write: false,
});
await writeFile(".users-preview-render.mjs", result.outputFiles[0].text);
const { html } = await import("./.users-preview-render.mjs");
const css = (await readFile("src/styles/admin.css", "utf8")).replace(/^@import[^\r\n]+/m, "");
await mkdir("../docs/previews", { recursive: true });
await writeFile("../docs/previews/admin-users.html", `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin Users — Sample preview</title><style>*{box-sizing:border-box}body{margin:0}${css}</style>${html}</html>`);
const { unlink } = await import("node:fs/promises");
await unlink(".users-preview-render.mjs");
