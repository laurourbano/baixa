/**
 * analisar-planilhas.js — Analisa planilhas A. Atualizador
 */
var XLSX = require('xlsx');
var path = require('path');
var fs = require('fs');

var dir = 'assets/planilhas';
var files = fs.readdirSync(dir).filter(function (f) {
  return f.endsWith('.xlsx') || f.endsWith('.ods');
});

files.forEach(function (f) {
  var fp = path.join(dir, f);
  console.log('\n========================================');
  console.log('ARQUIVO: ' + f);
  console.log('========================================');
  try {
    var wb = XLSX.readFile(fp);
    console.log('Abas: ' + wb.SheetNames.join(', '));
    wb.SheetNames.forEach(function (sn) {
      var ws = wb.Sheets[sn];
      var json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      console.log('\n--- Aba: ' + sn + ' (' + json.length + ' linhas) ---');
      // Mostra primeiras linhas
      for (var i = 0; i < Math.min(5, json.length); i++) {
        var row = json[i].filter(function (c) { return c !== ''; });
        if (row.length > 0) {
          console.log('  L' + i + ': ' + JSON.stringify(row).substring(0, 300));
        }
      }
      if (json.length > 5) {
        console.log('  ... mais ' + (json.length - 5) + ' linhas');
      }
    });
  } catch (e) {
    console.log('Erro: ' + e.message);
  }
});
