# abrir-smartcore.ps1 — recebe ramal://NUMERO, copia e cola no SmartCORE
param([string]$uri)

# Extrai só os dígitos
$num = $uri -replace '[^\d]', ''
if (-not $num) { exit 1 }

# Copia para área de transferência
Set-Clipboard -Value $num

# Caminho do SmartCORE
$smartcoreExe = "$env:LOCALAPPDATA\br.com.sigmatelecom.winx\SmartCORE 4.exe"

# Tenta encontrar o processo
$proc = Get-Process -Name 'SmartCORE*' -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $proc) {
  # Não está rodando: lança
  if (Test-Path $smartcoreExe) {
    Start-Process -FilePath $smartcoreExe
    Start-Sleep -Seconds 3
    $proc = Get-Process -Name 'SmartCORE*' -ErrorAction SilentlyContinue | Select-Object -First 1
  }
}

# Traz o SmartCORE para frente
if ($proc) {
  $hwnd = $proc.MainWindowHandle
  if ($hwnd -ne [IntPtr]::Zero) {
    Add-Type -Name Win32 -Namespace User32 -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
[DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
'@
    if ([User32.Win32]::IsIconic($hwnd)) {
      [User32.Win32]::ShowWindow($hwnd, 9)
    }
    [User32.Win32]::SetForegroundWindow($hwnd)
    Start-Sleep -Milliseconds 400
  }
}

# Cola via WScript.Shell (funciona com janela oculta)
$wshell = New-Object -ComObject WScript.Shell
$wshell.SendKeys('^v')
