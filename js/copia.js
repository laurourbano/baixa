window.onload = function () {
  var copyTextareaBtn = Array.prototype.slice.call(document.querySelectorAll('.botao'));
  var copyTextarea = Array.prototype.slice.call(document.querySelectorAll('.area'));
  copyTextareaBtn.forEach(function (btn, idx) {
    btn.addEventListener("click", function () {
      copyTextarea[idx].select();
      var msg = document.execCommand('copy') ? 'funcionou' : 'deu erro';
      console.log('executando para copiar texto ' + msg);

      //verificar para aplicar em todos os botões
      var copiado = Array.prototype.slice.call(document.querySelectorAll('.copiado'));

      copyTextareaBtn.forEach(function (btn, idx) {
        btn.addEventListener("click", function () {
          copiado[idx].select();
          var msg = document.execCommand('copy') ? 'funcionou' : 'deu erro';
          console.log('executando para copiar texto ' + msg);
        })})
        /*copyTextareaBtn.forEach(function (b, i) {
          b.addEventListener("click", function () {
            copiado.classList[i].remove('invisible');
            setTimeout(() => {
              b.classList[i].add('invisible');
            }, 5 * 1000);
          });
        });*/
      });
    });
  }