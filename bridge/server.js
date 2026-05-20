const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
// Optional AWS S3 integration
let s3Client = null;
let S3Bucket = process.env.S3_BUCKET_NAME || process.env.S3_BUCKET;
try {
    if (process.env.S3_BUCKET_NAME || process.env.S3_BUCKET) {
        const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
        s3Client = new S3Client({ region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION });
        // attach to exports for use in upload function via closure
        global.__PutObjectCommand = PutObjectCommand;
    }
} catch (e) {
    console.warn('AWS SDK not configured or not installed:', e.message);
}

const app = express();
const port = process.env.PORT || 3002;

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

        const payload = JSON.stringify(data, null, 2);
        fs.writeFileSync(dataFile, payload, 'utf8');
        const backupPath = path.join(backupsDir, backupName);
        fs.writeFileSync(backupPath, payload, 'utf8');

        // Upload to S3 if configured
        if (s3Client && S3Bucket) {
            const key = `backups/${backupName}`;
            const PutObjectCommand = global.__PutObjectCommand;
            s3Client.send(new PutObjectCommand({ Bucket: S3Bucket, Key: key, Body: payload, ContentType: 'application/json' }))
                .then(() => console.log('[S3] Backup enviado para:', key))
                .catch(err => console.error('[S3] Falha ao enviar backup:', err.message));
        }

        return res.json({ success: true, dataFile: 'data.json', backup: backupName });
    } catch (err) {
        console.error('[ERRO /api/backup]:', err);
        return res.status(500).json({ error: 'Erro ao salvar backup', detail: err.message });
    }
});

// Save current state and create a timestamped backup (used by frontend autosave)
app.post('/api/save', (req, res) => {
    const data = req.body;
    const dataFile = path.join(__dirname, 'data.json');
    const backupsDir = path.join(__dirname, 'backups');

    try {
        if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `save-${ts}.json`;

        const payload = JSON.stringify(data, null, 2);
        fs.writeFileSync(dataFile, payload, 'utf8');
        const savePath = path.join(backupsDir, backupName);
        fs.writeFileSync(savePath, payload, 'utf8');

        if (s3Client && S3Bucket) {
            const key = `backups/${backupName}`;
            const PutObjectCommand = global.__PutObjectCommand;
            s3Client.send(new PutObjectCommand({ Bucket: S3Bucket, Key: key, Body: payload, ContentType: 'application/json' }))
                .then(() => console.log('[S3] Save enviado para:', key))
                .catch(err => console.error('[S3] Falha ao enviar save:', err.message));
        }

        return res.json({ success: true, saved: dataFile, backup: backupName });
    } catch (err) {
        console.error('[ERRO /api/save]:', err);
        return res.status(500).json({ error: 'Erro ao salvar data', detail: err.message });
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
// Dev endpoint: servir dados do backup/local
app.get('/api/data', (req, res) => {
    const dataFile = path.join(__dirname, 'data.json');
    const projectBackup = path.join(__dirname, '..', 'cards_backup.json');

    // Tentar ler data.json
    if (fs.existsSync(dataFile)) {
        try {
            const content = fs.readFileSync(dataFile, 'utf8');
            const data = JSON.parse(content);
            return res.json(data);
        } catch (err) {
            console.error('[ERRO lendo data.json]:', err.message);
        }
    }

    // Tentar ler cards_backup.json
    if (fs.existsSync(projectBackup)) {
        try {
            const content = fs.readFileSync(projectBackup, 'utf8');
            const data = JSON.parse(content);
            return res.json(data);
        } catch (err) {
            console.error('[ERRO lendo cards_backup.json]:', err.message);
        }
    }

    // Retornar dados default se nenhum arquivo existir
    return res.json({ 
        order: [], 
        customs: [], 
        edits: {}, 
        deleted: [] 
    });
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, service: 'baixa-backend', dataFile: fs.existsSync(path.join(__dirname, 'data.json')), projectBackup: fs.existsSync(path.join(__dirname, '..', 'cards_backup.json')) });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`\n=========================================`);
    console.log(` PONTE ON-LINE NA PORTA ${port}`);
    console.log(`=========================================\n`);
});
