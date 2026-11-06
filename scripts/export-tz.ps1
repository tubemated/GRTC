$raw = Get-TimeZone -ListAvailable
$tzList = @()
foreach ($tz in $raw) {
    $tzList += [PSCustomObject]@{
        windowsId = $tz.Id
        ianaId = ''
        displayName = $tz.DisplayName
        utcOffsetMinutes = [int]$tz.BaseUtcOffset.TotalMinutes
    }
}
$json = $tzList | ConvertTo-Json -Depth 3
[System.IO.File]::WriteAllText('C:\Users\iqu33\.gemini\antigravity\scratch\grtc\data\timezones.json', $json, [System.Text.Encoding]::UTF8)
Write-Output "Wrote $($tzList.Count) timezones"
