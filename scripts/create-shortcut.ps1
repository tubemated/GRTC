$desktop = [Environment]::GetFolderPath('Desktop')
$targetBat = 'C:\Users\iqu33\.gemini\antigravity\scratch\grtc\RUN_GRTC.bat'
$shortcutPath = [System.IO.Path]::Combine($desktop, 'GRTC Controller.lnk')
$wsh = New-Object -ComObject WScript.Shell
$sc = $wsh.CreateShortcut($shortcutPath)
$sc.TargetPath = $targetBat
$sc.WorkingDirectory = 'C:\Users\iqu33\.gemini\antigravity\scratch\grtc'
$sc.Description = 'Global Region & Time Controller'
$sc.Save()
Write-Host "Created shortcut: $shortcutPath"
