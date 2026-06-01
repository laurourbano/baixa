/**
 * weather.js — Widget de clima
 *
 * @module weather
 * @description
 * Exibe a previsão do tempo para a cidade do usuário.
 *
 * Fontes de dados:
 * - Geolocalização: navigator.geolocation (GPS do navegador)
 * - Geocodificação reversa: Nominatim (OpenStreetMap)
 * - Busca de cidades: API IBGE (~5.570 municípios brasileiros)
 * - Previsão: Open-Meteo (API gratuita, sem chave)
 *
 * Funcionalidades:
 * - Detecção automática de localização
 * - Busca manual de cidades brasileiras
 * - Exibição de temperatura atual, máxima e mínima
 * - Ícone representativo por weathercode (WMO)
 * - Persistência da cidade selecionada em localStorage
 *
 * @namespace MainApp
 */
window.MainApp = window.MainApp || {};

(function (app) {
  'use strict';

  var allCities = [];
  var isFetchingCities = false;

  var fallbackCities = [
    'Curitiba, PR', 'São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG',
    'Brasília, DF', 'Porto Alegre, RS', 'Salvador, BA', 'Fortaleza, CE',
    'Recife, PE', 'Manaus, AM', 'Goiânia, GO', 'Belém, PA', 'Guarulhos, SP',
    'Campinas, SP', 'São Luís, MA', 'Maceió, AL', 'Campo Grande, MS', 'Natal, RN'
  ];

  function formattedDate() {
    return new Date().toLocaleDateString('pt-BR');
  }

  function fetchWeather(lat, lon, cityName) {
    var widget = document.getElementById('weather-widget');
    if (!widget) return Promise.resolve();

    var date = formattedDate();

    return fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var temperature = data.current_weather.temperature;
        var weathercode = data.current_weather.weathercode;
        var tempMax = data.daily.temperature_2m_max[0];
        var tempMin = data.daily.temperature_2m_min[0];

        var iconMap = {
          0: 'fa-sun', 1: 'fa-cloud-sun', 2: 'fa-cloud-sun', 3: 'fa-cloud',
          45: 'fa-smog', 48: 'fa-smog',
          51: 'fa-cloud-rain', 53: 'fa-cloud-rain', 55: 'fa-cloud-rain',
          61: 'fa-cloud-showers-heavy', 63: 'fa-cloud-showers-heavy', 65: 'fa-cloud-showers-heavy',
          71: 'fa-snowflake', 73: 'fa-snowflake', 75: 'fa-snowflake',
          80: 'fa-cloud-rain', 81: 'fa-cloud-rain', 82: 'fa-cloud-rain',
          95: 'fa-bolt', 96: 'fa-bolt', 99: 'fa-bolt'
        };
        var iconClass = iconMap[weathercode] || 'fa-cloud';

        widget.innerHTML =
          '<div class="d-flex align-items-center gap-1 px-0">' +
          '<i class="fas ' + iconClass + ' weather-icon" style="font-size: 0.8rem;"></i>' +
          '<div class="d-flex flex-column" onclick="MainApp.changeLocation()" style="cursor: pointer;" title="Clique para mudar a localização">' +
          '<span class="fw-bold" style="font-size: 0.75rem; line-height: 1;">' + Math.round(temperature) + '°C</span>' +
          '<span class="text-muted" style="font-size: 0.5rem; margin-top: 1px;">' +
          '<i class="fas fa-map-marker-alt me-1"></i>' + cityName + '</span></div>' +
          '<div class="vr mx-1 opacity-25" style="height: 16px;"></div>' +
          '<div class="d-flex flex-column justify-content-center" style="font-size: 0.5rem; line-height: 1.1;">' +
          '<span class="text-danger fw-bold"><i class="fas fa-arrow-up me-1" style="font-size: 0.45rem;"></i>' + Math.round(tempMax) + '°</span>' +
          '<span class="text-info fw-bold"><i class="fas fa-arrow-down me-1" style="font-size: 0.45rem;"></i>' + Math.round(tempMin) + '°</span></div>' +
          '<div class="d-none d-lg-block ms-1 ps-2 border-start border-secondary border-opacity-25 text-center">' +
          '<div class="text-muted" style="font-size: 0.45rem; text-transform: uppercase; letter-spacing: 0.5px;">' + date + '</div></div>' +
          '<button class="btn btn-link btn-sm p-0 ms-1 text-muted weather-refresh-btn" onclick="MainApp.refreshWeather(event)" title="Atualizar clima">' +
          '<i class="fas fa-sync-alt" style="font-size: 0.65rem;"></i></button></div>';
      })
      .catch(function () {
        widget.innerHTML = '<span class="x-small text-muted" onclick="MainApp.changeLocation()" style="cursor:pointer">Erro ao carregar clima. Clique aqui.</span>';
      });
  }

  function setupWeatherFilter() {
    var filter = document.getElementById('weather-city-filter');
    var select = document.getElementById('weather-city-select');
    if (!filter || !select) return;

    function normalize(str) {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function renderAll(data) {
      if (data.length === 0) {
        select.innerHTML = '<option value="">Nenhuma cidade encontrada</option>';
        return;
      }
      select.innerHTML = '<option value="">Selecione a cidade (' + data.length + ')</option>' +
        data.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
    }

    renderAll(allCities);

    filter.oninput = function () {
      var term = normalize(filter.value);
      var filtered = allCities.filter(function (c) { return normalize(c).indexOf(term) > -1; });
      renderAll(filtered);
      if (filtered.length === 1 && term.length > 2) {
        select.value = filtered[0];
        select.dispatchEvent(new Event('change'));
      }
    };

    select.onclick = function (e) {
      if (e.target.tagName === 'OPTION' && e.target.value) {
        saveLocationManual(e.target.value);
      }
    };

    select.onchange = function (e) {
      if (e.target.value) {
        saveLocationManual(e.target.value);
      }
    };
  }

  function initWeather() {
    var widget = document.getElementById('weather-widget');
    if (!widget) return Promise.resolve();

    var select = document.getElementById('weather-city-select');
    if (select && allCities.length === 0) {
      select.innerHTML = '<option value="">Carregando cidades do Brasil...</option>';
    }

    if (allCities.length === 0 && !isFetchingCities) {
      isFetchingCities = true;

      (function fetchCities() {
        var ufMap = {
          11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO',
          21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA',
          31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP',
          41: 'PR', 42: 'SC', 43: 'RS',
          50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF'
        };

        fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
          .then(function (r) {
            if (!r.ok) throw new Error('Erro na rede: ' + r.status);
            return r.json();
          })
          .then(function (data) {
            allCities = data.map(function (m) {
              var uf = (m.microrregiao && m.microrregiao.mesorregiao && m.microrregiao.mesorregiao.UF && m.microrregiao.mesorregiao.UF.sigla) || '??';
              return m.nome + ', ' + uf;
            });
            isFetchingCities = false;
            setupWeatherFilter();
          })
          .catch(function () {
            // Fallback: tenta fonte alternativa
            fetch('https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/json/municipios.json')
              .then(function (r) { return r.json(); })
              .then(function (data) {
                allCities = data.map(function (m) {
                  var uf = ufMap[m.codigo_uf] || 'BR';
                  return m.nome + ', ' + uf;
                });
                allCities.sort();
                isFetchingCities = false;
                setupWeatherFilter();
              })
              .catch(function () {
                allCities = fallbackCities;
                isFetchingCities = false;
                setupWeatherFilter();
              });
          });
      })();
    }

    var savedLoc = JSON.parse(localStorage.getItem('portal_weather_loc'));
    if (savedLoc) {
      return fetchWeather(savedLoc.lat, savedLoc.lon, savedLoc.city);
    }

    return new Promise(function (resolve) {
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          var latitude = pos.coords.latitude;
          var longitude = pos.coords.longitude;
          var city = 'Local';
          fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + latitude + '&lon=' + longitude)
            .then(function (r) { return r.json(); })
            .then(function (geoData) {
              city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.suburb || 'Local';
              return fetchWeather(latitude, longitude, city);
            })
            .catch(function () {
              return fetchWeather(latitude, longitude, city);
            })
            .then(resolve);
        },
        function () {
          fetch('https://ipapi.co/json/')
            .then(function (r) { return r.json(); })
            .then(function (ipData) {
              return fetchWeather(ipData.latitude, ipData.longitude, ipData.city);
            })
            .catch(function () {
              return fetchWeather(-25.4296, -49.2719, 'Curitiba');
            })
            .then(resolve);
        },
        { timeout: 3000 }
      );
    });
  }

  function changeLocation() {
    window.locModal.show();
    setupWeatherFilter();
    setTimeout(function () { document.getElementById('weather-city-filter').focus(); }, 500);
  }

  function saveLocationManual(cityName) {
    var city = cityName || document.getElementById('weather-city-select').value;
    if (!city) return;

    var btn = document.querySelector('#locationModal .btn-primary');
    var originalText = btn.innerHTML;
    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      btn.disabled = true;
    }

    fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(city) + '&limit=1')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.length > 0) {
          var loc = { lat: data[0].lat, lon: data[0].lon, city: city.split(',')[0] };
          localStorage.setItem('portal_weather_loc', JSON.stringify(loc));
          window.locModal.hide();
          initWeather();
          app.showToast('Localização atualizada!', 'success');
        } else {
          app.showToast('Cidade não encontrada.', 'danger');
        }
        if (btn) {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }
      })
      .catch(function () {
        app.showToast('Erro ao buscar coordenadas.', 'danger');
        if (btn) {
          btn.innerHTML = 'Salvar';
          btn.disabled = false;
        }
      });
  }

  function refreshWeather(e) {
    if (e) {
      e.stopPropagation();
      var btn = e.currentTarget;
      if (btn) {
        var icon = btn.querySelector('i');
        if (icon) icon.classList.add('fa-spin');
      }
    }
    initWeather().then(function () {
      app.showToast('Clima atualizado!', 'info', 2000);
    });
  }

  app.initWeather = initWeather;
  app.changeLocation = changeLocation;
  app.saveLocationManual = saveLocationManual;
  app.refreshWeather = refreshWeather;
}(window.MainApp));
