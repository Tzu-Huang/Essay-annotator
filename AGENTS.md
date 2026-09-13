# Required project context

- Before doing any work related to this repository, read `docs/current-architecture-and-database-workflow.md` completely.
- Treat that document as the project source of truth for the Local, AWS Production, Supabase, RDS, API routing, Admin Console, and database-change workflow.
- If a task changes any architecture or database fact documented there, update the document as part of the same task.

# Local development

- Do not start the frontend development server automatically.
- Run `npm run dev` in `frontend/` only when the user explicitly asks to start it.
