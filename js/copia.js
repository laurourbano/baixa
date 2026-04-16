window.onload = function () {
  var copyTextareaBtn = Array.prototype.slice.call(document.querySelectorAll('.botao'));
  var copyTextarea = Array.prototype.slice.call(document.querySelectorAll('.area'));
  var copiado = Array.prototype.slice.call(document.querySelectorAll('.copiado'));

  copyTextareaBtn.forEach(function (btn, idx) {
    btn.addEventListener("click", async function () {
      try {
        const textToCopy = copyTextarea[idx].value;
        await navigator.clipboard.writeText(textToCopy);
        console.log('Copiado com sucesso');
        
        // Re-seleciona para gerar o highlight clássico de visibilidade
        copyTextarea[idx].select();
        
        copiado[idx].classList.remove('invisible');
        
        setTimeout(() => {
          copiado[idx].classList.add('invisible');
        }, 2000);
      } catch (err) {
        console.error('Falha ao copiar texto: ', err);
      }
    });
  });
}