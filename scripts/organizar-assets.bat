@echo off
cd /d "c:\Users\lauro.urbano\Desktop\baixa\assets"

REM Mover JSONs de piso
move piso.json piso\
move piso-extraido.json piso\
move piso-ref.json piso\
move cidades-parana.json piso\

REM Mover JSONs de consultas
move faq.json consultas\
move normas.json consultas\
move protocolos-base.json consultas\
move protocolos-base-listas.json consultas\
move protocolos-detalhados.json consultas\
move orientacoes.json consultas\
move respostas.json consultas\
move respostas-padrao.json consultas\
move listas.json consultas\
move nomes-empresariais.json consultas\
move calc-horas.json consultas\

REM Mover planilhas
move "A. Atualizador Nomes.xlsx" planilhas\
move "A. Atualizador orientações.xlsx" planilhas\
move "A. Atualizador piso.xlsx" planilhas\
move "A. Atualizador Respostas Base.xlsx" planilhas\
move "A. Modelo_padrão v4..xlsx" planilhas\
move "Cópia de Thais v4..xlsx" planilhas\
move "tabela com formulas.xlsx" planilhas\
move dados.ods planilhas\
move "ESTRUTURA MANUAIS.xlsx" planilhas\
move "POP AD - Deliberação 1043-2024_revisado_03.26.xlsx" planilhas\
move "POP PRAZO+CARGA HORÁRIA  --- sendo atualizado.xlsx" planilhas 2>nul
move "POP PRAZO+CARGA HORÁRIA.xlsx" planilhas\

REM Mover documentos (PDF, DOCX, ODT)
move *.pdf docs\ 2>nul
move *.docx docs\ 2>nul
move *.odt docs\ 2>nul

echo Pronto!
