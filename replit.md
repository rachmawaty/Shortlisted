# Shortlist - Job Tracker AI Agent

## Overview
Shortlist is a brutally honest AI-powered job tracker that helps job seekers manage, evaluate, and track job applications. It uses OpenAI to parse resumes and evaluate job descriptions against the candidate's profile.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + Shadcn UI + wouter routing
- **Backend**: Express.js + Drizzle ORM + PostgreSQL + multer (file uploads) + pdf-parse
- **AI**: OpenAI via Replit AI Integrations (gpt-5-mini for parsing/evaluation)
- **Auth**: Replit Auth (OIDC) - supports Google, GitHub, Apple, email/password

## Key Features
- PDF resume upload with drag-and-drop (parsed by AI)
- Job description evaluation with brutally honest hiring manager assessment
- Job location extraction from postings
- Visa/work authorization detection (CPT/OPT/STEM OPT, sponsorship status)
- Job URL tracking (link to original posting)
- Personal notes/comments per job
- Master tracking table with status management and delete functionality
- Follow-up alerts for applications > 14 days old
- Dark/light mode toggle
- User authentication (Google, GitHub, Apple, email/password)
- Per-user data isolation (userId on resumes and jobs)

## Data Models
- `users` - Auth users (managed by Replit Auth)
- `sessions` - Auth sessions (managed by Replit Auth)
- `resumes` - Stores parsed resume data per user (userId scoped)
- `jobs` - Stores job applications with AI evaluations per user (userId scoped)

## Project Structure
```
client/src/
  App.tsx - Main app with auth-gated routing
  pages/
    landing.tsx - Landing page for unauthenticated users
    dashboard.tsx - Master tracking table + stats
    resume.tsx - PDF drag-and-drop upload/view
    add-job.tsx - Job description submission
    job-detail.tsx - Full job evaluation view
  components/
    app-sidebar.tsx - Navigation sidebar with user info
    theme-toggle.tsx - Dark/light mode toggle
  hooks/
    use-auth.ts - Auth state hook
  lib/
    theme.tsx - Theme provider
    auth-utils.ts - Auth error handling

server/
  index.ts - Express server entry
  routes.ts - API endpoints (all protected with isAuthenticated)
  storage.ts - Database CRUD operations (userId scoped)
  openai.ts - Resume parsing + job evaluation
  db.ts - Database connection
  replit_integrations/auth/ - Replit Auth module (do not modify)

shared/
  schema.ts - Drizzle schema definitions
  models/auth.ts - Auth schema (users, sessions)
```

## API Endpoints
- `GET /api/resume` - Get stored resume (auth required)
- `POST /api/resume` - Upload PDF and parse resume (multipart/form-data, auth required)
- `GET /api/jobs` - List all tracked jobs (auth required)
- `GET /api/jobs/:id` - Get single job (auth required)
- `POST /api/jobs/evaluate` - Evaluate job description against resume (auth required)
- `PATCH /api/jobs/:id` - Update job status (auth required)
- `DELETE /api/jobs/:id` - Delete job (auth required)
- `GET /api/auth/user` - Get current authenticated user
- `/api/login` - Start login flow
- `/api/logout` - Logout
