# Lance le backend (FastAPI, port 8000) et le front (Vite, port 3000) dans deux fenêtres PowerShell.
# Usage : .\dev.ps1
$root = $PSScriptRoot

if (-not (Test-Path "$root\backend\.venv\Scripts\python.exe")) {
  Write-Host "Environnement Python absent : création de backend\.venv ..." -ForegroundColor Yellow
  python -m venv "$root\backend\.venv"
  & "$root\backend\.venv\Scripts\python.exe" -m pip install -q -r "$root\backend\requirements.txt"
}
if (-not (Test-Path "$root\backend\.env")) { Copy-Item "$root\backend\.env.example" "$root\backend\.env" }
if (-not (Test-Path "$root\frontend\node_modules")) {
  Write-Host "Dépendances Node absentes : npm install ..." -ForegroundColor Yellow
  Push-Location "$root\frontend"; npm install; Pop-Location
}
if (-not (Test-Path "$root\frontend\.env")) { Copy-Item "$root\frontend\.env.example" "$root\frontend\.env" }

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; `$env:PYTHONUTF8='1'; .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --reload-dir app --host 127.0.0.1 --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host ""
Write-Host "Backend : http://127.0.0.1:8000/api/docs" -ForegroundColor Green
Write-Host "Front   : http://localhost:3000" -ForegroundColor Green
Write-Host "Démo    : demo@mindflow.app / demo1234" -ForegroundColor Green
