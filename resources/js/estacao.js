/* Front da Estação Climática. Troque obterLeitura() por chamada ao back-end (DAO) quando estiver pronto. */
var INTERVALO_MS = 10000, MAX_PONTOS = 20, grafico, simulado = null, leiturasChuva = 0;
var TX = '#4A3F4F', NUVEM = '#D9D4EC', CINZA = '#ADA7C0', GOTA = '#7FBFA5', SOL = '#F3B266', RAIO = '#E99055';

/* ---------- Ícones (nuvenzinhas) ---------- */
function rosto() {
  return '<circle cx="58" cy="68" r="2.6" fill="' + TX + '"/><circle cx="76" cy="68" r="2.6" fill="' + TX + '"/>' +
         '<path d="M62 74q5 5 10 0" stroke="' + TX + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
}
function nuvem(cor, x, y, s) {
  return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><circle cx="44" cy="64" r="18" fill="' + cor + '"/>' +
    '<circle cx="66" cy="50" r="24" fill="' + cor + '"/><circle cx="88" cy="66" r="16" fill="' + cor + '"/>' +
    '<rect x="28" y="62" width="72" height="26" rx="13" fill="' + cor + '"/>' + rosto() + '</g>';
}
function sol(x, y, s) {
  var r = '';
  for (var i = 0; i < 8; i++) {
    var a = i * Math.PI / 4, c = Math.cos(a), n = Math.sin(a);
    r += '<line x1="' + (60 + c * 36) + '" y1="' + (60 + n * 36) + '" x2="' + (60 + c * 47) + '" y2="' + (60 + n * 47) +
         '" stroke="' + RAIO + '" stroke-width="6" stroke-linecap="round"/>';
  }
  return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><g class="raios">' + r + '</g><circle cx="60" cy="60" r="26" fill="' + SOL + '"/>' +
         '<g transform="translate(-7 -8)">' + rosto() + '</g></g>';
}
function gota(x, y) { return '<line class="gota" x1="' + x + '" y1="' + y + '" x2="' + (x - 5) + '" y2="' + (y + 13) + '" stroke="' + GOTA + '" stroke-width="5" stroke-linecap="round"/>'; }
function floco(x, y) {
  var l = '';
  [0, 60, 120].forEach(function (g) { l += '<line class="floco" x1="' + x + '" y1="' + (y - 6) + '" x2="' + x + '" y2="' + (y + 6) + '" transform="rotate(' + g + ' ' + x + ' ' + y + ')" stroke="' + GOTA + '" stroke-width="2.6" stroke-linecap="round"/>'; });
  return l;
}
function linhas() {
  return [96, 104, 112].map(function (y, i) { return '<line x1="' + (30 + i * 4) + '" y1="' + y + '" x2="' + (92 - i * 4) + '" y2="' + y + '" stroke="' + CINZA + '" stroke-width="5" stroke-linecap="round"/>'; }).join('');
}
var ICONES = {
  sol: sol(0, 0, 1),
  parcial: sol(28, -10, .68) + nuvem(NUVEM, -4, 14, .95),
  nublado: nuvem(NUVEM, 0, 4, 1),
  neblina: nuvem(CINZA, 0, -12, 1) + linhas(),
  chuva: nuvem(NUVEM, 0, -10, 1) + gota(46, 86) + gota(64, 92) + gota(82, 86),
  chuvaForte: nuvem(NUVEM, 0, -12, 1) + gota(38, 84) + gota(52, 94) + gota(66, 84) + gota(80, 94) + gota(94, 84),
    tempestade: nuvem(CINZA, 0, -12, 1) + '<polygon class="raio" points="64,78 52,100 62,100 56,116 78,90 67,90 74,78" fill="' + SOL + '"/>' + gota(40, 90) + gota(92, 90)
};
var ROTULOS = { sol: 'Ensolarado', parcial: 'Parcialmente nublado', nublado: 'Nublado', neblina: 'Neblina',
                chuva: 'Chuva fraca', chuvaForte: 'Chuva forte', tempestade: 'Tempestade' };
function svgIcone(k) { return '<svg viewBox="0 0 120 120" role="img" aria-label="' + ROTULOS[k] + '">' + ICONES[k] + '</svg>'; }

/* ---------- Dados ---------- */
var PRESETS = { sol: [31, 38, 6, 0], parcial: [26, 55, 9, 0], nublado: [22, 70, 10, 0], neblina: [16, 92, 3, 0],
                chuva: [20, 82, 9, 1], chuvaForte: [19, 90, 15, 1], tempestade: [21, 92, 32, 1] };

function condicao(l) {
  if (l.chovendo) { if (l.vento > 25) return 'tempestade'; return l.umidade > 85 ? 'chuvaForte' : 'chuva'; }
  if (l.umidade >= 88 && l.vento < 5) return 'neblina';
  if (l.umidade > 72) return 'nublado';
  return l.umidade > 55 ? 'parcial' : 'sol';
}
function obterLeitura() {
  // TODO back-end: retornar a última linha do banco (DAO). Por enquanto, valores simulados.
  var p = simulado ? PRESETS[simulado] : null, j = Math.random();
  var t = p ? p[0] + j : 24 + Math.sin(Date.now() / 60000) * 5 + j;
  return { temperatura: +t.toFixed(1), umidade: p ? p[1] + Math.round(j * 4) : Math.round(50 + Math.random() * 28),
           vento: p ? +(p[2] + j * 2).toFixed(1) : +(6 + Math.random() * 12).toFixed(1),
           chovendo: p ? !!p[3] : Math.random() > 0.85, pressao: Math.round(1008 + Math.random() * 8), hora: new Date() };
}
function definir(id, t) { var e = document.getElementById(id); if (e) e.textContent = t; }

function atualizar() {
  var l = obterLeitura(), hh = l.hora.toLocaleTimeString('pt-BR'), k = condicao(l);
  definir('temp', Math.round(l.temperatura)); definir('umidade', l.umidade + '%'); definir('vento', l.vento + ' km/h');
  definir('chuva', l.chovendo ? 'Chovendo' : 'Sem chuva'); definir('pressao', l.pressao + ' hPa'); definir('hora', hh);
  definir('data', l.hora.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }));
  definir('cond', ROTULOS[k]);
  definir('ultima', 'Última leitura às ' + hh);
  if (l.chovendo) leiturasChuva++;
  definir('chuvaMm', leiturasChuva + (leiturasChuva === 1 ? ' leitura' : ' leituras'));
  var ic = document.getElementById('icone');
  if (ic && ic.getAttribute('data-k') !== k) { ic.setAttribute('data-k', k); ic.innerHTML = svgIcone(k); }
  if (!grafico) return;
  var d = grafico.data; d.labels.push(hh);
  d.datasets[0].data.push(l.temperatura); d.datasets[1].data.push(l.umidade); d.datasets[2].data.push(l.vento);
  if (d.labels.length > MAX_PONTOS) { d.labels.shift(); d.datasets.forEach(function (s) { s.data.shift(); }); }
  grafico.update();
}

/* ---------- Simulador (para os testes da monografia) ---------- */
function montarSimulador() {
  var box = document.getElementById('chips'); if (!box) return;
  Object.keys(ICONES).forEach(function (k) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.id = 'chip-' + k;
    b.innerHTML = '<div class="mini">' + svgIcone(k) + '</div>' + ROTULOS[k];
    b.onclick = function () {
      simulado = simulado === k ? null : k;
      Object.keys(ICONES).forEach(function (x) { document.getElementById('chip-' + x).classList.toggle('ativo', x === simulado); });
      atualizar();
    };
    box.appendChild(b);
  });
}

/* ---------- Gráfico ---------- */
function criarGrafico() {
  var cv = document.getElementById('grafico'); if (!cv || typeof Chart === 'undefined') return;
  function serie(n, c, eixo, fill) { return { label: n, data: [], borderColor: c, backgroundColor: c + '33', fill: fill, tension: .4, pointRadius: 2, borderWidth: 2.5, yAxisID: eixo }; }
  grafico = new Chart(cv, { type: 'line',
    data: { labels: [], datasets: [serie('Temperatura (°C)', '#CD5C5C', 'y', true), serie('Umidade (%)', '#7FBFA5', 'y1', false), serie('Vento (km/h)', '#F3B266', 'y', false)] },
    options: { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Nunito' } } } },
      scales: { y: { grid: { color: '#F3ECEF' } }, y1: { position: 'right', min: 0, max: 100, grid: { display: false } },
                x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } } } } });
}

/* ---------- Busca e configurações ---------- */
function buscarCidade() {
  var c = document.getElementById('busca').value.trim(); if (!c) return;
  definir('tituloCidade', c); definir('local', c); // TODO back-end: enviar a cidade para a coleta (API)
}
function v(id) { return document.getElementById(id).value; }
function salvarConfig() {
  try { localStorage.setItem('estacaoConfig', JSON.stringify({ cidade: v('cidade'), intervalo: v('intervalo'), unidade: v('unidade') })); } catch (e) {}
  var a = document.getElementById('aviso'); if (a) a.style.display = 'block'; return false;
}
window.addEventListener('DOMContentLoaded', function () {
  criarGrafico(); montarSimulador();
  if (document.getElementById('temp')) { for (var i = 0; i < 6; i++) atualizar(); setInterval(atualizar, INTERVALO_MS); }
});
