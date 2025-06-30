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
    const aba = workbook.Sheets[nomeAba];
    const json = XLSX.utils.sheet_to_json(aba, { header: 1 });

    json.forEach((linha) => {
      if (!linha || linha.length < 4) return;
      if (linha.some(cell => typeof cell === "string" && /cidade|região|fiscal|código/i.test(cell))) return;

      const cidadeCell = linha[0];
      const codigoFiscalCell = linha[1];
      const nomeFiscalCell = linha[2];
      const regiaoCell = linha[3];

      if (
        typeof cidadeCell === 'string' &&
        typeof nomeFiscalCell === 'string' &&
        (typeof codigoFiscalCell === 'string' || typeof codigoFiscalCell === 'number')
      ) {
        dadosFinais.push({
          cidadeOriginal: cidadeCell.trim(),
          cidade: cidadeCell.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
          fiscal: nomeFiscalCell.trim(),
          codigo: codigoFiscalCell.toString().trim(),
          regiao: regiaoCell ? regiaoCell.toString().trim() : "Não informada"
        });
      }
    });
  });

  document.getElementById("cidadeInput1").disabled = false;
  document.getElementById("resultado1").textContent = "Digite o nome da cidade acima.";
}

fetch("assets/dados.ods")
  .then(response => {
    if (!response.ok) throw new Error("Erro ao carregar o arquivo");
    return response.arrayBuffer();
  })
  .then(data => {
    const workbook = XLSX.read(data, { type: "array" });
    processarPlanilha(workbook);
  })
  .catch(error => {
    console.error("Erro ao carregar o arquivo:", error);
    document.getElementById("resultado1").textContent = "Erro ao carregar a planilha.";
  });

document.getElementById("cidadeInput1").addEventListener("input", function () {
  const valor = this.value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const resultado = dadosFinais.find(item => item.cidade === valor);
  const divResultado = document.getElementById("resultado1");

  if (resultado) {
    divResultado.textContent =
      `Cidade: ${resultado.cidadeOriginal} | Fiscal: ${resultado.fiscal} | Código: ${resultado.codigo} | Região: ${resultado.regiao}`;
  } else {
    divResultado.textContent = "Cidade não encontrada.";
  }
});
