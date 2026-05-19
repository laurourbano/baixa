const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3002;
const DATA_FILE = path.join(__dirname, 'data.json');
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || 'laurourbano/baixa';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_BACKUP_PATH = process.env.GITHUB_BACKUP_PATH || 'cards_backup.json';
let githubSyncQueue = Promise.resolve();

app.use((req, res, next) => {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
});
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
    res.json({
        success: true,
        service: 'baixa-backend',
        endpoints: ['/api/health', '/api/baixa', '/api/data']
    });
});

// Helper para ler dados
const readData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        return {
            order: [],
            customs: [],
            edits: {},
            deleted: []
        };
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
};

const emptyData = () => ({
    order: [],
    customs: [],
    edits: {},
    deleted: []
});

const githubHeaders = () => ({
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28'
});

const githubFileUrl = () => `https://api.github.com/repos/${GITHUB_REPOSITORY}/contents/${GITHUB_BACKUP_PATH}`;

const readGitHubBackup = async () => {
    // If token not provided, try raw.githubusercontent for public repos as a fallback
    if (!GITHUB_TOKEN) {
        try {
            const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/main/${GITHUB_BACKUP_PATH}`;
            const rawRes = await fetch(rawUrl);
            if (rawRes.ok) {
                const text = await rawRes.text();
                return { success: true, data: JSON.parse(text) };
            }
        } catch (err) {
            // continue to API path below which will report missing token
        }

        return { success: false, skipped: true, message: 'GITHUB_TOKEN não configurado no backend' };
    }

    const response = await fetch(githubFileUrl(), { headers: githubHeaders() });

    if (response.status === 401) {
        return { success: false, message: 'GITHUB_TOKEN inválido ou expirado' };
    }

    if (response.status === 403) {
        return { success: false, message: 'GITHUB_TOKEN sem permissão para ler o repositório' };
    }

    if (response.status === 404) {
        return { success: false, notFound: true, message: 'Backup não encontrado no GitHub' };
    }

    if (!response.ok) {
        return { success: false, message: `GitHub respondeu HTTP ${response.status}` };
    }

    const fileData = await response.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf8');
    return { success: true, data: JSON.parse(content), sha: fileData.sha };
};

const syncGitHubBackup = async (data) => {
    if (!GITHUB_TOKEN) {
        return { success: false, skipped: true, message: 'GITHUB_TOKEN não configurado no backend' };
    }

    const headers = githubHeaders();
    const fileUrl = githubFileUrl();
    const fileRes = await fetch(fileUrl, { headers });

    if (fileRes.status === 401 || fileRes.status === 403) {
        return { success: false, message: 'GITHUB_TOKEN inválido ou sem permissão de escrita' };
    }

    if (fileRes.status === 404) {
        const repoRes = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}`, { headers });
        if (repoRes.status === 404) {
            return { success: false, message: 'Repositório do GitHub não encontrado' };
        }
    }

    let sha;
    if (fileRes.ok) {
        const fileData = await fileRes.json();
        sha = fileData.sha;
    }

    const content = Buffer.from(JSON.stringify(data, null, 2), 'utf8').toString('base64');
    const body = {
        message: `Backup automático ${new Date().toLocaleString('pt-BR')}`,
        content,
        sha
    };

    const saveRes = await fetch(fileUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
    });

    if (!saveRes.ok) {
        const error = await saveRes.json().catch(() => ({}));
        return { success: false, message: error.message || 'Falha ao sincronizar com o GitHub' };
    }

    return { success: true };
};

const checkGitHubAccess = async () => {
    if (!GITHUB_TOKEN) {
        return { status: 'missing', message: 'GITHUB_TOKEN não configurado no backend' };
    }

    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}`, {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (response.ok) {
            const repo = await response.json();
            return {
                status: 'valid',
                message: 'GITHUB_TOKEN configurado e com acesso ao repositório',
                canPush: Boolean(repo.permissions?.push || repo.permissions?.admin || repo.permissions?.maintain)
            };
        }

        if (response.status === 401) {
            return { status: 'invalid', message: 'GITHUB_TOKEN inválido ou expirado' };
        }

        if (response.status === 403) {
            return { status: 'forbidden', message: 'GITHUB_TOKEN sem permissão suficiente para este repositório' };
        }

        if (response.status === 404) {
        return { status: 'repo_not_found', message: 'Repositório não encontrado ou GITHUB_TOKEN sem acesso ao repositório' };
        }

        return { status: 'error', message: `GitHub respondeu HTTP ${response.status}` };
    } catch (error) {
        return { status: 'error', message: 'Falha ao validar GITHUB_TOKEN no GitHub' };
    }
};

const enqueueGitHubBackup = (data) => {
    githubSyncQueue = githubSyncQueue
        .catch(() => {})
        .then(() => syncGitHubBackup(data));

    return githubSyncQueue;
};

const getDataHandler = async (req, res) => {
    try {
        const githubBackup = await readGitHubBackup();

        if (githubBackup.success) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(githubBackup.data, null, 2));
            return res.json(githubBackup.data);
        }

        if (githubBackup.notFound) {
            return res.json(emptyData());
        }
        // If GitHub backup isn't available, try local data file; if missing, try project's cards_backup.json
        const fallback = readData();
        if (fallback && Array.isArray(fallback.customs) && fallback.customs.length > 0) {
            res.setHeader('X-Backup-Source', 'local-datajson');
            res.setHeader('X-GitHub-Error', githubBackup.message || 'Falha ao ler backup no GitHub');
            return res.json(fallback);
        }

        // try project's root cards_backup.json
        const projectBackup = path.join(__dirname, '..', 'cards_backup.json');
        if (fs.existsSync(projectBackup)) {
            try {
                const content = JSON.parse(fs.readFileSync(projectBackup, 'utf8'));
                res.setHeader('X-Backup-Source', 'project-root-backup');
                return res.json(content);
            } catch (err) {
                // fallthrough to return empty
            }
        }

        res.setHeader('X-Backup-Source', 'local-fallback');
        res.setHeader('X-GitHub-Error', githubBackup.message || 'Falha ao ler backup no GitHub');
        res.json(fallback);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao ler dados' });
    }
};

const postDataHandler = async (req, res) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
        const cloudSync = await enqueueGitHubBackup(req.body);
        res.json({ success: true, cloudSync });
    } catch (error) {
        console.error('[ERRO AO SALVAR]:', error);
        res.status(500).json({ error: 'Erro ao salvar dados' });
    }
};

// Importar um backup JSON para o data store local (útil para recuperação rápida em dev)
app.post('/api/import', (req, res) => {
    try {
        const payload = req.body;
        if (!payload || typeof payload !== 'object') {
            return res.status(400).json({ success: false, message: 'Payload inválido' });
        }

        fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2));
        return res.json({ success: true, message: 'Importado para data.json' });
    } catch (err) {
        console.error('[ERRO IMPORT]:', err);
        return res.status(500).json({ success: false, message: 'Erro ao importar' });
    }
});

// Endpoints de Persistência
app.get('/api/health', async (req, res) => {
    const github = await checkGitHubAccess();
    const backup = await readGitHubBackup();

    res.json({
        success: true,
        githubTokenConfigured: Boolean(GITHUB_TOKEN),
        githubRepository: GITHUB_REPOSITORY,
        githubBackupPath: GITHUB_BACKUP_PATH,
        github,
        backup: {
            readable: Boolean(backup.success),
            message: backup.success ? 'Backup lido direto do GitHub' : backup.message
        }
    });
});

app.get('/api/data', getDataHandler);
app.post('/api/data', postDataHandler);
app.get('/api/baixa', getDataHandler);
app.post('/api/baixa', postDataHandler);

app.post('/automate', (req, res) => {
    const { local, sit, julgamento, isPendencia } = req.body;
    const psScript = path.join(__dirname, 'automate_sagicon.ps1');

    console.log(`\n[${new Date().toLocaleTimeString()}] >>> Pedido recebido. Tentando disparar PowerShell...`);

    const command = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${psScript}" -local "${local}" -sit "${sit}" -julgamento "${julgamento}" -isPendencia ${isPendencia ? 'true' : 'false'}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`[ERRO DE EXECUÇÃO]: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`[PS ERRO]: ${stderr}`);
            return;
        }
        console.log(`[PS SAÍDA]: ${stdout}`);
    });

    res.json({ success: true });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`\n=========================================`);
    console.log(` PONTE ON-LINE NA PORTA ${port}`);
    console.log(`=========================================\n`);
});
