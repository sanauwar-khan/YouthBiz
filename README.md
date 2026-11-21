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

## Admin panel

The admin panel is available at <http://localhost:3000/admin/login>. It has no public registration route. Set the permanent `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env` (use a unique password of at least 16 characters), then run this from the repository root:

```sh
npm run seed:admin --prefix backend
```

The seed command reads `backend/.env`, hashes the password with bcrypt, and synchronizes the configured credentials into one existing Admin record. It reuses an Admin with the configured email; if that email is not present, it updates the oldest existing Admin record in place, or creates the first record if none exists. Repeated or concurrent runs do not create duplicates. It never prints the email or password and does not delete Admin accounts or other data. Keep the same values in `backend/.env` to keep the login credentials stable. For a deployed app, configure the same variables through the backend host's private environment settings and run the command against the production database.

After signing in at `/admin/login`, choose **PRD Management → Create PRD**. Enter the title and project name, then fill in the structured sections. List fields accept one item per line; roles and permissions use `Role: permission one; permission two`. Save as a draft while incomplete, and publish when the overview, problem statement, and features/workflows are ready.

## Structure

- `frontend/`: Next.js App Router, JavaScript, and Tailwind CSS.
- `backend/src/controllers/`, `routes/`, and `middleware/`: Express MVC foundation. Feature models are introduced alongside database-backed features in the next phase.
- Environment files are local-only; keep credentials out of source control.
