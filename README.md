# FocusPulse — Personal Productivity Coach

A personal productivity dashboard for planning tasks, focusing with timed work sessions, and reviewing progress. Built with React and TypeScript using TanStack Start and Supabase.

## Features
- Task creation with due dates, urgency, effort, status and tags.
- Task search and filtering, Kanban-style workflow, subtasks and dependencies.
- AI-assisted task ordering with short reasoning for suggested priorities (optional API key).
- Pomodoro focus/break timer, focus sessions, streaks, badges and productivity insights.
- Analytics and CSV/PDF-style report exports.
- Supabase authentication and per-user task/session data with Row Level Security policies.

## Stack
React · TypeScript · TanStack Start/Router · Vite · Tailwind CSS · Supabase · Recharts

## Local setup
Requirements: Node.js/npm and a Supabase project.

1. Clone and install:
   ```bash
   git clone https://github.com/Ezra2121-et/pulse-priority-coach.git
   cd pulse-priority-coach
   npm install
   ```
2. Copy `.env.example` to `.env` and add the Supabase project URL and publishable key. Apply the SQL files in `supabase/migrations/` to your Supabase database in filename order.
3. To enable AI task suggestions, configure `LOVABLE_API_KEY` on the server. Keep the key private.
4. Start locally:
   ```bash
   npm run dev
   ```

Use `npm run lint` and `npm run build` to check the project. The repository config includes Cloudflare support; a production deployment also needs the correct Supabase environment and database configuration.

## Security notes
Do not put a Supabase service-role key in a `VITE_` variable or browser code. Review Supabase Row Level Security and auth settings before a public deployment. AI suggestions are optional guidance, not a substitute for your own judgement.

## License
MIT. See [LICENSE](LICENSE). Dependencies and external services retain their own terms.
