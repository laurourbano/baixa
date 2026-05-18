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

const syncGitHubBackup = async (data) => {
    if (!GITHUB_TOKEN) {
        return { success: false, skipped: true, message: 'GITHUB_TOKEN não configurado' };
    }

    const headers = {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28'
    };
    const fileUrl = `https://api.github.com/repos/${GITHUB_REPOSITORY}/contents/${GITHUB_BACKUP_PATH}`;
    const fileRes = await fetch(fileUrl, { headers });

    if (fileRes.status === 401 || fileRes.status === 403) {
        return { success: false, message: 'Token do GitHub inválido ou sem permissão' };
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
        return { success: false, message: error.message || 'Falha ao sincronizar GitHub' };
    }

    return { success: true };
};

const enqueueGitHubBackup = (data) => {
    githubSyncQueue = githubSyncQueue
        .catch(() => {})
        .then(() => syncGitHubBackup(data));

    return githubSyncQueue;
};

const getDataHandler = (req, res) => {
    try {
        const data = readData();
        res.json(data);
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

// Endpoints de Persistência
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        githubTokenConfigured: Boolean(GITHUB_TOKEN),
        githubRepository: GITHUB_REPOSITORY,
        githubBackupPath: GITHUB_BACKUP_PATH
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
