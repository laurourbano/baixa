// --------------------- CÁLCULO DE SALÁRIO ---------------------
const pisoSalario = document.getElementById("valorPisoSalarial");
const quantidadeHorasInput = document.getElementById("quantidadeHoras");
const resultadoSalarioSpan = document.getElementById("resultado");
const valorPorHoraSpan = document.getElementById("valorPorHora");

resultadoSalarioSpan.textContent = 0;
valorPorHoraSpan.textContent = 0;

pisoSalario.addEventListener("change", calcularSalario);
quantidadeHorasInput.addEventListener("change", calcularSalario);

function calcularSalario() {
  const valorPiso = parseFloat(pisoSalario.value);
  const quantidadeHoras = parseFloat(quantidadeHorasInput.value);

  const salario = (valorPiso * quantidadeHoras) / 44;   // 44 h semanais
  const pisoHora = valorPiso / 220;                       // 220 h mensais

  resultadoSalarioSpan.textContent = isNaN(salario) ? 0 : salario.toFixed(2);
  valorPorHoraSpan.textContent = isNaN(pisoHora) ? 0 : pisoHora.toFixed(2);
}

// ------------------------ BUSCA DE FISCAIS ------------------------
let dadosFinais = [];

const inputCidadeTexto = document.getElementById("cidadeInput1");
const selectCidade = document.getElementById("cidadeInput2");
const resultadoTextoDiv = document.getElementById("resultado1");
const resultadoSelectDiv = document.getElementById("resultado2");

// Eventos de interface
inputCidadeTexto.addEventListener("input", buscarPorTexto);
selectCidade.addEventListener("change", buscarPorSelect);

function buscarPorTexto() {
  const chave = normalizar(this.value);
  const info = dadosFinais.find(obj => obj.cidade === chave);

  resultadoTextoDiv.textContent = info
    ? `Cidade: ${info.cidadeOriginal} | Código do Fiscal: ${info.codigo} | Região: ${info.regiao}`
    : "Cidade não encontrada.";
}

function buscarPorSelect() {
  const info = dadosFinais.find(obj => obj.cidade === this.value);

  resultadoSelectDiv.textContent = info
    ? `Cidade: ${info.cidadeOriginal} | Código do Fiscal: ${info.codigo} | Região: ${info.regiao}`
    : "Cidade não encontrada.";
}

// Carrega planilha .ods
fetch("assets/dados.ods")
  .then(res => {
    if (!res.ok) throw new Error("Erro ao carregar o arquivo");
    return res.arrayBuffer();
  })
  .then(buffer => {
    const workbook = XLSX.read(buffer, { type: "array" });
    processarPlanilha(workbook);
  })
  .catch(err => {
    console.error(err);
    resultadoTextoDiv.textContent = "Erro ao carregar a planilha.";
  });

function processarPlanilha(workbook) {
  dadosFinais.length = 0;

  workbook.SheetNames.forEach(sheetName => {
    const aba = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(aba, { header: 1 });

    json.forEach(linha => {
      if (!linha || linha.length < 4) return;
      if (linha.some(cell => typeof cell === "string" && /cidade|fiscal|região|código/i.test(cell))) return;

      const [cidadeCell, fiscalCell, regiaoCell, codigoCell] = linha;

      if (typeof cidadeCell === "string" && typeof fiscalCell === "string" && (typeof codigoCell === "string" || typeof codigoCell === "number")) {
        dadosFinais.push({
          cidadeOriginal: cidadeCell.trim(),
          cidade: normalizar(cidadeCell),
          fiscal: fiscalCell.trim(),
          regiao: regiaoCell ? regiaoCell.toString().trim() : "Não informada",
          codigo: codigoCell.toString().trim()
        });
      }
    });
  });

  popularSelectCidades();
  inputCidadeTexto.disabled = false;
  resultadoTextoDiv.textContent = "Digite o nome da cidade acima.";
}

function popularSelectCidades() {
  selectCidade.disabled = false;
  resultadoSelectDiv.textContent = "Selecione uma cidade.";
  selectCidade.innerHTML = '<option value="" disabled selected hidden>Selecione uma cidade</option>';

  const cidadesUnicas = [...new Map(dadosFinais.map(obj => [obj.cidade, obj])).values()]
    .sort((a, b) => a.cidadeOriginal.localeCompare(b.cidadeOriginal, "pt-BR"));

  cidadesUnicas.forEach(({ cidade, cidadeOriginal }) => {
    const opt = document.createElement("option");
    opt.value = cidade;
    opt.textContent = cidadeOriginal;
    selectCidade.appendChild(opt);
  });
}

function normalizar(texto) {
  return texto.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
