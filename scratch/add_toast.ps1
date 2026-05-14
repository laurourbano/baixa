
$path = "js\main.js"
$content = Get-Content $path -Raw
$old = 'console.error("Erro ao conectar ao servidor:", e);'
$new = 'showToast("Aviso: Servidor local não detectado. Verifique se o terminal está rodando.", "warning", 5000); console.error("Erro ao conectar ao servidor:", e);'
$content = $content.Replace($old, $new)
Set-Content $path $content
