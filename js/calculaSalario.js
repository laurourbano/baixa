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
