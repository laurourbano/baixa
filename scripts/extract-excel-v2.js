const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, '..', 'assets', 'Cópia de Thais v4..xlsx'));

// ── PISO (valores por categoria - referência Curitiba) ──
const wsPiso = wb.Sheets['PISO'];
const pisoRaw = XLSX.utils.sheet_to_json(wsPiso, { header: 1 });
const piso = {
  curitiba: {
    varejista: parseFloat(pisoRaw[3] && pisoRaw[3][4]) || 4729.62,
    hospitalar: parseFloat(pisoRaw[3] && pisoRaw[3][6]) || 4567,
    distribuidora: parseFloat(pisoRaw[3] && pisoRaw[3][8]) || 4764,
    laboratorios: parseFloat(pisoRaw[3] && pisoRaw[3][10]) || 3763.08,
    industrias: parseFloat(pisoRaw[3] && pisoRaw[3][12]) || 4211.45
  },
  // Outras cidades usam Curitiba como referência base
  default: {
    varejista: 4729.62,
    hospitalar: 4567,
    distribuidora: 4764,
    laboratorios: 3763.08,
    industrias: 4211.45
  },
  horasSemana: 44
};
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'piso.json'), JSON.stringify(piso, null, 2));

// ── PISO_REF. (calculadora de piso por ACT) ──
const wsPisoRef = wb.Sheets['PISO_REF. '];
const pisoRefRaw = XLSX.utils.sheet_to_json(wsPisoRef, { header: 1 });
const pisoRef = {
  valorReferencia: parseFloat(pisoRefRaw[2] && pisoRefRaw[2][5]) || 4483,
  horasReferencia: parseFloat(pisoRefRaw[4] && pisoRefRaw[4][5]) || 30,
  resultado: parseFloat(pisoRefRaw[11] && pisoRefRaw[11][5]) || 3056.59,
  valorHora: parseFloat(pisoRefRaw[15] && pisoRefRaw[15][5]) || 20.38
};
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'piso-ref.json'), JSON.stringify(pisoRef, null, 2));

// ── NORMAS ──
const wsNormas = wb.Sheets['NORMAS'];
const normasRaw = XLSX.utils.sheet_to_json(wsNormas, { header: 1 });
const normas = normasRaw.slice(2).filter(r => r[1] && r[1] !== 'NORMA').map(r => ({
  norma: (r[1] || '').trim(),
  orgao: (r[2] || '').trim(),
  link: (r[3] || '').trim(),
  assunto: (r[4] || '').trim()
}));
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'normas.json'), JSON.stringify(normas, null, 2));

// ── RESPOSTAS (FAQ) ──
const wsResp = wb.Sheets['RESPOSTAS'];
const respRaw = XLSX.utils.sheet_to_json(wsResp, { header: 1 });
const respostas = respRaw.slice(1).filter(r => r[0] && r[1]).map(r => ({
  tipo: (r[0] || '').trim(),
  pergunta: (r[1] || '').trim(),
  resposta: (r[2] || '').trim(),
  complemento: (r[3] || '').trim()
}));
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'respostas.json'), JSON.stringify(respostas, null, 2));

// ── PROTOCOLOS ──
const wsBase = wb.Sheets['Base protocolos'];
const baseRaw = XLSX.utils.sheet_to_json(wsBase, { header: 1 });
const protocolos = baseRaw.filter(r => r[0]).map(r => ({
  protocolo: (r[0] || '').trim(),
  status: (r[2] || '').trim(),
  estabelecimento: (r[4] || '').trim()
}));
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'protocolos-base.json'), JSON.stringify(protocolos, null, 2));

// ── LISTAS: Documentos, Tipos de Estabelecimento, Respostas Padrão ──
const wsListas = wb.Sheets['listas'];
const listasRaw = XLSX.utils.sheet_to_json(wsListas, { header: 1 });

// Coluna 0: Documentos (R1-R41), depois PRAZOS E ASSISTÊNCIA (R41+)
// Coluna 1: Tipo Estabelecimento (R1-R36)
// Coluna 2: Respostas Padrão (R1-R46)

const documentos = [];
const tiposEstabelecimento = [];
const respostasPadrao = [];
const prazosAssistencia = [];

for (let i = 1; i < listasRaw.length; i++) {
  const r = listasRaw[i];
  const doc = r[0] ? r[0].trim() : '';
  const tipo = r[1] ? r[1].trim() : '';
  const resp = r[2] ? r[2].trim() : '';

  if (doc && doc !== 'PRAZOS E ASSISTÊNCIA POR TIPOS DE ESTABELECIMENTO') {
    documentos.push(doc);
  }
  if (tipo) {
    tiposEstabelecimento.push(tipo);
  }
  if (resp) {
    respostasPadrao.push(resp);
  }

  // Após "PRAZOS E ASSISTÊNCIA", o conteúdo muda
  if (doc === 'PRAZOS E ASSISTÊNCIA POR TIPOS DE ESTABELECIMENTO') {
    // As linhas seguintes (R42+) contêm tipos de estabelecimento na col 0
    break;
  }
}

// Extrai prazos (a partir da linha após "PRAZOS E ASSISTÊNCIA")
let prazosStartIdx = -1;
for (let i = 1; i < listasRaw.length; i++) {
  if (listasRaw[i][0] && listasRaw[i][0].trim() === 'PRAZOS E ASSISTÊNCIA POR TIPOS DE ESTABELECIMENTO') {
    prazosStartIdx = i + 1;
    break;
  }
}

if (prazosStartIdx > 0) {
  for (let i = prazosStartIdx; i < listasRaw.length; i++) {
    const r = listasRaw[i];
    if (r[0] && r[0].trim()) {
      prazosAssistencia.push(r[0].trim());
    }
  }
}

const listas = {
  documentos,
  tiposEstabelecimento,
  respostasPadrao,
  prazosAssistencia
};
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'listas.json'), JSON.stringify(listas, null, 2));

// ── CALC. HORAS ──
const wsCalcHoras = wb.Sheets['CALC. HORAS'];
const calcHorasRaw = XLSX.utils.sheet_to_json(wsCalcHoras, { header: 1 });
const calcHoras = {
  horasSemana: parseFloat(calcHorasRaw[9] && calcHorasRaw[9][4]) || 0,
  descricao: 'Calculadora de horas por turno'
};
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'calc-horas.json'), JSON.stringify(calcHoras, null, 2));

// ── ORIENTAÇÕES ──
const wsOrient = wb.Sheets['ORIENTAÇÕES'];
const orientRaw = XLSX.utils.sheet_to_json(wsOrient, { header: 1 });
const orientacoes = [];
for (let i = 0; i < orientRaw.length; i++) {
  const r = orientRaw[i];
  if (r[3] && r[3].trim()) {
    orientacoes.push(r[3].trim());
  }
}
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'orientacoes.json'), JSON.stringify(orientacoes, null, 2));

console.log('=== Extração completa ===');
console.log('piso.json:', JSON.stringify(piso));
console.log('piso-ref.json:', JSON.stringify(pisoRef));
console.log('normas.json:', normas.length, 'registros');
console.log('respostas.json:', respostas.length, 'registros');
console.log('protocolos-base.json:', protocolos.length, 'registros');
console.log('listas.json:', {
  documentos: documentos.length,
  tiposEstabelecimento: tiposEstabelecimento.length,
  respostasPadrao: respostasPadrao.length,
  prazosAssistencia: prazosAssistencia.length
});
console.log('orientacoes.json:', orientacoes.length, 'registros');
console.log('Done!');
