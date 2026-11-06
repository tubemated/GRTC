# GRTC — Global Region & Time Controller

A Windows utility for quickly managing Windows time zones, country/region settings, date and time, language preferences, and saved configuration profiles. GRTC includes a desktop application and a lightweight PowerShell command-line tool.

> **Platform:** Windows 10 / Windows 11  
> **Status:** Source-code release; installer/build has not yet been verified on a clean Windows machine.

## Features

- Browse country and time-zone information from the bundled offline data files.
- Apply a Windows time zone or select one by UTC/GMT offset.
- Change Windows home location and regional format.
- Manage language preferences and keyboard layouts.
- View and adjust the system date/time (administrator permission may be required).
- Enable or disable Windows time synchronization and request a clock resync.
- Save configuration profiles, create backups, and review change history.
- Use the PowerShell CLI without installing the desktop application.

The exact operations available depend on the Windows edition, installed language components, permissions, and Windows time-zone database.

## Important: time zone vs. system clock

Changing the **time zone** changes the local time Windows displays for the current system clock. It does not normally change the underlying UTC-based clock. Setting the **date/time manually** is a separate operation. GRTC exposes these as separate controls; use clock synchronization when you want Windows to obtain the correct time from a time server.

## Quick start — command-line version

1. Download or clone this repository.
2. Right-click `RUN_GRTC.bat` and choose **Run as administrator** (or double-click it and approve the Windows UAC prompt).
3. Select a country preset, enter a UTC/GMT offset, or choose another menu action.

You can also run `grtc.cmd`, which launches the same PowerShell CLI.

The CLI uses the Windows PowerShell commands included with Windows. It does not require Node.js.

## Run the desktop application from source

### Requirements

- Windows 10 or Windows 11 (64-bit recommended)
- Node.js 20 or later
- npm (included with Node.js)

### Install and run

```powershell
npm ci
npm run dev
```

### Check and build

```powershell
npm run typecheck
npm run build
```

### Create a Windows installer

```powershell
npx electron-builder --win nsis
```

The installer output is written to the `dist/` directory. Run the build on Windows to produce and test a Windows installer. The repository does not currently include a prebuilt installer.

## Permissions and security

Some Windows settings require administrator privileges and may trigger a User Account Control (UAC) prompt. Review the PowerShell scripts and source code before running the application, especially before granting elevation. Only download release installers from this repository's official **Releases** page.

GRTC is intended to change local Windows configuration. It does not need an online account or a GRTC cloud service. Windows time synchronization itself may contact the time server configured on the computer.

## Project structure

```text
GRTC/
├── data/                  # Bundled country, locale, and time-zone data
├── scripts/               # Project helper scripts
├── src/
│   ├── main/              # Electron main process and Windows services
│   ├── preload/           # Secure renderer bridge
│   ├── renderer/          # React desktop interface
│   └── shared/            # Shared types and constants
├── grtc.ps1               # PowerShell CLI
├── grtc.cmd               # CLI launcher
├── RUN_GRTC.bat           # CLI launcher
└── package.json
```

## Contributing

Issues and pull requests are welcome. Before submitting a change:

1. Explain the Windows setting or workflow being changed.
2. Keep privileged operations explicit and validate all values passed to PowerShell.
3. Test on a supported Windows version, including behavior without administrator privileges where applicable.
4. Include reproduction steps for bug reports.

Please do not include personal information, machine-specific paths, credentials, or private logs in issues.

## License

GRTC is distributed under the MIT License. See [LICENSE](LICENSE).
