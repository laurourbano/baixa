let quantidadeHoras; // Declare a variável fora da função

const pisoSalario = document.getElementById("valorPisoSalarial");
const quantidadeHorasInput = document.getElementById("quantidadeHoras");
const resultado = document.getElementById("resultado");
const valorPorHora = document.getElementById("valorPorHora");

quantidadeHorasInput.addEventListener("change", () => {
  quantidadeHoras = parseInt(quantidadeHorasInput.value);
  calcularSalario();
});

function calcularSalario() {
  // Captura o valor do piso salarial
  const valorPiso = parseFloat(pisoSalario.value);

  // Calcula o valor do salário
  const valorSalario = valorPiso * quantidadeHoras / 44;

  // Insere o resultado no span de id resultado
  resultado.textContent = valorSalario.toFixed(2);

  // Calcula o valor do salário por hora
  const valorPorHora = valorPiso / 220;

  // Insere o resultado no span de id valorPorHora
  valorPorHora.textContent = valorPorHora.toFixed(2);
  console.log(valorPorHora.toFixed(2));
}
