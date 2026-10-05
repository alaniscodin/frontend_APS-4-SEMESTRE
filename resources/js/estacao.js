/* Front da Estação Climática. Troque obterLeitura() por chamada ao back-end (servlet/bean JSF) quando estiver pronto. */
var INTERVALO_MS = 10000; // requisito da APS: coleta a cada 10 segundos
var MAX_PONTOS = 20;
var grafico;

function obterLeitura() {
  // TODO back-end: retornar a última linha do banco (DAO). Valores simulados por enquanto.
  var t = 22 + Math.sin(Date.now() / 60000) * 4 + Math.random();
  return {
    temperatura: +t.toFixed(1),
    umidade: Math.round(55 + Math.random() * 20),
    vento: +(8 + Math.random() * 10).toFixed(1),
    chovendo: Math.random() > 0.8,
    pressao: Math.round(1008 + Math.random() * 8),
    hora: new Date()
  };
}

function definir(id, texto) { var e = document.getElementById(id); if (e) e.textContent = texto; }

function atualizar() {
  var l = obterLeitura();
  var hh = l.hora.toLocaleTimeString('pt-BR');
  definir('temp', Math.round(l.temperatura));
  definir('umidade', l.umidade + '%');
  definir('vento', l.vento + ' km/h');
  definir('chuva', l.chovendo ? 'Chovendo' : 'Sem chuva');
  definir('pressao', l.pressao + ' hPa');
  definir('hora', hh);
  definir('data', l.hora.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }));
  definir('ultima', 'Última leitura às ' + hh + ' (a cada ' + INTERVALO_MS / 1000 + 's)');
  if (!grafico) return;
  var d = grafico.data;
  d.labels.push(hh);
  d.datasets[0].data.push(l.temperatura);
  d.datasets[1].data.push(l.umidade);
  d.datasets[2].data.push(l.vento);
  if (d.labels.length > MAX_PONTOS) { d.labels.shift(); d.datasets.forEach(function (s) { s.data.shift(); }); }
  grafico.update();
}

function criarGrafico() {
  var cv = document.getElementById('grafico');
  if (!cv || typeof Chart === 'undefined') return;
  function serie(nome, cor, eixo) {
    return { label: nome, data: [], borderColor: cor, backgroundColor: cor + '33', fill: eixo === 'y',
             tension: .4, pointRadius: 2, borderWidth: 2.5, yAxisID: eixo };
  }
  grafico = new Chart(cv, {
    type: 'line',
    data: { labels: [], datasets: [serie('Temperatura (°C)', '#E59A6E', 'y'),
                                  serie('Umidade (%)', '#6FB3DE', 'y1'),
                                  serie('Vento (km/h)', '#8E82CC', 'y')] },
    options: { responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Nunito' } } } },
      scales: { y: { grid: { color: '#EEF3F8' } }, y1: { position: 'right', min: 0, max: 100, grid: { display: false } },
                x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } } } }
  });
}

/* Tela de configurações: guarda no navegador até o back-end persistir. */
function salvarConfig() {
  var c = { cidade: v('cidade'), intervalo: v('intervalo'), unidade: v('unidade') };
  try { localStorage.setItem('estacaoConfig', JSON.stringify(c)); } catch (e) {}
  var a = document.getElementById('aviso'); if (a) a.style.display = 'block';
  return false;
}
function v(id) { return document.getElementById(id).value; }

window.addEventListener('DOMContentLoaded', function () {
  criarGrafico();
  if (document.getElementById('temp')) { for (var i = 0; i < 6; i++) atualizar(); setInterval(function(){atualizar();}, INTERVALO_MS); }
});

/* Busca de cidade e contador de leituras com chuva */
var leiturasChuva = 0;
function buscarCidade() {
  var c = document.getElementById('busca').value.trim();
  if (!c) return;
  document.getElementById('tituloCidade').textContent = c;
  document.getElementById('local').textContent = c;
  // TODO back-end: enviar a cidade escolhida para a coleta (API de previsão do tempo).
}
var _atualizar = atualizar;
atualizar = function () {
  _atualizar();
  var t = document.getElementById('chuva');
  if (t && t.textContent === 'Chovendo') leiturasChuva++;
  var m = document.getElementById('chuvaMm');
  if (m) m.textContent = leiturasChuva + (leiturasChuva === 1 ? ' leitura' : ' leituras');
};
