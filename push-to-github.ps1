# Buffalo Meatliz - Push to GitHub
# Run from PowerShell in the project folder

$TOKEN = "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"
$REMOTE = "https://$TOKEN@github.com/BeashBash/buffalo-meatliz.git"

Write-Host "Setting up git..." -ForegroundColor Cyan

if (Test-Path ".git") {
    Remove-Item -Recurse -Force ".git"
    Write-Host "Removed old .git folder" -ForegroundColor Yellow
}

git init -b main
git config user.email "26almog@gmail.com"
git config user.name "almog"

git add -A
git commit -m "v1.0 - Buffalo Meatliz full e-commerce system"

git remote add origin $REMOTE
git push -u origin main --force

Write-Host ""
Write-Host "Done! View at: https://github.com/BeashBash/buffalo-meatliz" -ForegroundColor Green
