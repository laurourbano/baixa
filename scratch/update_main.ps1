
$path = "js\main.js"
$content = Get-Content $path -Raw

# 1. Update state initialization
$oldState = "    const STORAGE_KEY = 'baixa_rt_data';`r`n    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {`r`n        order: [],`r`n        customs: [],`r`n        edits: {},`r`n        deleted: []`r`n    };"
$newState = "    const API_URL = 'http://127.0.0.1:3002/api/data';`r`n    let state = {`r`n        order: [],`r`n        customs: [],`r`n        edits: {},`r`n        deleted: []`r`n    };"

# Using regex to be safe about line endings
$content = $content -replace "const STORAGE_KEY = 'baixa_rt_data';\s+const state = JSON\.parse\(localStorage\.getItem\(STORAGE_KEY\)\) \|\| \{[^}]+\};", $newState

# 2. Update init function (fetch from server)
$oldInitSearch = "// Carrega dados do backup local \(arquivo cards_backup\.json é a fonte da verdade\)\s+try \{\s+const response = await fetch\('cards_backup\.json'\);\s+if \(response\.ok\) \{[^}]+}\s+} catch \(e\) \{[^}]+}"
$newInit = "// Carrega dados do Servidor (Ponte Local)
        try {
            console.log('Buscando dados no servidor...');
            const response = await fetch(API_URL);
            if (response.ok) {
                const serverData = await response.json();
                state.order = serverData.order || [];
                state.customs = serverData.customs || [];
                state.edits = serverData.edits || {};
                state.deleted = serverData.deleted || [];
                console.log('Dados carregados do servidor com sucesso.');
            } else {
                console.warn('Servidor offline, usando backup local...');
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
            console.error('Erro ao conectar ao servidor:', e);
            const backupRes = await fetch('cards_backup.json').catch(() => null);
            if (backupRes && backupRes.ok) {
                const backupData = await backupRes.json();
                state.order = backupData.order || [];
                state.customs = backupData.customs || [];
                state.edits = backupData.edits || {};
                state.deleted = backupData.deleted || [];
            }
        }"

$content = $content -replace $oldInitSearch, $newInit

# 3. Update save function
$content = $content -replace "const save = \(\) => localStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(state\)\);", "const save = async () => { try { await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) }); } catch (e) { console.error('Erro ao salvar:', e); } };"

Set-Content $path $content -NoNewline
