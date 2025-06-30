let quantidadeHoras = 0; // Declare a variável fora da função
let pisoPorHora = 0;
let valorSalario = 0;
let valorPiso = 0;

const pisoSalario = document.getElementById("valorPisoSalarial");
const quantidadeHorasInput = document.getElementById("quantidadeHoras");
const resultado = document.getElementById("resultado");
const valorPorHora = document.getElementById("valorPorHora");

resultado.innerHTML = 0;
valorPorHora.innerHTML = 0;

quantidadeHorasInput.addEventListener("change", () => {
  quantidadeHoras = parseFloat(quantidadeHorasInput.value);
  calcularSalario();
});

function calcularSalario() {

  let valorPiso = 0;
  let pisoPorHora = 0;

  // Captura o valor do piso salarial
  valorPiso = parseFloat(pisoSalario.value);

  // Calcula o valor do salário
  const valorSalario = parseFloat(valorPiso * quantidadeHoras / 44);

  // Insere o resultado no span de id resultado
  resultado.textContent = valorSalario.toFixed(2);
  if (isNaN(valorSalario)) {
    resultado.textContent = 0;
  }

  // Calcula o valor do salário por hora
  pisoPorHora = parseFloat(valorPiso / 220);

  // Insere o resultado no span de id valorPorHora
  valorPorHora.textContent = pisoPorHora.toFixed(2);
  if (isNaN(pisoPorHora)) {
    valorPorHora.textContent = 0;
  }

}

let dadosFinais = [];

function processarPlanilha(workbook) {
  dadosFinais = [];

  workbook.SheetNames.forEach(nomeAba => {
    console.log(`Processando aba: ${nomeAba}`);
    const aba = workbook.Sheets[nomeAba];
    const json = XLSX.utils.sheet_to_json(aba, { header: 1 });
    console.log(`Linhas processadas: ${json.length}`);
    console.log(json);

    json.forEach(linha => {
      // Filtragem de cidades
      let cidades = linha.filter(cell =>
        typeof cell === 'string' &&
        /^[A-ZÀ-Úa-zà-ú\s\-]{3,}$/.test(cell.trim()) &&
        !/Fiscal|Região|Valor|ID|TOLEDO/i.test(cell) // Adicione outras palavras genéricas para evitar
      );

      // --- Início da Extração do Fiscal (mantido das últimas correções) ---
      let fiscal = null;
      // Tentativa 1: Pegar o fiscal da coluna que você sabe que ele pode estar (ex: índice 1 ou 5)
      // Ajuste os índices conforme a estrutura da sua planilha
      if (typeof linha[1] === 'string' && /^[A-ZÀ-Úa-zà-ú\s\-]{2,}$/.test(linha[1].trim())) {
        fiscal = linha[1].trim();
      } else if (typeof linha[5] === 'string' && /^[A-ZÀ-Úa-zà-ú\s\-]{2,}$/.test(linha[5].trim())) {
        fiscal = linha[5].trim();
      }

      // Se as tentativas por índice não funcionarem, tente a abordagem anterior (filtrar e pegar o último)
      // com uma regex mais robusta para nomes.
      if (!fiscal) {
        let fiscaisEncontradosNaLinha = linha.filter(cell =>
          typeof cell === 'string' &&
          /^[A-ZÀ-Ú]{2,}(\s[A-ZÀ-Ú]{2,})*\b|^[A-ZÀ-Ú][a-zà-ú]{1,}(\s[A-ZÀ-Ú][a-zà-ú]{1,})*\b/.test(cell.trim())
        );
        fiscal = fiscaisEncontradosNaLinha[fiscaisEncontradosNaLinha.length - 1] || null;
      }
      // --- Fim da Extração do Fiscal ---

      // --- Nova Parte: Extração da Região da Célula (Índice 2) ---
      let regiaoEncontrada = null;
      if (typeof linha[2] === 'string' && linha[2].trim().length > 0) {
        regiaoEncontrada = linha[2].trim();
      }

      let codigoFiscalEncontrado = null;
      if (linha[3] !== undefined && linha[3] !== null && String(linha[3]).trim().length > 0) {
        codigoFiscalEncontrado = String(linha[3]).trim();
      }
      // --- Fim da Nova Parte ---

      cidades.forEach(cidade => {
        dadosFinais.push({
          cidade: cidade.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
          fiscal: fiscal ? fiscal.trim() : null,
          regiao: regiaoEncontrada || nomeAba, // Usa a região encontrada na célula, senão, o nome da aba
          codigoFiscal: codigoFiscalEncontrado || null
        });
      });
    });
  });

  document.getElementById("cidadeInput1").disabled = false;
}

// O restante do código (event listeners) permanece o mesmo.
document.getElementById("fileInput1").addEventListener("change", function (e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" }); // Suporta .xlsx e .ods
    processarPlanilha(workbook);
  };
  reader.readAsArrayBuffer(file);
});

document.getElementById("cidadeInput1").addEventListener("input", function () {
  const valor = this.value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const resultado = dadosFinais.find(item => item.cidade === valor);
  const divResultado = document.getElementById("resultado1");

  if (resultado) {
    divResultado.textContent = `Fiscal: ${resultado.fiscal || "Não identificado"} | Região: ${resultado.regiao} | Código Fiscal: ${resultado.codigoFiscal || "N/A"}`;
  } else {
    divResultado.textContent = "Cidade não encontrada.";
  }
});
