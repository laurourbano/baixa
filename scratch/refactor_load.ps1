
$path = "js\main.js"
$content = Get-Content $path -Raw

# 1. Define loadDataFromServer function
$loadDataFunc = @"
    async function loadDataFromServer() {
        // Carrega dados do Servidor (Ponte Local)
        try {
            console.log("Buscando dados no servidor...");
            const response = await fetch(API_URL);
            if (response.ok) {
                const serverData = await response.json();
                state.order = serverData.order || [];
                state.customs = serverData.customs || [];
                state.edits = serverData.edits || {};
                state.deleted = serverData.deleted || [];
                console.log("Dados carregados do servidor com sucesso.");
            } else {
                console.warn("Servidor offline ou vazio, carregando backup local...");
                const backupRes = await fetch('cards_backup.json');
                if (backupRes.ok) {
                    const backupData = await backupRes.json();
                    state.order = backupData.order || [];
                    state.customs = backupData.customs || [];
                    state.edits = backupData.edits || {};
                    state.deleted = backupData.deleted || [];
                }
            }
        } catch (e) {
            showToast("Aviso: Servidor local não detectado. Verifique se o terminal está rodando.", "warning", 5000);
            console.error("Erro ao conectar ao servidor:", e);
            try {
                const backupRes = await fetch('cards_backup.json');
                if (backupRes.ok) {
                    const backupData = await backupRes.json();
                    state.order = backupData.order || [];
                    state.customs = backupData.customs || [];
                    state.edits = backupData.edits || {};
                    state.deleted = backupData.deleted || [];
                }
            } catch (err) {}
        }
        render();
    }
"@

# Insert the function before init()
$content = $content -replace "async function init\(\) \{", "$loadDataFunc`n`n    async function init() {"

# 2. Replace the loading logic in init()
# Find the block from "// Carrega dados do Servidor" to "render();"
$oldInitBlock = "// Carrega dados do Servidor[\s\S]+?render\(\);"
$content = $content -replace $oldInitBlock, "await loadDataFromServer();"

# 3. Update checkLogin() to call loadDataFromServer()
$oldCheckLoginSuccess = "showToast\(\`Bem-vindo, \$\{emailInput\.value\.split\('@'\)\[0\]\}!\`, 'success'\);"
$content = $content -replace $oldCheckLoginSuccess, "$oldCheckLoginSuccess`n            loadDataFromServer();"

Set-Content $path $content
