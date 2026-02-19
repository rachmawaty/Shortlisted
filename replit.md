# Shortlist - Job Tracker AI Agent

## Overview
Shortlist is a brutally honest AI-powered job tracker that helps job seekers manage, evaluate, and track job applications. It uses OpenAI to parse resumes and evaluate job descriptions against the candidate's profile.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + Shadcn UI + wouter routing
- **Backend**: Express.js + Drizzle ORM + PostgreSQL
- **AI**: OpenAI via Replit AI Integrations (gpt-5-mini for parsing/evaluation)

## Key Features
- Resume upload and AI parsing (skills, experience, seniority, industries, tools)
- Job description evaluation with brutally honest hiring manager assessment
- Master tracking table with status management
- Follow-up alerts for applications > 14 days old
- Dark/light mode toggle

## Data Models
- `resumes` - Stores parsed resume data (single source of truth)
- `jobs` - Stores job applications with AI evaluations and status tracking

## Project Structure
```
client/src/
  App.tsx - Main app with sidebar and routing
  pages/
    dashboard.tsx - Master tracking table + stats
    resume.tsx - Resume upload/view
    add-job.tsx - Job description submission
    job-detail.tsx - Full job evaluation view
  components/
    app-sidebar.tsx - Navigation sidebar
    theme-toggle.tsx - Dark/light mode toggle
  lib/
    theme.tsx - Theme provider

server/
  index.ts - Express server entry
  routes.ts - API endpoints
  storage.ts - Database CRUD operations
  openai.ts - Resume parsing + job evaluation
  db.ts - Database connection

shared/
  schema.ts - Drizzle schema definitions
```

## API Endpoints
- `GET /api/resume` - Get stored resume
- `POST /api/resume` - Upload and parse resume
- `GET /api/jobs` - List all tracked jobs
- `GET /api/jobs/:id` - Get single job
- `POST /api/jobs/evaluate` - Evaluate job description against resume
- `PATCH /api/jobs/:id` - Update job status
- `DELETE /api/jobs/:id` - Delete job
