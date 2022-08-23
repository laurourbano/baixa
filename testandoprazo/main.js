// adicionar uma data
// calcular o prazo da data
// se o checkbox estiver marcado concede 30 dias de prazo, caso contrario é autuar
const temprazo = () =>{
    let marcado = document.getElementById('prazo');
    marcado.addEventListener('click', function(){marcado.innerHTML = data + 30});
    ;
};
const msg = '30 dias';
const paragrafo = document.getElementById('Lauro');
paragrafo.innerHTML = msg;