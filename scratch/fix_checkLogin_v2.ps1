
$path = "js\main.js"
$content = Get-Content $path
$newContent = @()
foreach($line in $content) {
    $newContent += $line
    if($line -match "showToast\(`"Bem-vindo") {
        $newContent += "            loadDataFromServer();"
    }
}
$newContent | Set-Content $path
