$url = "https://github.com/electron/electron/releases/download/v33.4.11/electron-v33.4.11-win32-x64.zip"
$zipPath = "C:\Users\iqu33\.gemini\antigravity\scratch\grtc\electron.zip"
$dest = "C:\Users\iqu33\.gemini\antigravity\scratch\grtc\node_modules\electron\dist"

Write-Host "Downloading Electron binary (~100MB)..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing

Write-Host "Extracting to dist folder..."
Expand-Archive -Path $zipPath -DestinationPath $dest -Force
Remove-Item $zipPath -Force
Write-Host "Success! electron.exe is installed."
