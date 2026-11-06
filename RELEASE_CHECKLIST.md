# First public release checklist

- [ ] Replace the placeholder MIT copyright holder in `LICENSE` and `LICENSE.txt` if you want the license to name an individual or organization.
- [ ] Review every PowerShell operation and test it on a clean Windows 10/11 machine.
- [ ] Run `npm ci` and `npm run typecheck` on Windows.
- [ ] Run `npm run dev` and test the desktop workflows.
- [ ] Build the installer with `npm run build:win`.
- [ ] Install and uninstall the generated installer; verify shortcuts and app data behavior.
- [ ] Test UAC prompts and non-administrator behavior.
- [ ] Add screenshots to the README.
- [ ] Create a GitHub Release with the tested installer and release notes.
- [ ] Consider code signing the installer before recommending it broadly.
