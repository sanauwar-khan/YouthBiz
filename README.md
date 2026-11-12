# YouthBiz

Youth Financial Literacy & Entrepreneurship Club.

## Phase 1 setup

Requirements: Node.js 20.9 or newer and npm.

1. Install the root runner: `npm install`.
2. Install the frontend dependencies: `npm install --prefix frontend`.
3. Install the API dependencies: `npm install --prefix backend`.
4. Copy `backend/.env.example` to `backend/.env`. Leave `MONGODB_URI` blank to run the API without a database, or add your private Atlas URI before starting it.
5. Copy `frontend/.env.example` to `frontend/.env.local`.
6. Start both applications from the root with `npm run dev`.

The website runs at <http://localhost:3000>. The API health check is at <http://localhost:4000/api/health>. To run only one application, use `npm run dev:web` or `npm run dev:api` from the root.

## Structure

- `frontend/`: Next.js App Router, JavaScript, and Tailwind CSS.
- `backend/src/controllers/`, `routes/`, and `middleware/`: Express MVC foundation. Feature models are introduced alongside database-backed features in the next phase.
- Environment files are local-only; keep credentials out of source control.