window.onload = function () {
  var copyTextareaBtn = Array.prototype.slice.call(document.querySelectorAll('.botao'));
  var copyTextarea = Array.prototype.slice.call(document.querySelectorAll('.area'));

  copyTextareaBtn.forEach(function (btn, idx) {
    btn.addEventListener("click", async function () {
      try {
        const textToCopy = copyTextarea[idx].value;
        await navigator.clipboard.writeText(textToCopy);
        console.log('Copiado com sucesso');
        
        // Re-seleciona para gerar o highlight clássico de visibilidade
        copyTextarea[idx].select();
        
        // Armazena o conteúdo original
        const originalHtml = btn.innerHTML;
        
        // Transforma permanentemente o botão visualmente como feedback inline ("encobre" tudo)
        btn.innerHTML = '<i class="fas fa-check-double"></i>';
        btn.classList.add('bg-success', 'text-white', 'border-success');
        btn.classList.remove('btn-outline-success');
        
        // DESABILITA O BOTÃO impedindo clones/conflitos e cliques consecutivos
        btn.disabled = true;
        
        // Retorna o botão ao estado normal e ativo após 2 segundos
        setTimeout(() => {
          btn.innerHTML = originalHtml;
          btn.classList.remove('bg-success', 'text-white', 'border-success');
          btn.classList.add('btn-outline-success');
          btn.disabled = false;
        }, 2000);
      } catch (err) {
        console.error('Falha ao copiar texto: ', err);
      }
    });
  });
}