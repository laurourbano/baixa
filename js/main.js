
const button = document.getElementById('botao');
const body = document.getElementsByTagName('body')[0];

function changeMode() {
	changeClasses();
	changeText();
}

function changeClasses() {
	button.classList.toggle('btn-dark');
	body.classList.toggle('bg-dark');
	body.classList.toggle('text-dark');
}

function changeText() {
	const lightMode = 'text-light';
	const darkMode = 'text-dark';

	if (body.classList.contains('bg-light')) {
		button.innerHTML = 'bg-light';
		return;
	}

	button.innerHTML = darkMode;
}
