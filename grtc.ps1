<#
.SYNOPSIS
    GRTC-CLI: Global Region & Time Controller (Command Line Edition)
.DESCRIPTION
    100% offline, standalone CLI script.
    Maintains English formats (en-US / en-GB) for dates and system text while updating
    the active Time Zone and Home Location according to the selected country or UTC offset.
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Check Administrator status
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

# Countries with English date/time format preserved (en-US / en-GB)
$presets = @(
    @{
        Number       = "1"
        Country      = "Bangladesh (BD - Dhaka UTC+6)"
        GeoId        = 23
        Culture      = "en-US"
        TimeZoneId   = "Bangladesh Standard Time"
    },
    @{
        Number       = "2"
        Country      = "United States (US - Eastern UTC-5)"
        GeoId        = 244
        Culture      = "en-US"
        TimeZoneId   = "Eastern Standard Time"
    },
    @{
        Number       = "3"
        Country      = "United States (US - Pacific UTC-8)"
        GeoId        = 244
        Culture      = "en-US"
        TimeZoneId   = "Pacific Standard Time"
    },
    @{
        Number       = "4"
        Country      = "United Kingdom (UK - London UTC+0)"
        GeoId        = 242
        Culture      = "en-GB"
        TimeZoneId   = "GMT Standard Time"
    },
    @{
        Number       = "5"
        Country      = "China (CN - Beijing UTC+8)"
        GeoId        = 45
        Culture      = "en-US"
        TimeZoneId   = "China Standard Time"
    },
    @{
        Number       = "6"
        Country      = "Russia (RU - Moscow UTC+3)"
        GeoId        = 203
        Culture      = "en-US"
        TimeZoneId   = "Russian Standard Time"
    },
    @{
        Number       = "7"
        Country      = "India (IN - New Delhi UTC+5:30)"
        GeoId        = 113
        Culture      = "en-US"
        TimeZoneId   = "India Standard Time"
    },
    @{
        Number       = "8"
        Country      = "Germany (DE - Berlin UTC+1)"
        GeoId        = 94
        Culture      = "en-US"
        TimeZoneId   = "W. Europe Standard Time"
    },
    @{
        Number       = "9"
        Country      = "Japan (JP - Tokyo UTC+9)"
        GeoId        = 122
        Culture      = "en-US"
        TimeZoneId   = "Tokyo Standard Time"
    },
    @{
        Number       = "10"
        Country      = "Canada (CA - Toronto UTC-5)"
        GeoId        = 39
        Culture      = "en-CA"
        TimeZoneId   = "Eastern Standard Time"
    },
    @{
        Number       = "11"
        Country      = "Australia (AU - Sydney UTC+10)"
        GeoId        = 12
        Culture      = "en-AU"
        TimeZoneId   = "AUS Eastern Standard Time"
    },
    @{
        Number       = "12"
        Country      = "United Arab Emirates (AE - Dubai UTC+4)"
        GeoId        = 224
        Culture      = "en-US"
        TimeZoneId   = "Arabian Standard Time"
    }
)

function Show-Header {
    Clear-Host
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "       GLOBAL REGION & TIME CONTROLLER (GRTC CLI)         " -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Cyan
    
    $curCulture = (Get-Culture).Name
    $curGeo = (Get-WinHomeLocation).HomeLocation
    $curTz = (Get-TimeZone)
    $curTime = (Get-Date).ToString("yyyy-MM-dd hh:mm:ss tt")
    $offsetStr = if ($curTz.BaseUtcOffset.TotalMinutes -ge 0) {
        "+$($curTz.BaseUtcOffset.Hours):$($curTz.BaseUtcOffset.Minutes.ToString('00'))"
    } else {
        "$($curTz.BaseUtcOffset.Hours):$([Math]::Abs($curTz.BaseUtcOffset.Minutes).ToString('00'))"
    }

    Write-Host "CURRENT ACTIVE WINDOWS SETTINGS:" -ForegroundColor Yellow
    Write-Host "  • Regional Format (Language): $curCulture (English numbers/dates)"
    Write-Host "  • Home Location (Country)   : $curGeo"
    Write-Host "  • Time Zone                 : $($curTz.Id) (UTC $offsetStr)"
    Write-Host "  • System Clock              : $curTime"
    Write-Host "  • Admin Session             : $(if ($isAdmin) {'Elevated (No extra UAC prompts)'} else {'Standard'})" -ForegroundColor $(if ($isAdmin) {'Green'} else {'DarkYellow'})
    Write-Host "----------------------------------------------------------" -ForegroundColor Gray
}

function Show-Menu {
    Write-Host "QUICK COUNTRY PRESETS (Keeps English Dates & Clock):" -ForegroundColor Green
    foreach ($p in $presets) {
        $num = $p.Number.PadLeft(2)
        Write-Host "  [$num] $($p.Country)" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "CUSTOM TIME ZONE & UTC OFFSET:" -ForegroundColor Green
    Write-Host "  [ O] Set Time Zone by UTC/GMT Offset (e.g. +6, -6, +5, +5.30, +5:30, -5)" -ForegroundColor Yellow
    Write-Host "  [ C] Custom Time Zone by Name (e.g. UTC, Bangladesh Standard Time)" -ForegroundColor Cyan
    Write-Host "  [ E] Reset Format back to pure US English (en-US)" -ForegroundColor DarkCyan
    Write-Host "  [ S] Resync System Clock (NTP via w32tm)" -ForegroundColor Cyan
    Write-Host "  [ Q] Exit" -ForegroundColor Red
    Write-Host "----------------------------------------------------------" -ForegroundColor Gray
}

function Set-SystemTimeZone($tzId) {
    try {
        if ($isAdmin) {
            Set-TimeZone -Id $tzId
            Write-Host "  [OK] Time Zone successfully changed to: $tzId" -ForegroundColor Green
        } else {
            Start-Process powershell -Verb RunAs -Wait -ArgumentList "-NoProfile -Command Set-TimeZone -Id '$tzId'"
            Write-Host "  [OK] Time Zone updated." -ForegroundColor Green
        }
    } catch {
        Write-Host "  [ERROR] Could not set time zone: $_" -ForegroundColor Red
    }
}

function Apply-Preset($p) {
    Write-Host "`nApplying configuration for $($p.Country)..." -ForegroundColor Yellow

    # 1. Maintain English (en-US) so numbers and month names stay in English
    try {
        Set-Culture -CultureInfo $p.Culture
        Write-Host "  [OK] Regional format maintained in English ($($p.Culture))" -ForegroundColor Green
    } catch {
        Write-Host "  [ERROR] Regional format: $_" -ForegroundColor Red
    }

    # 2. Home Location
    try {
        Set-WinHomeLocation -GeoId $p.GeoId
        Write-Host "  [OK] Location set to country GeoID $($p.GeoId)" -ForegroundColor Green
    } catch {
        Write-Host "  [ERROR] Home Location: $_" -ForegroundColor Red
    }

    # 3. Time Zone
    Set-SystemTimeZone $p.TimeZoneId

    Write-Host "`nSettings applied! Press any key to continue..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Handle-OffsetSelection {
    Write-Host "`n--- SET TIME ZONE BY OFFSET ---" -ForegroundColor Yellow
    Write-Host "Examples: +6, -6, +5, +5.30, +5:30, -5, +8, +3, 0" -ForegroundColor DarkGray
    $inputOffset = (Read-Host "Enter UTC/GMT Offset").Trim().Replace("UTC", "").Replace("GMT", "").Trim()

    if (-not $inputOffset) { return }

    $targetMinutes = 0
    if ($inputOffset -match "^([+-]?\d{1,2})(?::|\.)(\d{1,2})$") {
        $hrs = [int]$matches[1]
        $mins = [int]$matches[2]
        if ($hrs -lt 0) { $mins = -$mins }
        $targetMinutes = ($hrs * 60) + $mins
    } elseif ($inputOffset -match "^([+-]?\d{1,2})$") {
        $targetMinutes = ([int]$matches[1]) * 60
    } else {
        Write-Host "Invalid offset. Examples: +6, -6, +5.30, +5:30, -8" -ForegroundColor Red
        Start-Sleep -Seconds 2
        return
    }

    $allTz = Get-TimeZone -ListAvailable
    $matchedTzs = @()
    foreach ($tz in $allTz) {
        if ([int]$tz.BaseUtcOffset.TotalMinutes -eq $targetMinutes) {
            $matchedTzs += $tz
        }
    }

    if ($matchedTzs.Count -eq 0) {
        Write-Host "No Windows time zone found with offset of $inputOffset" -ForegroundColor Red
        Start-Sleep -Seconds 2
        return
    }

    Write-Host "`nMatching time zone(s):" -ForegroundColor Green
    for ($i = 0; $i -lt $matchedTzs.Count; $i++) {
        Write-Host "  [$($i+1)] $($matchedTzs[$i].Id) - $($matchedTzs[$i].DisplayName)"
    }

    if ($matchedTzs.Count -eq 1) {
        $chosen = $matchedTzs[0]
    } else {
        $idxStr = Read-Host "`nSelect a number (default 1)"
        $idx = 1
        if ($idxStr -match "^\d+$") { $idx = [int]$idxStr }
        if ($idx -lt 1 -or $idx -gt $matchedTzs.Count) { $idx = 1 }
        $chosen = $matchedTzs[$idx - 1]
    }

    Set-SystemTimeZone $chosen.Id
    Write-Host "`nPress any key to continue..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Main Application Loop
do {
    Show-Header
    Show-Menu
    $choice = (Read-Host "Enter your choice").Trim().ToUpper()

    if ($choice -eq "Q") {
        Write-Host "`nExiting GRTC CLI. Goodbye!" -ForegroundColor Gray
        break
    } elseif ($choice -eq "O") {
        Handle-OffsetSelection
    } elseif ($choice -eq "E") {
        Set-Culture -CultureInfo "en-US"
        Write-Host "Format reset to en-US. Press any key..." -ForegroundColor Cyan
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    } elseif ($choice -eq "S") {
        Write-Host "`nResyncing Windows clock via w32tm..." -ForegroundColor Yellow
        if ($isAdmin) {
            w32tm /resync /nowait
        } else {
            Start-Process powershell -Verb RunAs -Wait -ArgumentList "-NoProfile -Command w32tm /resync /nowait"
        }
        Write-Host "Clock sync command issued. Press any key..." -ForegroundColor Cyan
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    } elseif ($choice -eq "C") {
        $customTz = Read-Host "`nEnter exact Windows TimeZone ID (e.g. UTC, Bangladesh Standard Time)"
        if ($customTz) {
            Set-SystemTimeZone $customTz
            Write-Host "Press any key to continue..." -ForegroundColor Cyan
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
    } else {
        $selected = $presets | Where-Object { $_.Number -eq $choice }
        if ($selected) {
            Apply-Preset $selected
        } else {
            Write-Host "Invalid selection. Press any key to try again..." -ForegroundColor Red
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
    }
} while ($true)
