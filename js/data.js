const data = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const inserirData = document.getElementsByClassName('data');
for (let i = 0; i < inserirData.length; i++) {
  inserirData[i].textContent = data + ' - ' + inserirData[i].textContent;
}