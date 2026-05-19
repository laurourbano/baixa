const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

app.post('/automate', (req, res) => {
    const { local, sit, julgamento, isPendencia } = req.body;
    const psScript = path.join(__dirname, 'automate_sagicon.ps1');

    console.log(`\n[${new Date().toLocaleTimeString()}] >>> Pedido recebido. Tentando disparar PowerShell...`);

    // Comando simplificado usando exec
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

// Save backup to backend (data.json) and keep timestamped copies
app.post('/api/backup', (req, res) => {
    const data = req.body;
    const dataFile = path.join(__dirname, 'data.json');
    const backupsDir = path.join(__dirname, 'backups');

    try {
        if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `backup-${ts}.json`;

        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
        fs.writeFileSync(path.join(backupsDir, backupName), JSON.stringify(data, null, 2), 'utf8');

        return res.json({ success: true, dataFile: 'data.json', backup: backupName });
    } catch (err) {
        console.error('[ERRO /api/backup]:', err);
        return res.status(500).json({ error: 'Erro ao salvar backup', detail: err.message });
    }
});

// List available backups
app.get('/api/backups', (req, res) => {
    const backupsDir = path.join(__dirname, 'backups');
    try {
        if (!fs.existsSync(backupsDir)) return res.json({ backups: [] });
        const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.json')).sort().reverse();
        return res.json({ backups: files });
    } catch (err) {
        console.error('[ERRO /api/backups]:', err);
        return res.status(500).json({ error: 'Erro ao listar backups' });
    }
});

// Serve a specific backup file
app.get('/api/backup/:name', (req, res) => {
    const backupsDir = path.join(__dirname, 'backups');
    const name = req.params.name;
    const filePath = path.join(backupsDir, name);
    try {
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Backup não encontrado' });
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return res.json(content);
    } catch (err) {
        console.error('[ERRO /api/backup/:name]:', err);
        return res.status(500).json({ error: 'Erro ao ler backup' });
    }
});

// Dev endpoint: servir dados do backup/local
app.get('/api/data', (req, res) => {
    const dataFile = path.join(__dirname, 'data.json');
    const projectBackup = path.join(__dirname, '..', 'cards_backup.json');

    try {
        if (fs.existsSync(dataFile)) {
            const content = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
            return res.json(content);
        }

        if (fs.existsSync(projectBackup)) {
            const content = JSON.parse(fs.readFileSync(projectBackup, 'utf8'));
            return res.json(content);
        }

        return res.json({ order: [], customs: [], edits: {}, deleted: [] });
    } catch (err) {
        console.error('[ERRO /api/data]:', err);
        return res.status(500).json({ error: 'Erro ao ler dados' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, service: 'baixa-backend', dataFile: fs.existsSync(path.join(__dirname, 'data.json')), projectBackup: fs.existsSync(path.join(__dirname, '..', 'cards_backup.json')) });
});

app.listen(port, '127.0.0.1', () => {
    console.log(`\n=========================================`);
    console.log(` PONTE ON-LINE NA PORTA ${port}`);
    console.log(`=========================================\n`);
});
