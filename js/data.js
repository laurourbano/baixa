
let data = document.querySelector(".data");
let dia = new Date().getDate();
  if(dia<10){dia='0'+dia};
let mes = new Date().getMonth() + 1;
  if(mes<10){mes='0'+mes};
let ano = new Date().getFullYear();
let diaAnterior = dia - 1;
let dataAtual = ano+"_"+mes+"_"+diaAnterior;
data.innerHTML = `Baixa de RT Web_${dataAtual}` ;

let dataFormatada = document.querySelector(".dataFormatada");
let dataNova = dia+"/"+mes+"/"+ano;
dataFormatada.innerHTML += `${dataNova}`;

let diaIndeferir = dia - 2;
let dataIndeferimento = document.querySelector(".dataIndeferimento");
let dataAtual1 = diaIndeferir+"/"+mes+"/"+ano;
dataIndeferimento.innerHTML = (`INDEFERIDO REQUERIMENTO DE BAIXA.
DOCUMENTOS SOLICITADOS PARA CORREÇÃO DO PROCEDIMENTO DE BAIXA DE RT NÃO FORAM ENVIADOS NO PRAZO DE 01 
(UM) DIA ÚTIL DA RESPOSTA DO CRF-PR.
* DEVERÁ INICIAR NOVO REQUERIMENTO DE BAIXA DE RESPONSABILIDADE TÉCNICA, ANEXANDO TODOS OS DOCUMENTOS NECESSÁRIOS.
FAVOR CONSULTAR PASSO A PASSO NO LINK https://crf-pr.org.br/servico/visualizar/id/84

DATA DA SOLICITAÇÃO – ${dataAtual1}

MOTIVO DO INDEFERIMENTO:
– FALTOU QUEBRA DE VÍNCULO DE TRABALHO; (PÁGINA DA CTPS DO CONTRATO COM DATA DE SAÍDA E ASSINATURA DA 
EMPRESA OU RESCISÃO COM ASSINATURA DA EMPRESA E DO PROFISSIONAL);
– FALTOU APRESENTAR A CTPS COM ANOTAÇÃO/DECLARAÇÃO DA TRANSFERÊNCIA, INDICANDO A DATA DA TRANSFERÊNCIA E O CNPJ PARA ONDE FOI TRANSFERIDO; (DOCUMENTO ASSINADO PELA EMPRESA)

– FALTOU DECLARAÇÃO DE BAIXA DA VIGILÂNCIA SANITÁRIA
(OU MINISTÉRIO DA AGRICULTURA E PECUÁRIA, EM CASO DE MANIPULAÇÃO DE PRODUTOS VETERINÁRIOS);


OU
- CASO AINDA NÃO POSSUA TODOS OS DOCUMENTOS, PODERÁ APRESENTAR  FORMULÁRIO DE REQUERIMENTO PREENCHIDO 
E ASSINADO *PELO REPRESENTANTE LEGAL E PELO PROFISSIONAL*
(MARCANDO TODOS OS DOCUMENTOS QUE FALTAM E O MOTIVO).

- FALTA ASSINATURA, DO REPRESENTANTE LEGAL, NO REQUERIMENTO DE BAIXA PARA BAIXAR SEM DOCUMENTOS;`);

  let input = document.querySelector('#data');
  let prazo = document.querySelector('.prazo');
  input.valueAsDate = new Date('YYYY-MM-DD');

  input.addEventListener('input', () => {
    let input1 = input.value.split("/");
    let hj1 = input1[2]+"-"+input1[1]+"-"+input1[0];
    let inputat = new Date(hj1);
    inputat.setDate(inputat.getDate());
    let myDate = new Date(hj1);
    myDate.setDate(myDate.getDate() + 30);
    let ano2 = myDate.getFullYear();
    let dia2 = myDate.getDate();
      if(dia2<10){dia2='0'+dia2};
    let mes2 = (myDate.getMonth()+1);
      if(mes2<10){mes2='0'+mes2};
    let dataNoHtml = (("30 dias em: " + dia2 + "/" + mes2 + "/" + ano2));
    prazo.innerHTML = (dataNoHtml);
  });  

  let sessenta = document.querySelector('.sessenta');

  input.addEventListener('input', () => {
    let input1 = input.value.split("/");
    let hj1 = input1[2]+"-"+input1[1]+"-"+input1[0];
    let inputat = new Date(hj1);
    inputat.setDate(inputat.getDate());
    let myDate = new Date(hj1);
    myDate.setDate(myDate.getDate() + 60);
    let ano2 = myDate.getFullYear();
    let dia2 = myDate.getDate();
      if(dia2<10){dia2='0'+dia2};
    let mes2 = (myDate.getMonth()+1);
      if(mes2<10){mes2='0'+mes2};
    let dataNoHtml1 = (("60 dias em: " + dia2 + "/" + mes2 + "/" + ano2));
    sessenta.innerHTML = (dataNoHtml1);
  });

  let noventa = document.querySelector('.noventa');

  input.addEventListener('input', () => {
    let input1 = input.value.split("/");
    let hj1 = input1[2]+"-"+input1[1]+"-"+input1[0];
    let inputat = new Date(hj1);
    inputat.setDate(inputat.getDate());
    let myDate = new Date(hj1);
    myDate.setDate(myDate.getDate() + 90);
    let ano2 = myDate.getFullYear();
    let dia2 = myDate.getDate();
      if(dia2<10){dia2='0'+dia2};
    let mes2 = (myDate.getMonth()+1);
      if(mes2<10){mes2='0'+mes2};
    let dataNoHtml2 = (("90 dias em: " + dia2 + "/" + mes2 + "/" + ano2));
    noventa.innerHTML = (dataNoHtml2);
  });
  
  let centoevinte = document.querySelector('.centoevinte');

  input.addEventListener('input', () => {
    let input1 = input.value.split("/");
    let hj1 = input1[2]+"-"+input1[1]+"-"+input1[0];
    let inputat = new Date(hj1);
    inputat.setDate(inputat.getDate());
    let myDate = new Date(hj1);
    myDate.setDate(myDate.getDate() + 120);
    let ano2 = myDate.getFullYear();
    let dia2 = myDate.getDate();
      if(dia2<10){dia2='0'+dia2};
    let mes2 = (myDate.getMonth()+1);
      if(mes2<10){mes2='0'+mes2};
    let dataNoHtml3 = (("120 dias em: " + dia2 + "/" + mes2 + "/" + ano2));
    centoevinte.innerHTML = (dataNoHtml3);
  });  
  
  let centoesessenta = document.querySelector('.centoesessenta');

  input.addEventListener('input', () => {
    let input1 = input.value.split("/");
    let hj1 = input1[2]+"-"+input1[1]+"-"+input1[0];
    let inputat = new Date(hj1);
    inputat.setDate(inputat.getDate());
    let myDate = new Date(hj1);
    myDate.setDate(myDate.getDate() + 160);
    let ano2 = myDate.getFullYear();
    let dia2 = myDate.getDate();
      if(dia2<10){dia2='0'+dia2};
    let mes2 = (myDate.getMonth()+1);
      if(mes2<10){mes2='0'+mes2};
    let dataNoHtml4 = (("160 dias em: " + dia2 + "/" + mes2 + "/" + ano2));
    centoesessenta.innerHTML = (dataNoHtml4);
  });