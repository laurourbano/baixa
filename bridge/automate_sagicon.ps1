param (
    [string]$local,
    [string]$sit,
    [string]$julgamento,
    [string]$isPendencia
)

# Função para remover acentos
function Remove-Acentos {
    param([string]$string)
    if ([string]::IsNullOrWhiteSpace($string)) { return "" }
    $normalized = $string.Normalize([System.Text.NormalizationForm]::FormD)
    $sb = New-Object System.Text.StringBuilder
    foreach ($c in $normalized.ToCharArray()) {
        if ([System.Globalization.CharUnicodeInfo]::GetUnicodeCategory($c) -ne [System.Globalization.UnicodeCategory]::NonSpacingMark) {
            [void]$sb.Append($c)
        }
    }
    return $sb.ToString()
}

$local = Remove-Acentos $local
$sit = Remove-Acentos $sit
$julgamento = Remove-Acentos $julgamento

Add-Type -AssemblyName System.Windows.Forms
$isPendenciaBool = ($isPendencia -eq "true") -or ($isPendencia -eq "$true")

# Função para localizar um texto e focar nele
function Focus-ByText {
    param($text)
    [Win32]::SetForegroundWindow($global:targetHandle)
    [System.Windows.Forms.SendKeys]::SendWait("^f")
    Start-Sleep -Milliseconds 300
    [System.Windows.Forms.SendKeys]::SendWait($text)
    Start-Sleep -Milliseconds 500
    [System.Windows.Forms.SendKeys]::SendWait("{ESC}")
    Start-Sleep -Milliseconds 300
}

function Send-Keys {
    param($keys, $wait = 500)
    [Win32]::SetForegroundWindow($global:targetHandle)
    [System.Windows.Forms.SendKeys]::SendWait($keys)
    Start-Sleep -Milliseconds $wait
}

# API de Foco
$Win32Api = @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@
Add-Type -TypeDefinition $Win32Api

Write-Host "--- Iniciando Automação (Navegação Reversa) ---"
[console]::beep(440, 200)

$proc = Get-Process | Where-Object { ($_.ProcessName -eq "firefox") -and ($_.MainWindowTitle -like "*Sagicon*") } | Select-Object -First 1

if ($proc) {
    $global:targetHandle = $proc.MainWindowHandle
    [Win32]::ShowWindow($global:targetHandle, 3) 
    [Win32]::SetForegroundWindow($global:targetHandle)
    Start-Sleep -Seconds 2 
} else {
    Write-Error "Firefox com Sagicon não encontrado."
    exit 1
}

# --- SEQUÊNCIA REVERSA PARA O BOTÃO ALTERAR ---

# 1. Busca o botão "Fechar" (que é o último da página)
Focus-ByText "Fechar"

# 2. Volta do 'Fechar' até o 'Alterar' (6 Shift+TABs)
Write-Host "Navegando do Fechar para o Alterar..."
for($i=0; $i -lt 6; $i++) { Send-Keys "+{TAB}" 150 } 
Send-Keys "{ENTER}" # Clica no Alterar
Start-Sleep -Seconds 1

# 3. Vai para Aba Evolução
Focus-ByText "Evolu"
Send-Keys "{ENTER}"
Start-Sleep -Seconds 1

# 4. Clicar em Inserir (Geralmente é o match da aba ou um TAB à frente)
Focus-ByText "Inserir"
Send-Keys "{ENTER}"
Start-Sleep -Seconds 1

# 5. Preencher Campos
Send-Keys "^a" ; Send-Keys "{BACKSPACE}" ; Send-Keys "$local" ; Send-Keys "{TAB}"
Send-Keys "^a" ; Send-Keys "{BACKSPACE}" ; Send-Keys "$sit" ; Send-Keys "{TAB}"
Send-Keys "^a" ; Send-Keys "{BACKSPACE}" ; Send-Keys "$julgamento" ; Send-Keys "{TAB}"

# 6. Colar Parecer
Send-Keys "^v" 
Send-Keys "{TAB}"

if ($isPendenciaBool) {
    Focus-ByText "Encaminhar CRF" ; Send-Keys "{ENTER}"
    Focus-ByText "Anexar" ; Send-Keys " "
}

# 7. Gravar Evolução
Focus-ByText "Gravar" ; Send-Keys "{ENTER}"
Start-Sleep -Seconds 2

# 8. Navegar até Contratos
Focus-ByText "Dados da Firma" ; Send-Keys "{ENTER}"
Focus-ByText "Responsa" ; Send-Keys "{ENTER}"

# --- PAUSA ---
[console]::beep(660, 300)
[System.Windows.Forms.MessageBox]::Show("AÇÃO MANUAL:`n`n1. Clique na ENGRENAGEM do contrato.`n2. Clique em OK aqui para finalizar.", "Pausa", [System.Windows.Forms.MessageBoxButtons]::OK)

# --- FINALIZAÇÃO ---
[Win32]::SetForegroundWindow($global:targetHandle)
Start-Sleep -Milliseconds 500

# Salvar Final (Usando a mesma técnica reversa a partir do Fechar)
Focus-ByText "Fechar"
for($i=0; $i -lt 5; $i++) { Send-Keys "+{TAB}" 150 } # Volta até o botão Salvar
Send-Keys "{ENTER}"

Write-Host "Concluído!"
[console]::beep(880, 200)
