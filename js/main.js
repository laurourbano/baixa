
const lightModeClass = 'bg-light';
const button = document.getElementById('botao');
const body = document.getElementsByTagName('body')[0];
const footer = document.getElementsByTagName('footer')[0];
const nav = document.getElementsByTagName('nav')[0];

function changeMode() {
	changeClasses();
	changeText();
}

function changeClasses() {
	button.classList.toggle('btn-dark');
	body.classList.toggle('bg-dark');
	footer.classList.toggle('text-light');
	nav.classList.toggle('text-light');
	
}

function changeText() {
	const lightMode = 'text-light';
	const darkMode = 'text-dark';

	if (body.classList.contains(lightModeClass)) {
		button.innerHTML = lightMode;
		return;
	}

	button.innerHTML = darkMode;
}
