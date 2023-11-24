let quantidadeHoras; // Declare a variável fora da função

const pisoSalario = document.getElementById("valorPisoSalarial");
const quantidadeHorasInput = document.getElementById("quantidadeHoras");
const resultado = document.getElementById("resultado");
const valorPorHora = document.getElementById("valorPorHora");

resultado.innerHTML = 0;
valorPorHora.innerHTML = 0;

quantidadeHorasInput.addEventListener("change", () => {
  quantidadeHoras = parseInt(quantidadeHorasInput.value);
  calcularSalario();
});

function calcularSalario() {
  let valorPiso = 0;
  // Captura o valor do piso salarial
  valorPiso = parseFloat(pisoSalario.value);

  // Calcula o valor do salário
  const valorSalario = valorPiso * quantidadeHoras / 44;

  // Insere o resultado no span de id resultado
  resultado.textContent = valorSalario.toFixed(2);

  // Calcula o valor do salário por hora
  let pisoPorHora = 0;
  pisoPorHora = valorPiso / 220;

  // Insere o resultado no span de id valorPorHora
  valorPorHora.textContent = pisoPorHora.toFixed(2);
}
