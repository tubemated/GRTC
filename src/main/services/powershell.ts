// ──────────────────────────────────────────────────────────
// PowerShell Service — secure spawn-only execution engine
// ──────────────────────────────────────────────────────────

import { spawn } from 'child_process';

// ─── Error Types ─────────────────────────────────────────

export class PowerShellError extends Error {
  constructor(
    message: string,
    public readonly stderr: string,
    public readonly exitCode: number | null,
  ) {
    super(message);
    this.name = 'PowerShellError';
  }
}

export class PowerShellTimeoutError extends PowerShellError {
  constructor(public readonly timeoutMs: number) {
    super(`PowerShell command timed out after ${timeoutMs}ms`, '', null);
    this.name = 'PowerShellTimeoutError';
  }
}

// ─── Types ───────────────────────────────────────────────

interface ExecuteOptions {
  /** Timeout in milliseconds (default 30 000) */
  timeoutMs?: number;
}

interface ElevatedOptions extends ExecuteOptions {
  /** Whether to wait for the elevated process to complete */
  waitForExit?: boolean;
}

// ─── Constants ───────────────────────────────────────────

const PS_EXE = 'powershell.exe';

const BASE_ARGS: readonly string[] = [
  '-NoProfile',
  '-NonInteractive',
  '-ExecutionPolicy',
  'Bypass',
  '-OutputFormat',
  'Text',
];

const DEFAULT_TIMEOUT_MS = 30_000;

// ─── Public API ──────────────────────────────────────────

/**
 * Execute a PowerShell script block and return its raw stdout.
 *
 * The `scriptBlock` must be a **hardcoded** string — never interpolate
 * user input into it.  Use `args` to pass parameters safely via
 * `-Command` with `$args` / `$input`, or encode them in the script.
 */
export async function execute(
  scriptBlock: string,
  options: ExecuteOptions = {},
): Promise<string> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return new Promise<string>((resolve, reject) => {
    const args = [...BASE_ARGS, '-Command', scriptBlock];
    const proc = spawn(PS_EXE, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      proc.kill('SIGTERM');
      reject(new PowerShellTimeoutError(timeoutMs));
    }, timeoutMs);

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(new PowerShellError(`Failed to spawn PowerShell: ${err.message}`, '', null));
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (killed) return; // already rejected
      if (code !== 0) {
        reject(new PowerShellError(
          `PowerShell exited with code ${code}`,
          stderr.trim(),
          code,
        ));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

/**
 * Execute a PowerShell script block and parse its JSON output.
 */
export async function executeJson<T>(
  scriptBlock: string,
  options: ExecuteOptions = {},
): Promise<T> {
  const raw = await execute(scriptBlock, options);
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new PowerShellError(
      `Failed to parse PowerShell JSON output: ${raw.slice(0, 200)}`,
      '',
      null,
    );
  }
}

/**
 * Execute a PowerShell command with elevation (UAC prompt).
 *
 * Uses `Start-Process -Verb RunAs` internally so the target script
 * runs in an elevated process.  The outer (non-elevated) process
 * waits for the elevated one to finish and relays its exit code
 * via a temp file.
 */
export async function executeElevated(
  scriptBlock: string,
  options: ElevatedOptions = {},
): Promise<string> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const waitForExit = options.waitForExit ?? true;

  // We encode the script as Base64 so it can be passed to the elevated
  // process without quoting issues.
  const encoded = Buffer.from(
    // Wrap in try/catch so we always get output
    `try { ${scriptBlock} } catch { $_ | ConvertTo-Json -Compress | Write-Error; exit 1 }`,
    'utf16le',
  ).toString('base64');

  // The outer wrapper launches an elevated PowerShell, redirects its
  // stdout to a temp file so we can read it back.
  const wrapper = waitForExit
    ? [
        '$outFile = [System.IO.Path]::GetTempFileName()',
        '$errFile = [System.IO.Path]::GetTempFileName()',
        '$psi = New-Object System.Diagnostics.ProcessStartInfo',
        '$psi.FileName = "powershell.exe"',
        `$psi.Arguments = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand ${encoded}"`,
        '$psi.Verb = "RunAs"',
        '$psi.UseShellExecute = $false',
        '$psi.RedirectStandardOutput = $true',
        '$psi.RedirectStandardError = $true',
        '$psi.CreateNoWindow = $true',
        '$proc = [System.Diagnostics.Process]::Start($psi)',
        '$stdout = $proc.StandardOutput.ReadToEnd()',
        '$stderr = $proc.StandardError.ReadToEnd()',
        '$proc.WaitForExit()',
        '[System.IO.File]::WriteAllText($outFile, $stdout)',
        '[System.IO.File]::WriteAllText($errFile, $stderr)',
        '$result = @{ exitCode = $proc.ExitCode; outFile = $outFile; errFile = $errFile }',
        '$result | ConvertTo-Json -Compress',
      ].join('; ')
    : [
        'Start-Process powershell.exe',
        `  -ArgumentList "-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-EncodedCommand","${encoded}"`,
        '  -Verb RunAs',
        '  -WindowStyle Hidden',
        'Write-Output \'{"started":true}\'',
      ].join(' ');

  // Run the outer (non-elevated) shell — it triggers UAC itself
  const raw = await execute(wrapper, { timeoutMs });

  if (!waitForExit) return raw;

  interface ElevatedResult {
    exitCode: number;
    outFile: string;
    errFile: string;
  }

  let result: ElevatedResult;
  try {
    result = JSON.parse(raw);
  } catch {
    throw new PowerShellError('Failed to parse elevated result', raw, null);
  }

  // Read and clean up temp files
  const readAndDelete = `
    $o = [System.IO.File]::ReadAllText('${result.outFile}');
    $e = [System.IO.File]::ReadAllText('${result.errFile}');
    Remove-Item '${result.outFile}' -Force -ErrorAction SilentlyContinue;
    Remove-Item '${result.errFile}' -Force -ErrorAction SilentlyContinue;
    @{ stdout = $o; stderr = $e } | ConvertTo-Json -Compress
  `;

  interface TempOutput {
    stdout: string;
    stderr: string;
  }

  const output = await executeJson<TempOutput>(readAndDelete, { timeoutMs: 5_000 });

  if (result.exitCode !== 0) {
    throw new PowerShellError(
      `Elevated PowerShell exited with code ${result.exitCode}`,
      output.stderr.trim(),
      result.exitCode,
    );
  }

  return output.stdout.trim();
}

/**
 * Execute elevated and parse JSON output.
 */
export async function executeElevatedJson<T>(
  scriptBlock: string,
  options: ElevatedOptions = {},
): Promise<T> {
  const raw = await executeElevated(scriptBlock, options);
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new PowerShellError(
      `Failed to parse elevated JSON output: ${raw.slice(0, 200)}`,
      '',
      null,
    );
  }
}

/**
 * Check whether the current process is running elevated (admin).
 */
export async function isRunningAsAdmin(): Promise<boolean> {
  const script =
    '([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator) | ConvertTo-Json';
  return executeJson<boolean>(script, { timeoutMs: 5_000 });
}

// Aliases for compatibility
export const executeCommand = executeJson;
export const isElevated = isRunningAsAdmin;

