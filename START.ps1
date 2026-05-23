# Buffalo Meatliz - Start Local Dev
# Double-click or run from PowerShell

$root = "C:\Users\Test\Documents\Claude\Projects\Buffalo Meat - Site"

# Open backend window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; python -m uvicorn main:app --reload --port 8000"

Start-Sleep -Seconds 2

# Open frontend window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host "Starting..." -ForegroundColor Green
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Admin:    http://localhost:5173/admin" -ForegroundColor Yellow
