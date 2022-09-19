const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.json({mensagem:'Olá, Mundo!'});
});

/*

outra maneira de escrever o mesmo código:
(mais utilizada)

app.get('/', (req, res) => {
    let mensagem = {mensagem:'Olá, Mundo!'};
    res.json(mensagem);
});

*/

app.listen(8080,() => {
    let data = new Date();
    console.log(`Servidor node iniciado em: ${data}`);
});
