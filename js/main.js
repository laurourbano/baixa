
const button = document.getElementsByTagName('input')[0];
const body = document.getElementsByTagName('body')[0];
const fieldset = document.getElementsByTagName('fieldset');
const legend = document.getElementsByTagName('legend');
const textoEscuro = 'text-dark';
const textoClaro = 'text-light';
const botaoEscuro = 'btn-dark';
const fundoEscuro = 'bg-dark';
const fundoClaro = 'bg-light';
const botaoClaro = 'btn-light';

function changeMode() {
	changeClasses();
	changeText();
}

function changeClasses() {
	button.classList.toggle(fundoEscuro, botaoEscuro );
	body.classList.toggle(fundoEscuro);
}

function changeText() {
	const lightMode = textoClaro;
	const darkMode = textoEscuro;

	if (body.classList.contains(fundoClaro)) { 
		button.innerHTML = fundoClaro;
		return;
	}

	button.innerHTML = darkMode;
	body.classList.toggle(textoEscuro);

}
