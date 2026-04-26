# GitHub Quick Start (Manual Setup)

Use this after creating your GitHub repository online.

## 1. Initialize and Push
1. git init
2. git add .
3. git commit -m "chore: initial scaffold and project planning artifacts"
4. Create repository on GitHub (without README)
5. git remote add origin <YOUR_GITHUB_REPO_URL>
6. git branch -M main
7. git push -u origin main

## 2. Create Labels
Create labels from docs/github-kanban-checklist.md:
- module-1 to module-5
- backend, frontend, integration, documentation
- bug, enhancement

## 3. Create Milestones
Create milestones:
- Week 1 - Foundation
- Week 2 - Backend Core
- Week 3 - Handoff Logic
- Week 4 - Agent Dashboard
- Week 5 - Lead + Polish

## 4. Create GitHub Project Board
1. Open repository on GitHub
2. Go to Projects -> New Project -> Board
3. Name it: AI-Human-Escalation-MVP
4. Add columns:
   - Backlog
   - In Progress
   - Review
   - Done
5. Add custom fields:
   - Module
   - Week
   - Priority

## 5. Import Backlog Tasks
Create issues using docs/github-issue-backlog.md.
Assign:
- Labels
- Milestone
- Assignee

## 6. Daily Workflow
1. Pick task from Backlog
2. Create branch: feature/<module>-<task-name>
3. Push code and open PR
4. Move issue to Review with PR link
5. Merge PR and move card to Done
