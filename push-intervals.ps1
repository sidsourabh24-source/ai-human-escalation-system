# ============================================================
# NEXUSAI — Day 5 Interval Commits (PowerShell Compat Fixed)
# ============================================================

Clear-Host
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "       🤖 NEXUSAI — CORRECTED THREE-PART PUSH SYSTEM 🤖       " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Commit 1: Backend Auth Controller and Router modifications
Write-Host "[Commit 1/3] Staging and committing Backend Auth & Router modifications..." -ForegroundColor Yellow
git add "backend/src/controllers/authController.js"
git add "backend/src/routes/agentRoutes.js"
git commit -m "feat: backend auth controller and agent routing updates"
Write-Host "📡 Pushing Backend Auth changes to GitHub..." -ForegroundColor Cyan
git push
Write-Host "✅ Part 1 complete! Pausing briefly..." -ForegroundColor Green
Start-Sleep -Seconds 10

# 2. Commit 2: Backend Core Logic & Socket integrations
Write-Host ""
Write-Host "[Commit 2/3] Staging and committing Backend Conversation logic and Socket integrations..." -ForegroundColor Yellow
git add "backend/src/services/conversationService.js"
git add "backend/src/sockets/chatSocket.js"
git commit -m "feat: backend chat socket triggers and conversation logic"
Write-Host "🎨 Pushing Backend Logic changes to GitHub..." -ForegroundColor Cyan
git push
Write-Host "✅ Part 2 complete! Pausing briefly..." -ForegroundColor Green
Start-Sleep -Seconds 10

# 3. Commit 3: Frontend Dashboard UI features & Service bindings
Write-Host ""
Write-Host "[Commit 3/3] Staging and committing Frontend Agent Dashboard view and API service bindings..." -ForegroundColor Yellow
git add "frontend/src/features/agent-dashboard/AgentDashboard.jsx"
git add "frontend/src/services/agentApi.js"
git commit -m "feat: frontend agent dashboard view and api communication handlers"
Write-Host "📄 Pushing Frontend UI changes to GitHub..." -ForegroundColor Cyan
git push
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "🎉 SUCCESS: All 3 parts committed and pushed successfully!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
