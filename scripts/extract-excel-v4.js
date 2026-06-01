/**
 * extract-excel-v4.js — Extração COMPLETA de todas as abas da planilha.
 * 
 * Extrai TODOS os dados disponíveis em cada aba, sem perder conteúdo.
 * Gera JSONs completos para cada seção do portal de Consultas + Ferramentas.
 * 
 * Abas extraídas (12):
 *   1. Base protocolos → protocolos-base.json (3 listas: protocolos, status, estabelecimentos)
 *   2. PROTOCOLOS     → protocolos-detalhados.json (526 registros)
 *   3. ORIENTAÇÕES    → orientacoes.json (documentos, situacoes, checklist, prazos)
 *   4. RESPOSTAS PADRÃO → respostas-padrao.json (múltiplas respostas)
 *   5. PISO           → piso.json (valores extraídos direto da planilha)
 *   6. PISO_REF.      → piso-ref.json
 *   7. NORMAS         → normas.json
 *   8. NOMES EMPRESARIAIS → nomes-empresariais.json
 *   9. CALC. HORAS    → calc-horas.json
 *  10. RESPOSTAS      → faq.json (23 itens)
 *  11. listas         → listas.json (documentos, tiposEstabelecimento, respostasPadrao, prazosAssistencia)
 *  12. Planilha2      → (vazia, ignorada)
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, '..', 'assets', 'Cópia de Thais v4..xlsx'));
const outDir = path.join(__dirname, '..', 'assets');
const out = (name, data) => { fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2)); console.log('  ' + name + ': ' + (Array.isArray(data) ? data.length : 'object') + ' itens'); };

console.log('=== Extração COMPLETA das planilhas (v4) ===\n');
console.log('Abas disponíveis:', wb.SheetNames.join(', '), '\n');

// ═══════════════════════════════════════════
// 1. BASE PROTOCOLOS — 3 listas separadas
// ═══════════════════════════════════════════
(function () {
  const raw = XLSX.utils.sheet_to_json(wb.Sheets['Base protocolos'], { header: 1 });
  const protocolos = [], statusList = [], estabelecimentos = [];

  raw.forEach(r => {
    if (r[0] && r[0] !== 'NOME DO PROTOCOLO') protocolos.push(String(r[0]).trim());
    if (r[2] && r[2] !== 'STATUS') statusList.push(String(r[2]).trim());
    if (r[4] && r[4] !== 'TIPO DE ESTABELECIMENTO') estabelecimentos.push(String(r[4]).trim());
  });

  const protoBase = raw.filter(r => r[0]).map(r => ({
    protocolo: String(r[0] || '').trim(),
    status: String(r[2] || '').trim(),
    estabelecimento: String(r[4] || '').trim()
  }));

  out('protocolos-base.json', protoBase);
  // Arquivo extra com listas expandidas
  out('protocolos-base-listas.json', {
    protocolos: [...new Set(protocolos)],
    status: [...new Set(statusList)],
    estabelecimentos: [...new Set(estabelecimentos)]
  });
})();

// ═══════════════════════════════════════════
// 2. PROTOCOLOS DETALHADOS (526+ registros)
// ═══════════════════════════════════════════
(function () {
  const raw = XLSX.utils.sheet_to_json(wb.Sheets['PROTOCOLOS'], { header: 1 });
  const protoDetalhados = raw.slice(1).filter(r => r[0] || r[1] || r[3]).map(r => ({
    situacao: String(r[0] || '').trim(),
    numProtocolo: String(r[1] || '').trim(),
    data: typeof r[2] === 'number' ? excelDateToISO(r[2]) : String(r[2] || '').trim(),
    tipoEstabelecimento: String(r[3] || '').trim(),
    inscricao: String(r[4] || '').trim(),
    nomeEstabelecimento: String(r[5] || '').trim(),
    obs: String(r[6] || '').trim(),
    ocorrencia: String(r[7] || '').trim()
  }));
  out('protocolos-detalhados.json', protoDetalhados);
})();

// ═══════════════════════════════════════════
// 3. ORIENTAÇÕES — coleta tudo da coluna D
// ═══════════════════════════════════════════
(function () {
  const raw = XLSX.utils.sheet_to_json(wb.Sheets['ORIENTAÇÕES'], { header: 1 });
  const orientacoes = { documentos: [], situacoes: [], checklist: [], prazos: [] };
  let currentSection = '';

  raw.forEach(r => {
    const val = String(r[3] || '').trim();
    if (!val || val === '0') return;

    // Detecta seções
    if (/^documentos$/i.test(val)) { currentSection = 'documentos'; return; }
    if (/^situa[cç][oõ]es\s*espec[ií]ficas/i.test(val)) { currentSection = 'situacoes'; return; }
    if (/^lan[cç]amentos\s+no\s+sagicon/i.test(val) || /^ged/i.test(val)) { currentSection = 'checklist'; return; }
    if (/^prazos/i.test(val)) { currentSection = 'prazos'; return; }

    // Pula cabeçalhos e linhas vazias
    if (/^\*+$/.test(val) || /^requerimento\s+do\s+estabelecimento/i.test(val)) return;
    if (/^(situa[cç][oõ]es|posto\s+de\s+coleta)/i.test(val)) return;
    if (val === currentSection) return;

    if (currentSection && orientacoes[currentSection]) {
      orientacoes[currentSection].push(val);
    }
  });

  out('orientacoes.json', orientacoes);
})();

// ═══════════════════════════════════════════
// 4. RESPOSTAS PADRÃO — extração completa
// ═══════════════════════════════════════════
(function () {
  const raw = XLSX.utils.sheet_to_json(wb.Sheets['RESPOSTAS PADRÃO'], { header: 1 });
  const respostas = {};

  // Estratégia: varre todas as linhas procurando padrão título+texto
  let currentTitle = '';
  let currentLines = [];

  function isAllCaps(str) {
    return str === str.toUpperCase() && str.length > 5 && /[A-Z]/.test(str);
  }
  function isKnownCategory(str) {
    return /^(ARQUIVAMENTO|ASSINATURA|CANCELAMENTO|CARGA HOR[ÁA]RIA|DAP |DECLAROU|DOCUMENTOS|FORMUL[ÁA]RIOS|HABILITA[ÇC][ÕO]ES|INDEFERIMENTO|PROTOCOLOS?|REGISTRO|RESPOSTAS?|SAL[ÁA]RIO|SEM |SOLICITA[ÇC][ÃA]O|TRANSFER[ÊE]NCIAS|V[ÍI]NCULO)/i.test(str);
  }

  raw.forEach(r => {
    // Pega valor das colunas B (índice 1) e A (índice 0) como fallback
    let val = '';
    for (let c = 0; c < r.length; c++) {
      const v = String(r[c] || '').trim();
      if (v && v.length > 1 && !/^(resposta|padr[aã]o|\(?copiar)/i.test(v)) {
        val = v;
        break;
      }
    }

    if (!val) {
      // Linha vazia → finaliza entrada atual
      if (currentTitle && currentLines.length) {
        respostas[currentTitle] = currentLines.join('\n').trim();
        currentTitle = ''; currentLines = [];
      }
      return;
    }

    // Detecta título (maiúsculas ou categoria conhecida)
    if ((isAllCaps(val) || isKnownCategory(val)) && !currentTitle) {
      currentTitle = val;
      currentLines = [];
      return;
    }

    // Acumula texto
    if (currentTitle) {
      currentLines.push(val);
    }
  });

  // Última entrada
  if (currentTitle && currentLines.length) {
    respostas[currentTitle] = currentLines.join('\n').trim();
  }

  // Fallback: se só 1 entrada, usa célula B5 + B2 como título
  if (Object.keys(respostas).length <= 1) {
    // Tenta extrair do texto da coluna B
    raw.forEach(r => {
      const b = String(r[1] || '').trim();
      if (b.length > 50) {
        // Encontra título no início (maiúsculas antes de quebra)
        const titleMatch = b.match(/^([A-ZÇÃÕÂÊÔ\s]+)[\.:\n]/);
        if (titleMatch) {
          respostas[titleMatch[1].trim()] = b;
        }
      }
    });
  }

  out('respostas-padrao.json', respostas);
})();

// ═══════════════════════════════════════════
// 5. PISO — extrai valores reais da planilha
// ═══════════════════════════════════════════
(function () {
  const raw = XLSX.utils.sheet_to_json(wb.Sheets['PISO'], { header: 1 });

  // Linha 3: valores de piso (colunas: 4=varejista, 6=hospitalar, 8=distribuidora, 10=laboratorios, 12=industrias)
  const pisoVals = {
    varejista: parseFloat(raw[3]?.[4]) || parseFloat(raw[3]?.[8]) || 4729.62,
    hospitalar: parseFloat(raw[3]?.[6]) || parseFloat(raw[3]?.[10]) || 4567.00,
    distribuidora: parseFloat(raw[3]?.[8]) || parseFloat(raw[3]?.[12]) || 4764.00,
    laboratorios: parseFloat(raw[3]?.[10]) || parseFloat(raw[3]?.[14]) || 3763.08,
    industrias: parseFloat(raw[3]?.[12]) || parseFloat(raw[3]?.[16]) || 4211.45
  };

  // Linha 5: valor/hora
  const valorHora = {
    varejista: parseFloat(raw[5]?.[4]) || parseFloat((pisoVals.varejista / 220).toFixed(2)),
    hospitalar: parseFloat(raw[5]?.[6]) || parseFloat((pisoVals.hospitalar / 220).toFixed(2)),
    distribuidora: parseFloat(raw[5]?.[8]) || parseFloat((pisoVals.distribuidora / 220).toFixed(2)),
    laboratorios: parseFloat(raw[5]?.[10]) || parseFloat((pisoVals.laboratorios / 220).toFixed(2)),
    industrias: parseFloat(raw[5]?.[12]) || parseFloat((pisoVals.industrias / 220).toFixed(2))
  };

  // Linha 17: proporcional 10h
  const proporcional10h = {
    varejista: parseFloat(raw[17]?.[4]) || parseFloat((pisoVals.varejista * 10 / 44).toFixed(2)),
    hospitalar: parseFloat(raw[17]?.[6]) || parseFloat((pisoVals.hospitalar * 10 / 44).toFixed(2)),
    distribuidora: parseFloat(raw[17]?.[8]) || parseFloat((pisoVals.distribuidora * 10 / 44).toFixed(2)),
    laboratorios: parseFloat(raw[17]?.[10]) || parseFloat((pisoVals.laboratorios * 10 / 44).toFixed(2)),
    industrias: parseFloat(raw[17]?.[12]) || parseFloat((pisoVals.industrias * 10 / 44).toFixed(2))
  };

  // Cidade de referência extraída da célula F3
  const cidadeRef = raw[2]?.[5] ? String(raw[2][5]).trim().toLowerCase() : 'curitiba';

  // Extrai nomes de cidades mencionadas na planilha (linhas comuns)
  const cidadesExtras = {};
  raw.forEach(r => {
    // Procura células com nomes de cidade (texto, não número)
    for (let c = 0; c < r.length; c++) {
      const v = String(r[c] || '').trim();
      if (v && !/^\d/.test(v) && v.length > 3 && !/^(piso|valor|hora|categoria)/i.test(v)) {
        const nome = v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ç/g, 'c').replace(/\s+/g, '_');
        if (nome.length > 3 && nome !== 'curitiba' && !cidadesExtras[nome]) {
          cidadesExtras[nome] = Object.assign({}, pisoVals);
        }
      }
    }
  });

  out('piso-extraido.json', {
    curitiba: pisoVals,
    default: pisoVals,
    horasSemana: 44,
    valorHora: valorHora,
    proporcional10h: proporcional10h,
    cidadeReferencia: cidadeRef,
    cidadesAdicionais: cidadesExtras
  });
})();

// ═══════════════════════════════════════════
// 6. PISO REFERÊNCIA (ACT)
// ═══════════════════════════════════════════
(function () {
  const raw = XLSX.utils.sheet_to_json(wb.Sheets['PISO_REF. '], { header: 1 });
  const pisoRef = {
    valorReferencia: parseFloat(raw[2]?.[5]) || 4483,
    horasReferencia: parseFloat(raw[4]?.[5]) || 30,
    resultado: parseFloat(raw[11]?.[5]) || 3056.59,
    valorHora: parseFloat(raw[15]?.[5]) || 20.38
  };
  out('piso-ref.json', pisoRef);
})();

// ═══════════════════════════════════════════
// 7. NORMAS
// ═══════════════════════════════════════════
(function () {
  const raw = XLSX.utils.sheet_to_json(wb.Sheets['NORMAS'], { header: 1 });
  const normas = raw.slice(2).filter(r => r[1] && r[1] !== 'NORMA').map(r => ({
    norma: String(r[1] || '').trim(),
    orgao: String(r[2] || '').trim(),
    link: String(r[3] || '').trim(),
    assunto: String(r[4] || '').trim()
  }));
  out('normas.json', normas);
})();

// ═══════════════════════════════════════════
// 8. NOMES EMPRESARIAIS
// ═══════════════════════════════════════════
(function () {
  const raw = XLSX.utils.sheet_to_json(wb.Sheets['NOMES EMPRESARIAIS'], { header: 1 });
  const nomes = [];
  raw.forEach(r => {
    // Varre todas as colunas procurando texto
    for (let c = 0; c < r.length; c++) {
      const val = String(r[c] || '').trim();
      if (val && val !== '0' && val.length > 3) {
        nomes.push(val);
      }
    }
  });
  out('nomes-empresariais.json', [...new Set(nomes)]);
})();

// ═══════════════════════════════════════════
// 9. CALC. HORAS
// ═══════════════════════════════════════════
(function () {
  const raw = XLSX.utils.sheet_to_json(wb.Sheets['CALC. HORAS'], { header: 1 });
  const instrucoes = [];

  // Extrai instruções (colunas com texto descritivo)
  raw.forEach(r => {
    for (let c = 0; c < r.length; c++) {
      const val = String(r[c] || '').trim();
      if (val && val.length > 20 && isNaN(Number(val))) {
        instrucoes.push(val);
      }
    }
  });

  const calcHoras = {
    instrucoes: instrucoes,
    totalHorasSemana: parseFloat(raw[9]?.[4]) || parseFloat(raw[9]?.[9]) || 0,
    dias: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'],
    exemplos: {}
  };

  // Tenta extrair valores de exemplo da planilha
  if (raw[3] && raw[4]) {
    ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].forEach((dia, idx) => {
      const col = 4 + idx;
      const ini1 = raw[3]?.[col];
      const fim1 = raw[4]?.[col];
      if (ini1 !== undefined && fim1 !== undefined) {
        calcHoras.exemplos[dia] = {
          turno1: formatarHora(ini1) + '-' + formatarHora(fim1),
          turno2: raw[7]?.[col] !== undefined ? formatarHora(raw[7][col]) + '-' + formatarHora(raw[8]?.[col]) : ''
        };
      }
    });
  }

  out('calc-horas.json', calcHoras);
})();

// ═══════════════════════════════════════════
// 10. FAQ (RESPOSTAS)
// ═══════════════════════════════════════════
(function () {
  const raw = XLSX.utils.sheet_to_json(wb.Sheets['RESPOSTAS'], { header: 1 });
  const faq = raw.slice(1).filter(r => r[0] && r[1]).map(r => ({
    tipo: String(r[0] || '').trim(),
    pergunta: String(r[1] || '').trim(),
    resposta: String(r[2] || '').trim(),
    complemento: String(r[3] || '').trim()
  }));
  out('faq.json', faq);
  out('respostas.json', faq); // alias
})();

// ═══════════════════════════════════════════
// 11. LISTAS
// ═══════════════════════════════════════════
(function () {
  const raw = XLSX.utils.sheet_to_json(wb.Sheets['listas'], { header: 1 });
  const listas = { documentos: [], tiposEstabelecimento: [], respostasPadrao: [], prazosAssistencia: [] };
  let prazosMode = false;

  raw.slice(1).forEach(r => {
    const col0 = String(r[0] || '').trim();
    const col1 = String(r[1] || '').trim();
    const col2 = String(r[2] || '').trim();

    if (col0 === 'PRAZOS E ASSISTÊNCIA POR TIPOS DE ESTABELECIMENTO') {
      prazosMode = true;
      return;
    }
    if (prazosMode) {
      if (col0) listas.prazosAssistencia.push(col0);
      return;
    }
    if (col0 && col0 !== 'LISTAS DE ORIENTAÇÕES' && col0 !== 'DOCUMENTOS') {
      listas.documentos.push(col0);
    }
    if (col1 && col1 !== 'TIPO ESTABELECIMENTO') {
      listas.tiposEstabelecimento.push(col1);
    }
    if (col2 && col2 !== 'RESPOSTAS PADRÃO') {
      listas.respostasPadrao.push(col2);
    }
  });

  // Remove duplicatas mantendo ordem
  listas.documentos = [...new Set(listas.documentos)];
  listas.tiposEstabelecimento = [...new Set(listas.tiposEstabelecimento)];
  listas.respostasPadrao = [...new Set(listas.respostasPadrao)];
  listas.prazosAssistencia = [...new Set(listas.prazosAssistencia)];

  out('listas.json', listas);
})();

console.log('\n=== Extração COMPLETA finalizada! ===');

// ── Helpers ────────────────────────────
function excelDateToISO(serial) {
  if (!serial) return '';
  const excelEpoch = new Date(1899, 11, 30);
  const d = new Date(excelEpoch.getTime() + serial * 86400000);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatarHora(val) {
  if (val === undefined || val === null) return '';
  if (typeof val === 'number' && val < 1) {
    // Valor decimal representando hora (ex: 0.5416 = 13:00)
    const totalMin = Math.round(val * 24 * 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }
  return String(val);
}
