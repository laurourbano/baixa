
$path = "js\main.js"
$content = Get-Content $path -Raw

# Correct the loadDataFromServer function
$correctFunc = @"
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

# Replace the broken function block
$brokenFunc = "async function loadDataFromServer\(\) \{\s+await loadDataFromServer\(\);\s+\}"
$content = $content -replace $brokenFunc, $correctFunc

Set-Content $path $content
