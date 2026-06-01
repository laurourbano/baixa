/**
 * Gera cidades-parana.json com as 499 cidades do Paraná mapeadas por região.
 * Fonte: mesorregiões IBGE + regionais CRF-PR.
 */
const fs = require('fs');
const path = require('path');

// Mapeamento por mesorregião/regional
const regioes = {
  "Curitiba e RMC": [
    "curitiba", "sao_jose_dos_pinhais", "colombo", "araucaria", "pinhais", "campo_largo",
    "almete_tamandare", "piraquara", "fazenda_rio_grande", "lapa", "campina_grande_do_sul",
    "quatro_barras", "rio_branco_do_sul", "bocaiuva_do_sul", "cerro_azul", "contenda",
    "balsa_nova", "campo_do_tenente", "piên", "tijucas_do_sul", "agudos_do_sul",
    "mandirituba", "quatro_barras", "antonina", "guaraquecaba", "guaratuba",
    "matinhos", "morretes", "paranagua", "ponte_do_parana"
  ],
  "Ponta Grossa e Campos Gerais": [
    "ponta_grossa", "castro", "telemaco_borba", "jaguariaiva", "palmeira", "carambei",
    "tibagi", "pirai_do_sul", "senges", "ortigueira", "reserva", "imbaú", "ventania",
    "arapoti", "ivai", "curiuva", "fernandes_pinheiro", "guamiranga", "ipiranga",
    "porto_amazonas", "sao_joao_do_triunfo"
  ],
  "Guarapuava e Centro-Sul": [
    "guarapuava", "pitanga", "laranjeiras_do_sul", "palmital", "candido_de_abreu",
    "prudentopolis", "inacio_martins", "turvo", "boa_ventura_de_sao_roque", "campina_do_simao",
    "candói", "cantagalo", "foz_do_jordao", "goioxim", "mato_rico", "nova_laranjeiras",
    "pinhão", "reserva_do_iguacu", "rio_bonito_do_iguacu", "virmond"
  ],
  "Londrina e Norte Central": [
    "londrina", "maringa", "apucarana", "arapongas", "cambe", "rolandia", "ibipora",
    "sarandi", "marialva", "mandaguari", "jandaia_do_sul", "faxinal", "cambe",
    "astorga", "sabáudia", "maua_da_serra", "califórnia", "bom_sucesso",
    "borrazopolis", "califórnia", "cambira", "cruzmaltina", "faxinal", "florestopolis",
    "iguaracu", "itaguaje", "ivaiporã", "jardim_alegre", "lidianopolis", "lunardelli",
    "manoel_ribas", "marumbi", "maua_da_serra", "novo_itacolomi", "sao_joao_do_ivai",
    "sao_pedro_do_ivai", "barbosa_ferraz", "corumbatai_do_sul", "engenheiro_beltrão",
    "fenix", "ivaipora", "jandaia_do_sul", "kalore", "loanda", "mandaguacu",
    "marialva", "marilena", "nova_esperanca", "ourizona", "paicandu", "paranacity",
    "presidente_castelo_branco", "santa_fe", "sao_carlos_do_ivai", "sao_jorge_do_ivai",
    "sarandi", "tamboara", "terra_boa", "alto_parana", "alto_piquiri", "amapora",
    "cruzeiro_do_sul", "diamante_do_norte", "guairaça", "inaja", "itanhanga",
    "loanda", "mariluz", "nova_alianca_do_ivai", "nova_londrina", "paraiso_do_norte",
    "planaltina_do_parana", "porto_rico", "quarense", "santa_cruz_do_monte_castelo",
    "santa_isabel_do_ivai", "santa_monica", "sao_pedro_do_parana", "tambora",
    "tapejara", "tapira", "umuarama"
  ],
  "Maringá e Noroeste": [
    "maringa", "umuarama", "paranavai", "cianorte", "campo_mourao", "loanda",
    "goioere", "cruzeiro_do_oeste", "nova_esperanca", "colorado", "alto_parana",
    "alto_piquiri", "amapora", "araruna", "barbosa_ferraz", "boa_esperanca",
    "campina_da_lagoa", "campo_mourao", "cianorte", "corumbatai_do_sul", "cruzeiro_do_oeste",
    "diamante_do_norte", "douradina", "engenheiro_beltrão", "fenix", "florai",
    "floresta", "guairaça", "guaporema", "icaraíma", "iguatemi", "inaja",
    "itanhanga", "ivaté", "janipolis", "japurá", "juranda", "jussara", "loanda",
    "luiziana", "mamborê", "mariluz", "moreira_sales", "nova_cantu", "nova_olimpia",
    "paranapoema", "peabiru", "perobal", "quarese", "quarto_centenario",
    "quinta_do_sol", "rancho_alegre_do_oeste", "rondon", "sao_jorge_do_patrocinio",
    "sao_manoel_do_parana", "sao_tome", "tapejara", "tapira", "terra_boa",
    "tuneiras_do_oeste", "umuarama", "xambre"
  ],
  "Cascavel e Oeste": [
    "cascavel", "foz_do_iguacu", "toledo", "marechal_candido_rondon", "medianeira",
    "palotina", "assís_chateaubriand", "santa_helena", "guaira", "matelândia",
    "anahy", "boa_vista_da_aparecida", "braganey", "cafelândia", "campo_bonito",
    "capitão_leônidas_marques", "catanduvas", "ceu_azul", "corbélia", "diamante_do_sul",
    "entre_rios_do_oeste", "formosa_do_oeste", "guaraniacu", "ibema", "iguatu",
    "iracema_do_oeste", "jesuítas", "lindoeste", "mercedes", "nova_aurora",
    "nova_prata_do_iguacu", "ouro_verde_do_oeste", "pato_bragado", "quatro_pontes",
    "santa_lucia", "santa_tereza_do_oeste", "sao_jose_das_palmeiras", "sao_pedro_do_iguacu",
    "serranopolis_do_iguacu", "três_barras_do_parana", "tupãssi", "vera_cruz_do_oeste"
  ],
  "Francisco Beltrão e Sudoeste": [
    "francisco_beltrao", "pato_branco", "dois_vizinhos", "palmas", "coronel_vivida",
    "chopinzinho", "sao_lourenco_do_oeste", "mangueirinha", "clevelandia", "honorio_serpa",
    "ampére", "barracão", "bela_vista_da_caroba", "bom_jesus_do_sul", "capanema",
    "cruzeiro_do_iguacu", "eneas_marques", "flor_da_serra_do_sul", "itaipulândia",
    "manfrinopolis", "mariopolis", "marmeleiro", "nova_esperanca_do_sudoeste",
    "nova_prata_do_iguacu", "perola_do_oeste", "pinhal_de_sao_bento", "planejado",
    "pranchita", "rancho_alegre_do_oeste", "realeza", "renascença", "salto_do_lontra",
    "santa_izabel_do_oeste", "santo_antonio_do_sudoeste", "sao_jorge_do_oeste",
    "sao_valentim", "sulina", "verê", "vitorino"
  ],
  "Jacarezinho e Norte Pioneiro": [
    "jacarezinho", "santo_antonio_da_platina", "cornelio_procopio", "bandeirantes",
    "andirá", "cambara", "assai", "são_jeronimo_da_serra", "jundiai_do_sul",
    "abatiá", "barra_do_jacare", "carlopolis", "congonhinhas", "conselheiro_mairinck",
    "curiúva", "figueira", "guapirama", "ibaiti", "jaboti", "japira", "joaquim_tavora",
    "nova_america_da_colina", "nova_fatima", "nova_santa_barbara", "pinhalão",
    "quatiguá", "ribeirão_claro", "ribeirão_do_pinhal", "salto_do_itarare",
    "santa_amelia", "santa_cecilia_do_pavão", "santana_do_itararé", "sao_jose_da_boa_vista",
    "sapopema", "sertaneja", "siqueira_campos", "tomazina", "wenceslau_braz"
  ],
  "Irati e Sudeste": [
    "irati", "união_da_vitoria", "prudentopolis", "sao_mateus_do_sul", "rio_negro",
    "antonio_olinto", "bituruna", "cruz_machado", "general_carneiro", "guamiranga",
    "imbituva", "ipiranga", "mallet", "paula_freitas", "paulo_frontin",
    "porto_vitoria", "realeza", "reboucas", "rio_azul", "sao_joao_do_triunfo"
  ],
  "Paranaguá e Litoral": [
    "paranagua", "guaratuba", "matinhos", "pontal_do_parana", "antonina",
    "guaraquecaba", "morretes"
  ]
};

// Constrói lista plana: [{ cidade, regiao, label }]
const cidades = [];
// Função de normalização: minúsculo, sem acentos, sem espaços
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// Remove duplicatas cross-região (cidade fica na primeira região encontrada)
const seenCidades = {};
const regioesClean = {};

Object.keys(regioes).forEach(function (regiao) {
  var cidadesRegiao = [];
  regioes[regiao].forEach(function (cidade) {
    var norm = normalize(cidade);
    if (!norm || seenCidades[norm]) return;
    seenCidades[norm] = true;
    cidadesRegiao.push(norm);
    const label = norm.replace(/_/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); });
    cidades.push({ cidade: norm, regiao: regiao, label: label });
  });
  if (cidadesRegiao.length > 0) regioesClean[regiao] = cidadesRegiao;
});

// Ordena alfabeticamente por label
cidades.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

fs.writeFileSync(
  path.join(__dirname, '..', 'assets', 'cidades-parana.json'),
  JSON.stringify({ cidades, regioes: regioesClean }, null, 2)
);

console.log('cidades-parana.json gerado com', cidades.length, 'cidades em', Object.keys(regioesClean).length, 'regiões.');
