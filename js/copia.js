window.onload = function () {
  var copyTextareaBtn = Array.prototype.slice.call(document.querySelectorAll('.botao'));
  var copyTextarea = Array.prototype.slice.call(document.querySelectorAll('.area'));

  // Função de cópia reutilizável por índice
  async function copiarPorIndice(idx) {
    const btn = copyTextareaBtn[idx];
    if (!btn || btn.disabled) return;
    try {
      const textToCopy = copyTextarea[idx].value;
      await navigator.clipboard.writeText(textToCopy);

      copyTextarea[idx].select();

      const originalHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check-double"></i>';
      btn.classList.add('bg-success', 'text-white', 'border-success');
      btn.classList.remove('btn-outline-success');
      btn.disabled = true;

      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.classList.remove('bg-success', 'text-white', 'border-success');
        btn.classList.add('btn-outline-success');
        btn.disabled = false;
      }, 2000);
    } catch (err) {
      console.error('Falha ao copiar texto: ', err);
    }
  }

  // Listener individual em cada botão
  copyTextareaBtn.forEach(function (btn, idx) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation(); // Evita disparar o click do fieldset
      copiarPorIndice(idx);
    });
  });

  // Click no fieldset dispara a cópia (ignora cards sem .botao, como o Plano e os de Status)
  document.querySelectorAll('fieldset').forEach(function (fieldset) {
    const btn = fieldset.querySelector('.botao');
    if (!btn) return; // Só age em cards com botão de cópia

    fieldset.style.cursor = 'pointer';

    fieldset.addEventListener('click', function (e) {
      // Ignora se o clique foi direto no botão ou num link
      if (e.target.closest('.botao') || e.target.closest('a')) return;
      const idx = copyTextareaBtn.indexOf(btn);
      if (idx !== -1) copiarPorIndice(idx);
    });
  });

  // Atualiza dinamicamente o botão do plano para o mais atual da tabela do CRF-PR
  atualizarPlanoFiscalizacao();
}

async function atualizarPlanoFiscalizacao() {
  const btnPlano = document.getElementById('btnPlanoFiscalizacao');
  if(!btnPlano) return;
  try {
    // Utiliza AllOrigins proxy para evadir política de CORS restrita via runtime de navegador
    const proxyUrl = "https://api.allorigins.win/get?url=";
    const targetUrl = encodeURIComponent("https://crf-pr.org.br/documento/index?DocumentoSearch%5Bid_documento_categoria%5D=19");
    
    const response = await fetch(proxyUrl + targetUrl);
    const data = await response.json();
    const htmlSite = data.contents;
    
    // Procura na raspagem do grid da página pela primeira view vinculada que tenha 'plano' e a numeração
    const match = htmlSite.match(/href="(\/documento\/view\/\d+\/[pP]lano-[^"]*)"/);
    if(match && match[1]) {
        // Redireciona para o visualizador/download nativo oficial do órgão usando a URL combinada montada
        const crfOficialUrl = "https://crf-pr.org.br" + match[1];
        btnPlano.href = crfOficialUrl;
        console.log("Plano de fiscalização sincronizado via proxy: [Última versão]", crfOficialUrl);
    }
  } catch (err) {
    console.error("Falha ao puxar plano de fiscalização atualizado, fallback será mantido.", err);
  }
}