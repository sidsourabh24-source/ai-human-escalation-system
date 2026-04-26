# GitHub Kanban Setup

## Board Columns
- Backlog
- In Progress
- Review
- Done

## Labels
- module-1
- module-2
- module-3
- module-4
- module-5
- backend
- frontend
- integration
- documentation
- bug
- enhancement

## Milestones
- Week 1 - Foundation
- Week 2 - Backend Core
- Week 3 - Handoff Logic
- Week 4 - Agent Dashboard
- Week 5 - Lead + Polish

## Branching Strategy
- main: stable
- develop: integration branch (optional for team)
- feature/<module>-<short-name>: implementation branches
- fix/<area>-<short-name>: bugfix branches

## Pull Request Rules
- One issue per PR where possible
- Clear PR description: objective, changes, test evidence
- At least one teammate review before merge
- Squash and merge for clean history
