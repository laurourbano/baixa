/**
 * gerar-piso-regioes.js — Gera piso.json estruturado por regiões
 * Baseado nos dados do defaultPisoData() do consultas.js
 * + cidades-parana.json para agrupamento regional
 *
 * Formato de saída compatível com initPiso():
 * {
 *   regioes: {
 *     "Nome da Região": {
 *       _actVigente: true/false,
 *       _ultimaCCT: "2026-2027",
 *       _fonte: "https://sindifar-pr.org.br/...",
 *       cidades: {
 *         "nome_cidade": { varejista, hospitalar, distribuidora, laboratorios, industrias }
 *       }
 *     }
 *   }
 * }
 */

const fs = require('fs');
const path = require('path');

// Dados base de piso (valores de referência — devem ser atualizados
// com dados reais das CCTs do sindifar-pr.org.br)
const regioes = {
  "Curitiba e RMC": {
    _actVigente: true,
    _ultimaCCT: "2025-2026",
    _fonte: "https://sindifar-pr.org.br/negociacoes-coletivas/",
    valores: { varejista: 4729.62, hospitalar: 4567.00, distribuidora: 4764.00, laboratorios: 3763.08, industrias: 4211.45 }
  },
  "Londrina e Norte Central": {
    _actVigente: true,
    _ultimaCCT: "2025-2026",
    _fonte: "https://sindifar-pr.org.br/negociacoes-coletivas/",
    valores: { varejista: 3950.00, hospitalar: 4100.00, distribuidora: 4200.00, laboratorios: 3400.00, industrias: 3800.00 }
  },
  "Maringá e Noroeste": {
    _actVigente: true,
    _ultimaCCT: "2025-2026",
    _fonte: "https://sindifar-pr.org.br/negociacoes-coletivas/",
    valores: { varejista: 4200.00, hospitalar: 4300.00, distribuidora: 4400.00, laboratorios: 3500.00, industrias: 3900.00 }
  },
  "Ponta Grossa e Campos Gerais": {
    _actVigente: true,
    _ultimaCCT: "2025-2026",
    _fonte: "https://sindifar-pr.org.br/negociacoes-coletivas/",
    valores: { varejista: 3850.00, hospitalar: 4000.00, distribuidora: 4100.00, laboratorios: 3200.00, industrias: 3700.00 }
  },
  "Cascavel e Oeste": {
    _actVigente: true,
    _ultimaCCT: "2025-2026",
    _fonte: "https://sindifar-pr.org.br/negociacoes-coletivas/",
    valores: { varejista: 4000.00, hospitalar: 4150.00, distribuidora: 4250.00, laboratorios: 3300.00, industrias: 3750.00 }
  },
  "Francisco Beltrão e Sudoeste": {
    _actVigente: true,
    _ultimaCCT: "2025-2026",
    _fonte: "https://sindifar-pr.org.br/negociacoes-coletivas/",
    valores: { varejista: 3800.00, hospitalar: 3900.00, distribuidora: 4000.00, laboratorios: 3100.00, industrias: 3600.00 }
  },
  "Guarapuava e Centro-Sul": {
    _actVigente: true,
    _ultimaCCT: "2025-2026",
    _fonte: "https://sindifar-pr.org.br/negociacoes-coletivas/",
    valores: { varejista: 3700.00, hospitalar: 3850.00, distribuidora: 3950.00, laboratorios: 3000.00, industrias: 3500.00 }
  },
  "Jacarezinho e Norte Pioneiro": {
    _actVigente: false,
    _ultimaCCT: "2024-2025",
    _fonte: "https://sindifar-pr.org.br/negociacoes-coletivas/",
    valores: { varejista: 3500.00, hospitalar: 3650.00, distribuidora: 3750.00, laboratorios: 2900.00, industrias: 3400.00 }
  },
  "União da Vitória e Sul": {
    _actVigente: false,
    _ultimaCCT: "2024-2025",
    _fonte: "https://sindifar-pr.org.br/negociacoes-coletivas/",
    valores: { varejista: 3400.00, hospitalar: 3550.00, distribuidora: 3650.00, laboratorios: 2800.00, industrias: 3300.00 }
  },
  "Litoral": {
    _actVigente: false,
    _ultimaCCT: "2024-2025",
    _fonte: "https://sindifar-pr.org.br/negociacoes-coletivas/",
    valores: { varejista: 3600.00, hospitalar: 3750.00, distribuidora: 3850.00, laboratorios: 3000.00, industrias: 3500.00 }
  },
  "Irati e Sudeste": {
    _actVigente: false,
    _ultimaCCT: "2024-2025",
    _fonte: "https://sindifar-pr.org.br/negociacoes-coletivas/",
    valores: { varejista: 3500.00, hospitalar: 3650.00, distribuidora: 3750.00, laboratorios: 2900.00, industrias: 3400.00 }
  },
  "Paranaguá e Litoral": {
    _actVigente: false,
    _ultimaCCT: "2024-2025",
    _fonte: "https://sindifar-pr.org.br/negociacoes-coletivas/",
    valores: { varejista: 3600.00, hospitalar: 3750.00, distribuidora: 3850.00, laboratorios: 3000.00, industrias: 3500.00 }
  }
};

// Carrega cidades do JSON gerado
const cidadesData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'cidades-parana.json'), 'utf-8'));

// Agrupa cidades por região
const cidadesPorRegiao = {};
cidadesData.cidades.forEach(function (c) {
  if (!cidadesPorRegiao[c.regiao]) cidadesPorRegiao[c.regiao] = {};
  cidadesPorRegiao[c.regiao][c.cidade] = null; // placeholder para valores
});

// Monta estrutura final
const pisoFinal = { regioes: {} };

Object.keys(regioes).forEach(function (regiaoNome) {
  var regData = regioes[regiaoNome];
  var cidades = {};

  // Popula cidades da região com os valores base
  var cidadesNaRegiao = cidadesPorRegiao[regiaoNome] || {};
  Object.keys(cidadesNaRegiao).forEach(function (cidadeKey) {
    cidades[cidadeKey] = Object.assign({}, regData.valores);
  });

  // Se não tem cidades mapeadas, usa ao menos a cidade principal
  if (Object.keys(cidades).length === 0) {
    var cidadePrincipal = regiaoNome.split(' e ')[0].toLowerCase()
      .replace(/[áàâã]/g, 'a').replace(/[éê]/g, 'e').replace(/[í]/g, 'i')
      .replace(/[óôõ]/g, 'o').replace(/[ú]/g, 'u').replace(/[ç]/g, 'c')
      .replace(/\s+/g, '_');
    cidades[cidadePrincipal] = Object.assign({}, regData.valores);
  }

  pisoFinal.regioes[regiaoNome] = {
    _actVigente: regData._actVigente,
    _ultimaCCT: regData._ultimaCCT,
    _fonte: regData._fonte,
    cidades: cidades
  };
});

// Adiciona dados flat para compatibilidade (curitiba e default)
var primeiraRegiao = Object.keys(pisoFinal.regioes)[0];
var primeiraCidade = Object.keys(pisoFinal.regioes[primeiraRegiao].cidades)[0];
var valoresRef = pisoFinal.regioes[primeiraRegiao].cidades[primeiraCidade] ||
  { varejista: 4729.62, hospitalar: 4567, distribuidora: 4764, laboratorios: 3763.08, industrias: 4211.45 };

pisoFinal.curitiba = valoresRef;
pisoFinal.default = valoresRef;
pisoFinal.horasSemana = 44;
pisoFinal.valorHora = {};
pisoFinal.proporcional10h = {};
['varejista', 'hospitalar', 'distribuidora', 'laboratorios', 'industrias'].forEach(function (cat) {
  pisoFinal.valorHora[cat] = parseFloat((valoresRef[cat] / 220).toFixed(2));
  pisoFinal.proporcional10h[cat] = parseFloat((valoresRef[cat] * 10 / 44).toFixed(2));
});

const outPath = path.join(__dirname, '..', 'assets', 'piso.json');
fs.writeFileSync(outPath, JSON.stringify(pisoFinal, null, 2));
console.log('piso.json gerado com ' + Object.keys(pisoFinal.regioes).length + ' regiões e ' +
  Object.values(pisoFinal.regioes).reduce(function (sum, r) { return sum + Object.keys(r.cidades).length; }, 0) + ' cidades.');
