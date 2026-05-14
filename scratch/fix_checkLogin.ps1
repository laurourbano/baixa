
$path = "js\main.js"
$content = [System.IO.File]::ReadAllText($path)
$target = "showToast(`"Bem-vindo, `${emailInput.value.split('@')[0]}!`", 'success');"
$replacement = "showToast(`"Bem-vindo, `${emailInput.value.split('@')[0]}!`", 'success');`r`n            loadDataFromServer();"
$newContent = $content.Replace($target, $replacement)
[System.IO.File]::WriteAllText($path, $newContent)
