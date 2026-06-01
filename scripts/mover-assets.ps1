# Mover arquivos soltos de assets/ para subpastas
$assets = "c:\Users\lauro.urbano\Desktop\baixa\assets"

# PDFs -> docs/
Get-ChildItem "$assets\*.pdf" | ForEach-Object {
  git mv "assets/$($_.Name)" "assets/docs/$($_.Name)" 2>$null
}

# DOCXs -> docs/
Get-ChildItem "$assets\*.docx" | ForEach-Object {
  git mv "assets/$($_.Name)" "assets/docs/$($_.Name)" 2>$null
}

# ODTs -> docs/
Get-ChildItem "$assets\*.odt" | ForEach-Object {
  git mv "assets/$($_.Name)" "assets/docs/$($_.Name)" 2>$null
}

# Imagens -> img/
Get-ChildItem "$assets\*.png","$assets\*.jpg","$assets\*.jpeg","$assets\*.JPG","$assets\*.PNG","$assets\*.JPEG" | ForEach-Object {
  git mv "assets/$($_.Name)" "assets/img/$($_.Name)" 2>$null
}

# .lnk -> docs/
Get-ChildItem "$assets\*.lnk" | ForEach-Object {
  git mv "assets/$($_.Name)" "assets/docs/$($_.Name)" 2>$null
}

Write-Host "Concluído!"
