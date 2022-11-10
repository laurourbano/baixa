function changeMode() {
	changeClasses();
	changeText();
}

function changeClasses() {
	button.classList.toggle(lightModeClass);
	h1.classList.toggle(lightModeClass);
	body.classList.toggle(lightModeClass);
	footer.classList.toggle(lightModeClass);
	nav.classList.toggle(lightModeClass);
	h3.classList.toggle(lightModeClass);
	
}

function changeText() {
	const lightMode = 'Light Mode';
	const darkMode = 'Dark Mode';

	if (body.classList.contains(lightModeClass)) {
		button.innerHTML = lightMode;
		h1.innerHTML = lightMode + ' ON';
		return;
	}

	button.innerHTML = darkMode;
	h1.innerHTML = darkMode + ' ON';
}

const lightModeClass = 'light-mode';
const button = document.getElementById('mode-selector');
const h1 = document.getElementById('page-title');
const body = document.getElementsByTagName('body')[0];
const footer = document.getElementsByTagName('footer')[0];
const nav = document.getElementsByTagName('nav')[0];
const h3 = document.getElementsByTagName('h3')[0,1,2,3,4,5];

//button.addEventListener('click', changeMode);