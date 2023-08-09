let data = document.querySelector(".data");
let dia = new Date().getDate();
let mes = new Date().getMonth() + 1;
let ano = new Date().getFullYear();

Object.keys(window).forEach(function (key) {
  if (key.includes("dia") || key.includes("mes")) {
    let value = window[key];
    if (typeof value === "number" && value < 10) {
      window[key] = value.toString().padStart(2, "0");
    }
  }
});

function calcularData(input, dias) {
  let input1 = input.value.split("/");
  let hj1 = input1[2] + "-" + input1[1] + "-" + input1[0];
  let inputat = new Date(hj1);
  inputat.setDate(inputat.getDate());
  let myDate = new Date(hj1);
  myDate.setDate(myDate.getDate() + dias);
  let ano2 = myDate.getFullYear();
  let dia2 = myDate.getDate().toString().padStart(2, "0");
  let mes2 = (myDate.getMonth() + 1).toString().padStart(2, "0");
  return dia2 + "/" + mes2 + "/" + ano2;
}

let diaAnterior = dia - 1;

if (diaAnterior <= 0) {
  if (mes === 0) {
    mes = 12;
    ano = ano - 1;
  }
  diaAnterior = new Date(ano, mes, 0).getDate();
}

let dataAtual = ano + "_" + mes.toString().padStart(2, "0") + "_" + dia.toString().padStart(2, "0");
data.innerHTML = `Baixa de RT Web_${dataAtual}`;

let dataFormatada = document.querySelector(".dataFormatada");
let dataNova = dia.toString().padStart(2, "0") + "/" + mes.toString().padStart(2, "0") + "/" + ano;
dataFormatada.innerHTML += `${dataNova}`;

let diaIndeferir = dia - 2;
let dataIndeferimento = document.querySelector(".dataIndeferimento");
let dataAtual1 = diaIndeferir.toString().padStart(2, "0") + "/" + mes.toString().padStart(2, "0") + "/" + ano;

if (diaIndeferir <= 0) {
  mes = mes - 1;
  if (mes === 0) {
    mes = 12;
    ano = ano - 1;
  }
  diaIndeferir = new Date(ano, mes, 0).getDate() + diaIndeferir;
  dataAtual1 = diaIndeferir.toString().padStart(2, "0") + "/" + mes.toString().padStart(2, "0") + "/" + ano;
}

dataIndeferimento.innerHTML = (`INDEFERIDO REQUERIMENTO DE BAIXA.
DOCUMENTOS SOLICITADOS PARA CORREÇÃO DO PROCEDIMENTO DE BAIXA DE RT NÃO FORAM ENVIADOS.
* DEVERÁ INICIAR NOVO REQUERIMENTO DE BAIXA DE RESPONSABILIDADE TÉCNICA, ANEXANDO TODOS OS DOCUMENTOS NECESSÁRIOS.
FAVOR CONSULTAR PASSO A PASSO NO LINK https://crf-pr.org.br/servico/visualizar/id/84

MOTIVO DO INDEFERIMENTO:
– FALTOU QUEBRA DE VÍNCULO DE TRABALHO; (PÁGINA DA CTPS DO CONTRATO COM DATA DE SAÍDA E ASSINATURA DA EMPRESA OU RESCISÃO COM ASSINATURA DA EMPRESA E DO PROFISSIONAL);
– FALTOU APRESENTAR A CTPS COM ANOTAÇÃO/DECLARAÇÃO DA TRANSFERÊNCIA, INDICANDO A DATA DA TRANSFERÊNCIA E O CNPJ PARA ONDE FOI TRANSFERIDO; (DOCUMENTO ASSINADO PELA EMPRESA)

– FALTOU DECLARAÇÃO DE BAIXA DA VIGILÂNCIA SANITÁRIA;

OU
- CASO AINDA NÃO POSSUA TODOS OS DOCUMENTOS, PODERÁ APRESENTAR  FORMULÁRIO DE REQUERIMENTO PREENCHIDO E ASSINADO *PELO REPRESENTANTE LEGAL E PELO PROFISSIONAL* (MARCANDO TODOS OS DOCUMENTOS QUE FALTAM E O MOTIVO).

- FALTA ASSINATURA, DO REPRESENTANTE LEGAL, NO REQUERIMENTO DE BAIXA PARA BAIXAR SEM DOCUMENTOS;`);

// selecione o elemento input de data e os parágrafos de prazo correspondentes
// const dataInput = document.getElementById("data");
// const prazos = document.querySelectorAll(".prazo, .sessenta, .noventa, .centoevinte, .centoeoitenta");

// // crie uma função para calcular as datas de prazo a partir da data inserida
// function calcularPrazos() {
//   // obtenha a data inserida no formato do Moment.js
//   const data = moment(dataInput.value, "YYYY-MM-DD");
  
//   // atualize o conteúdo dos parágrafos correspondentes com as datas de prazo calculadas
//   prazos.forEach((prazo) => {
//     const dias = Number(prazo.classList[0].match(/\d+/)[0]);
//     const prazoData = data.clone().add(dias, "days").format("DD/MM/YYYY");
//     prazo.textContent = `Prazo ${dias} dias: ${prazoData}`;
//   });
// }

// // chame a função para calcular as datas de prazo assim que a página for carregada
// calcularPrazos();

// // adicione um evento change ao input de data
// dataInput.addEventListener("change", calcularPrazos);

// // adicione um evento input ao input de data
// dataInput.addEventListener("input", calcularPrazos);

// // adicione um evento input ao input de data
// dataInput.addEventListener("click", calcularPrazos);