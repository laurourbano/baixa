
$path = "js\main.js"
$content = Get-Content $path
$newContent = @()
foreach($line in $content) {
    $newContent += $line
    if($line.Contains("Bem-vindo")) {
        $newContent += "            loadDataFromServer();"
    }
}
$newContent | Set-Content $path
