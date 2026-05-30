const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, '..', 'assets', 'Cópia de Thais v4..xlsx'));

// Extract NORMAS
const wsNormas = wb.Sheets['NORMAS'];
const normasRaw = XLSX.utils.sheet_to_json(wsNormas, { header: 1 });
const normas = normasRaw.slice(2).filter(r => r[1] && r[1] !== 'NORMA').map(r => ({
  norma: (r[1] || '').trim(),
  orgao: (r[2] || '').trim(),
  link: (r[3] || '').trim(),
  assunto: (r[4] || '').trim()
}));
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'normas.json'), JSON.stringify(normas, null, 2));
console.log('normas.json:', normas.length, 'registros');

// Extract RESPOSTAS (FAQ)
const wsResp = wb.Sheets['RESPOSTAS'];
const respRaw = XLSX.utils.sheet_to_json(wsResp, { header: 1 });
const respostas = respRaw.slice(1).filter(r => r[0] && r[1]).map(r => ({
  tipo: (r[0] || '').trim(),
  pergunta: (r[1] || '').trim(),
  resposta: (r[2] || '').trim(),
  complemento: (r[3] || '').trim()
}));
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'respostas.json'), JSON.stringify(respostas, null, 2));
console.log('respostas.json:', respostas.length, 'registros');

// Extract Base Protocolos
const wsBase = wb.Sheets['Base protocolos'];
const baseRaw = XLSX.utils.sheet_to_json(wsBase, { header: 1 });
const protocolos = baseRaw.filter(r => r[0]).map(r => ({
  protocolo: (r[0] || '').trim(),
  status: (r[2] || '').trim(),
  estabelecimento: (r[4] || '').trim()
}));
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'protocolos-base.json'), JSON.stringify(protocolos, null, 2));
console.log('protocolos-base.json:', protocolos.length, 'registros');

// Extract PISO
const wsPiso = wb.Sheets['PISO'];
const pisoRaw = XLSX.utils.sheet_to_json(wsPiso, { header: 1 });
const piso = {
  varejista: parseFloat(pisoRaw[3] && pisoRaw[3][4]) || 4729.62,
  hospitalar: parseFloat(pisoRaw[3] && pisoRaw[3][6]) || 4567,
  distribuidora: parseFloat(pisoRaw[3] && pisoRaw[3][8]) || 4764,
  laboratorios: parseFloat(pisoRaw[3] && pisoRaw[3][10]) || 3763.08,
  industrias: parseFloat(pisoRaw[3] && pisoRaw[3][12]) || 4211.45,
  horasSemana: 44
};
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'piso.json'), JSON.stringify(piso, null, 2));
console.log('piso.json:', JSON.stringify(piso));

console.log('Done!');
