
const botao = document.getElementsByTagName('input')[0];
const corpo = document.getElementsByTagName('corpo')[0];
const container = document.getElementsByTagName('fieldset');
const legenda = document.getElementsByTagName('legend');

const textoEscuro = 'text-dark';
const textoClaro = 'text-light';
const botaoEscuro = 'btn-dark';
const fundoEscuro = 'bg-dark';
const fundoClaro = 'bg-light';
const botaoClaro = 'btn-light';

function alteraModo() {
	alteraClasses();
	alteraTexto();
}

function alteraClasses() {
	botao.classList.toggle(fundoEscuro, botaoEscuro);
	corpo.classList.toggle(fundoEscuro);
}

function alteraTexto() {
	const lightMode = textoClaro;
	const darkMode = textoEscuro;

	if (corpo.classList.contains(fundoClaro)) { 
		botao.innerHTML = fundoClaro;
		return;
	}

	botao.innerHTML = darkMode;
	corpo.classList.toggle(textoEscuro);
}

