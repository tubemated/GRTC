$desktop = [Environment]::GetFolderPath('Desktop')
$projectDir = Split-Path -Parent $PSScriptRoot
$targetBat = Join-Path $projectDir 'RUN_GRTC.bat'
if (-not (Test-Path $targetBat)) {
	throw "GRTC launcher not found: $targetBat"
}
$shortcutPath = [System.IO.Path]::Combine($desktop, 'GRTC Controller.lnk')
$wsh = New-Object -ComObject WScript.Shell
$sc = $wsh.CreateShortcut($shortcutPath)
$sc.TargetPath = $targetBat
$sc.WorkingDirectory = $projectDir
$sc.Description = 'Global Region & Time Controller'
$sc.Save()
Write-Host "Created shortcut: $shortcutPath"
