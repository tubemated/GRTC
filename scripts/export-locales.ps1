# Export locales and countries using .NET CultureInfo and RegionInfo
$cultures = [System.Globalization.CultureInfo]::GetCultures([System.Globalization.CultureTypes]::SpecificCultures)

$locales = @()
$countryMap = @{}
$countryTz = @{}

# Map of major countries to primary Windows timezone IDs
$primaryTzMap = @{
    "US" = @("Eastern Standard Time", "Central Standard Time", "Mountain Standard Time", "Pacific Standard Time", "Alaskan Standard Time", "Hawaiian Standard Time")
    "CA" = @("Eastern Standard Time", "Central Standard Time", "Mountain Standard Time", "Pacific Standard Time", "Atlantic Standard Time", "Newfoundland Standard Time")
    "GB" = @("GMT Standard Time")
    "FR" = @("Romance Standard Time")
    "DE" = @("W. Europe Standard Time")
    "IT" = @("W. Europe Standard Time")
    "ES" = @("Romance Standard Time")
    "NL" = @("W. Europe Standard Time")
    "BE" = @("Romance Standard Time")
    "CH" = @("W. Europe Standard Time")
    "AT" = @("W. Europe Standard Time")
    "SE" = @("W. Europe Standard Time")
    "NO" = @("W. Europe Standard Time")
    "DK" = @("Romance Standard Time")
    "FI" = @("FLE Standard Time")
    "PL" = @("Central European Standard Time")
    "UA" = @("FLE Standard Time")
    "RU" = @("Russian Standard Time", "Ekaterinburg Standard Time", "Omsk Standard Time", "Krasnoyarsk Standard Time", "Irkutsk Standard Time", "Yakutsk Standard Time", "Vladivostok Standard Time", "Magadan Standard Time")
    "JP" = @("Tokyo Standard Time")
    "CN" = @("China Standard Time")
    "IN" = @("India Standard Time")
    "KR" = @("Korea Standard Time")
    "AU" = @("AUS Eastern Standard Time", "Cen. Australia Standard Time", "W. Australia Standard Time")
    "NZ" = @("New Zealand Standard Time")
    "BR" = @("E. South America Standard Time")
    "MX" = @("Central Standard Time (Mexico)")
    "AR" = @("Argentina Standard Time")
    "CL" = @("Pacific SA Standard Time")
    "ZA" = @("South Africa Standard Time")
    "EG" = @("Egypt Standard Time")
    "NG" = @("W. Central Africa Standard Time")
    "SA" = @("Arab Standard Time")
    "AE" = @("Arabian Standard Time")
    "IL" = @("Israel Standard Time")
    "TR" = @("Turkey Standard Time")
    "SG" = @("Singapore Standard Time")
    "TH" = @("SE Asia Standard Time")
    "MY" = @("Singapore Standard Time")
    "ID" = @("SE Asia Standard Time")
    "VN" = @("SE Asia Standard Time")
    "PH" = @("Singapore Standard Time")
    "IE" = @("GMT Standard Time")
    "PT" = @("GMT Standard Time")
    "GR" = @("GTB Standard Time")
}

# Windows GeoID mapping for top countries
$geoIdMap = @{
    "US" = 244; "GB" = 242; "CA" = 39; "AU" = 12; "DE" = 94; "FR" = 84; "JP" = 122; "CN" = 45; "IN" = 113; "BR" = 32
    "MX" = 166; "KR" = 134; "IT" = 118; "ES" = 217; "RU" = 203; "NL" = 176; "SE" = 221; "NO" = 177; "DK" = 61; "FI" = 77
    "PL" = 191; "CH" = 223; "AT" = 14; "BE" = 21; "PT" = 193; "IE" = 68; "NZ" = 183; "SG" = 215; "HK" = 104; "TW" = 237
    "TH" = 227; "MY" = 167; "PH" = 201; "ID" = 111; "VN" = 251; "EG" = 67; "ZA" = 209; "AE" = 224; "SA" = 205; "IL" = 117
    "TR" = 235; "NG" = 175; "KE" = 129; "GH" = 89; "AR" = 11; "CO" = 51; "CL" = 46; "PE" = 187; "CZ" = 75; "HU" = 109
    "RO" = 200; "GR" = 98; "UA" = 241; "PK" = 190; "BD" = 23; "DZ" = 6; "MA" = 161
}

$countryTimezonesList = @()

foreach ($c in $cultures) {
    try {
        $reg = New-Object System.Globalization.RegionInfo($c.Name)
        $iso2 = $reg.TwoLetterISORegionName.ToUpper()
        
        $locales += [PSCustomObject]@{
            cultureId = $c.Name
            displayName = $c.DisplayName
            languageTag = $c.IetfLanguageTag
            countryIso2 = $iso2
        }

        if (-not $countryMap.ContainsKey($iso2)) {
            $geoId = 0
            if ($geoIdMap.ContainsKey($iso2)) {
                $geoId = $geoIdMap[$iso2]
            } else {
                $geoId = $reg.GeoId
            }

            $countryMap[$iso2] = [PSCustomObject]@{
                iso2 = $iso2
                iso3 = $reg.ThreeLetterISORegionName.ToUpper()
                name = $reg.EnglishName
                geoId = [int]$geoId
                defaultCultureId = $c.Name
            }
        }
    } catch {
        # Some cultures do not have a corresponding RegionInfo
    }
}

$countriesList = $countryMap.Values | Sort-Object -Property name

# Generate country_timezones
foreach ($iso in $countryMap.Keys) {
    if ($primaryTzMap.ContainsKey($iso)) {
        foreach ($tzId in $primaryTzMap[$iso]) {
            $countryTimezonesList += [PSCustomObject]@{
                countryIso2 = $iso
                timezoneId = $tzId
            }
        }
    } else {
        # Fallback to UTC
        $countryTimezonesList += [PSCustomObject]@{
            countryIso2 = $iso
            timezoneId = "UTC"
        }
    }
}

[System.IO.File]::WriteAllText('C:\Users\iqu33\.gemini\antigravity\scratch\grtc\data\countries.json', ($countriesList | ConvertTo-Json -Depth 3), [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText('C:\Users\iqu33\.gemini\antigravity\scratch\grtc\data\locales.json', ($locales | ConvertTo-Json -Depth 3), [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText('C:\Users\iqu33\.gemini\antigravity\scratch\grtc\data\country_timezones.json', ($countryTimezonesList | ConvertTo-Json -Depth 3), [System.Text.Encoding]::UTF8)

Write-Output "Wrote $($countriesList.Count) countries, $($locales.Count) locales, $($countryTimezonesList.Count) country-timezone mappings"
