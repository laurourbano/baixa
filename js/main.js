
const lightModeClass = 'bg-light';
console.log(lightModeClass)
const button = document.getElementById('botao');
console.log(button)
const fieldset = document.getElementsByTagName('fieldset');
console.log(fieldset)
const body = document.getElementsByTagName('body')[0];
console.log(body)
const footer = document.getElementsByTagName('footer')[0];
console.log(footer)
const nav = document.getElementsByTagName('nav')[0];
console.log(nav)

function changeMode() {
	changeClasses();
	changeText();
}

function changeClasses() {
	button.classList.toggle('btn-dark');
	fieldset.forEach(function(){
		fieldset.classList.toggle('text-dark')
	});
	body.classList.toggle('bg-dark');
	footer.classList.toggle('text-dark');
	nav.classList.toggle('text-dark');
	
}

function changeText() {
	const lightMode = 'text-light';
	const darkMode = 'text-dark';

	if (body.classList.contains(lightModeClass)) {
		button.innerHTML = lightMode;
		h1.innerHTML = lightMode + ' ON';
		return;
	}

	button.innerHTML = darkMode;
	h1.innerHTML = darkMode + ' ON';
}
