window.onload = function () {

  var copyTextareaBtn = Array.prototype.slice.call(document.querySelectorAll('.botao'));
  var copyTextarea = Array.prototype.slice.call(document.querySelectorAll('.area'));
  var copiado = Array.prototype.slice.call(document.querySelectorAll('.copiado'));

  copyTextareaBtn.forEach(function (btn, idx) {
    btn.addEventListener("click", function () {

      copyTextarea[idx].select();
      var msg = document.execCommand('copy') ? 'funcionou' : 'deu erro';
      
      console.log('executando para copiar texto ' + msg);

      copiado[idx].classList.remove('invisible');

      setTimeout(() => {
        copiado[idx].classList.add('invisible');
      }, 2 * 1000);

    });
  });
}