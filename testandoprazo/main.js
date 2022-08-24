// adicionar uma data
// calcular o prazo da data
// se o checkbox estiver marcado concede 30 dias de prazo, caso contrario é autuar
let marcado = document.getElementById('prazo');
if(marcado.checked){
    let dataBaixa = document.getElementById('dataBaixa');
    let novoPrazo = document.getElementById('Lauro');
    novoPrazo.innerHTML = `<h1>Lauro</h1>`;
} else {
    novoPrazo.innerHTML = null;
}

