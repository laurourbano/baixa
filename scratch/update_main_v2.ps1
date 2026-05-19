
$path = "js\main.js"
$content = Get-Content $path -Raw

# Update init
$oldInit = "// Carrega dados do backup local \(arquivo cards_backup\.json é a fonte da verdade\)\s+try \{\s+const response = await fetch\('cards_backup\.json'\);\s+if \(response\.ok\) \{[^}]+}\s+} catch \(e\) \{[^}]+}"
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

$content = $content -replace "const state = JSON\.parse\(localStorage\.getItem\(STORAGE_KEY\)\) \|\| \{", "let state = {"
$content = $content -replace [regex]::Escape("// Carrega dados do backup local (arquivo cards_backup.json é a fonte da verdade)"), "// Carrega dados do Servidor (Ponte Local)"
$content = $content -replace "const save = \(\) => localStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(state\)\);", "const save = async () => { try { await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) }); } catch (e) { console.error('Erro ao salvar:', e); } };"

Set-Content $path $content
