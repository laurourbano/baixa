const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

let s3Client = null;
let S3Bucket = process.env.S3_BUCKET_NAME || process.env.S3_BUCKET;
try {
    if (process.env.S3_BUCKET_NAME || process.env.S3_BUCKET) {
        const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
        s3Client = new S3Client({ region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION });
        global.__PutObjectCommand = PutObjectCommand;
    }
} catch (e) {
    console.warn('AWS SDK not configured or not installed:', e.message);
}

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

const DATA_DIR = process.env.DATA_DIR || __dirname;
const DB_PATH = path.join(DATA_DIR, 'baixa.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
    CREATE TABLE IF NOT EXISTS state (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS backups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
`);

const saveState = db.prepare(`
    INSERT INTO state (key, data, updated_at) VALUES ('main', ?, ?)
    ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
`);

const getAllState = db.prepare(`SELECT data FROM state WHERE key = 'main'`).pluck(true);

const insertBackup = db.prepare(`
    INSERT INTO backups (name, data, created_at) VALUES (?, ?, ?)
`);

const getAllBackups = db.prepare(`SELECT name, created_at FROM backups ORDER BY created_at DESC`);

const getBackupByName = db.prepare(`SELECT data FROM backups WHERE name = ?`).pluck(true);

function uploadToS3(key, body) {
    if (s3Client && S3Bucket) {
        const PutObjectCommand = global.__PutObjectCommand;
        s3Client.send(new PutObjectCommand({ Bucket: S3Bucket, Key: key, Body: body, ContentType: 'application/json' }))
            .then(() => console.log('[S3] Upload OK:', key))
            .catch(err => console.error('[S3] Upload falhou:', err.message));
    }
}

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

app.post('/api/backup', (req, res) => {
    const data = req.body;
    const payload = JSON.stringify(data, null, 2);
    const ts = new Date();
    const isoStr = ts.toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${isoStr}.json`;

    try {
        saveState.run(payload, ts.toISOString());
        insertBackup.run(backupName, payload, ts.toISOString());
        uploadToS3(`backups/${backupName}`, payload);
        return res.json({ success: true, dataFile: 'baixa.db', backup: backupName });
    } catch (err) {
        console.error('[ERRO /api/backup]:', err);
        return res.status(500).json({ error: 'Erro ao salvar backup', detail: err.message });
    }
});

app.post('/api/save', (req, res) => {
    const data = req.body;
    const payload = JSON.stringify(data, null, 2);
    const ts = new Date();
    const isoStr = ts.toISOString().replace(/[:.]/g, '-');
    const backupName = `save-${isoStr}.json`;

    try {
        saveState.run(payload, ts.toISOString());
        insertBackup.run(backupName, payload, ts.toISOString());
        uploadToS3(`backups/${backupName}`, payload);
        return res.json({ success: true, saved: 'baixa.db', backup: backupName });
    } catch (err) {
        console.error('[ERRO /api/save]:', err);
        return res.status(500).json({ error: 'Erro ao salvar data', detail: err.message });
    }
});

app.get('/api/backups', (req, res) => {
    try {
        const rows = getAllBackups.all();
        return res.json({ backups: rows.map(r => r.name) });
    } catch (err) {
        console.error('[ERRO /api/backups]:', err);
        return res.status(500).json({ error: 'Erro ao listar backups' });
    }
});

app.get('/api/backup/:name', (req, res) => {
    const name = req.params.name;
    try {
        const data = getBackupByName.get(name);
        if (!data) return res.status(404).json({ error: 'Backup não encontrado' });
        return res.json(JSON.parse(data));
    } catch (err) {
        console.error('[ERRO /api/backup/:name]:', err);
        return res.status(500).json({ error: 'Erro ao ler backup' });
    }
});

app.get('/api/data', (req, res) => {
    try {
        const data = getAllState.get();
        if (data) {
            return res.json(JSON.parse(data));
        }

        const projectBackup = path.join(__dirname, '..', 'cards_backup.json');
        if (fs.existsSync(projectBackup)) {
            const content = fs.readFileSync(projectBackup, 'utf8');
            return res.json(JSON.parse(content));
        }

        // Fallback: bridge/data.json (commitado no repositório, sempre disponível)
        const bridgeData = path.join(__dirname, 'data.json');
        if (fs.existsSync(bridgeData)) {
            const content = fs.readFileSync(bridgeData, 'utf8');
            return res.json(JSON.parse(content));
        }

        return res.json({
            order: [],
            customs: [],
            edits: {},
            deleted: []
        });
    } catch (err) {
        console.error('[ERRO /api/data]:', err);
        return res.status(500).json({ error: 'Erro ao carregar dados' });
    }
});

app.get('/api/health', (req, res) => {
    try {
        const stateRow = getAllState.get();
        return res.json({
            success: true,
            service: 'baixa-backend',
            database: 'SQLite (baixa.db)',
            hasState: !!stateRow
        });
    } catch (err) {
        return res.json({ success: true, service: 'baixa-backend', database: 'SQLite (baixa.db)', error: err.message });
    }
});

const PUBLIC_DIR = path.join(__dirname, '..');
app.use(express.static(PUBLIC_DIR));
app.get('/', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

app.listen(port, '0.0.0.0', () => {
    console.log(`\n=========================================`);
    console.log(` PONTE ON-LINE NA PORTA ${port}`);
    console.log(` SQLite: ${DB_PATH}`);
    console.log(`=========================================\n`);
});
