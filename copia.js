window.onload = function() {
  var copyTextareaBtn = Array.prototype.slice.call(document.querySelectorAll('.botao'));
  var copyTextarea = Array.prototype.slice.call(document.querySelectorAll('.area'));
  copyTextareaBtn.forEach(function(btn, idx) {
    btn.addEventListener("click", function() {
      copyTextarea[idx].select();
      var msg = document.execCommand('copy')?'funcionou':'deu erro';
      console.log('executando para copiar texto ' + msg);
    });
  });
}
