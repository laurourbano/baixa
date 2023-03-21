/* MINHA PRIMEIRA VERSÃO */

/*//cria uma função que inicia no carregamento da janela
window.onload = function () {
    //cria um array relacionado a todos os itens com a classe .botao
    let botaoCopiar = Array.prototype.slice.call(document.querySelectorAll('.botao'));
    //cria um array relacionados a todos os itens com a classe .area
    let caixaTexto = Array.prototype.slice.call(document.querySelectorAll('.area'));
    //cria a funcao copiar texto da textarea com classe .area ao clicar no botao com classe .botao
    botaoCopiar.forEach(function (botao, texto) {
        //cria o evento de click e associa a funcao que copia o correspondente ao .botao[i] ao .area[i]
        botao.addEventListener('click', function () {
            //seleciona o texto no item da caixa de texto que correspondente à mesma posição do botao no array
            caixaTexto[texto].select();
            //verifica se funcionou ou deu erro através de um if ternário
            let mensagem = document.execCommand('copy') ? 'funcionou' : 'deu erro';
            //imprime o resultado no console para verificação
            console.log('executando para copiar texto ' + mensagem);
        });
    });
}*/

/* VERSÃO SIMPLIFICADA */
// Quando a página terminar de carregar
window.onload = function () {
    // Crie arrays de todos os elementos com as classes .botao e .area
    let botoes = Array.from(document.querySelectorAll('.botao'));
    let caixasTexto = Array.from(document.querySelectorAll('.area'));
    
    // Para cada botão, adicione um evento de clique
    botoes.forEach(function (botao, indice) {
        botao.addEventListener('click', function () {
            // Selecione o texto correspondente à caixa de texto do botão clicado
            caixasTexto[indice].select();
            // Tente copiar o texto selecionado e imprima o resultado no console
            let mensagem = document.execCommand('copy') ? 'funcionou' : 'deu erro';
            console.log('Cópia de texto ' + mensagem);
        });
    });
}