/**
 * views/results.js — Exibição de resultados KFA (gráfico + tabela).
 */

let _kfaChart = null;

async function refreshKfaSelect() {
  try {
    const { kfa_results } = await API.analysis.listKfa();
    const sel = document.getElementById('results-kfa-select');
    sel.innerHTML = '<option value="">-- selecione uma KFA --</option>';
    kfa_results.forEach(r => {
      const opt = document.createElement('option');
      opt.value = JSON.stringify({ c1: r.corpus1_name, c2: r.corpus2_name, d: r.min_effect, join: r.join_method });
      opt.textContent = `${r.corpus1_name} vs ${r.corpus2_name}  (d≥${r.min_effect}, ${r.join_method})`;
      sel.appendChild(opt);
    });
  } catch (_) {}
}

document.getElementById('btn-load-result').addEventListener('click', async () => {
  const sel = document.getElementById('results-kfa-select');
  if (!sel.value) { showToast('Selecione uma KFA.', 'error'); return; }

  const { c1, c2, d, join } = JSON.parse(sel.value);

  try {
    const data = await API.analysis.getKfa(c1, c2, d, join);
    _renderResults(data, c1, c2);
  } catch (err) {
    showToast(err.message, 'error');
  }
});

function _renderResults(data, c1, c2) {
  const results = data.results.slice(0, 40); // top-40 para o gráfico

  // --- Chart ---
  const chartBox = document.getElementById('chart-container');
  chartBox.classList.remove('hidden');

  const labels  = results.map(r => r.Feature);
  const effects = results.map(r => r.Effect_Size);
  const colors  = effects.map(v => v >= 0 ? 'rgba(224,123,57,0.85)' : 'rgba(91,156,246,0.85)');

  if (_kfaChart) _kfaChart.destroy();
  _kfaChart = new Chart(document.getElementById('kfa-chart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: `Effect size (${c1} vs ${c2})`,
        data: effects,
        backgroundColor: colors,
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const r = data.results[ctx.dataIndex];
              return [
                ` d = ${r.Effect_Size.toFixed(3)}`,
                ` ${c1}: μ=${r.Mean_Corpus1.toFixed(2)}`,
                ` ${c2}: μ=${r.Mean_Corpus2.toFixed(2)}`,
              ];
            },
          },
        },
      },
      scales: {
        x: { grid: { color: '#363b4a' }, ticks: { color: '#8892a4' } },
        y: { grid: { display: false },   ticks: { color: '#e2e6f0', font: { size: 11 } } },
      },
    },
  });

  // --- Table ---
  const tableBox = document.getElementById('table-container');
  tableBox.classList.remove('hidden');

  const cols = ['Feature', 'Effect_Size', 'Mean_Corpus1', 'Mean_Corpus2', 'Std_Corpus1', 'Std_Corpus2', 'N_Corpus1', 'N_Corpus2'];
  const colLabels = ['Feature', 'Effect size (d)', `Média ${c1}`, `Média ${c2}`, `DP ${c1}`, `DP ${c2}`, `N ${c1}`, `N ${c2}`];

  const thead = document.querySelector('#kfa-table thead tr');
  thead.innerHTML = colLabels.map(l => `<th>${l}</th>`).join('');

  const tbody = document.querySelector('#kfa-table tbody');
  tbody.innerHTML = data.results.map(r => {
    const cls = r.Effect_Size >= 0 ? 'effect-positive' : 'effect-negative';
    return `<tr>
      <td>${r.Feature}</td>
      <td class="${cls}">${r.Effect_Size.toFixed(3)}</td>
      <td>${r.Mean_Corpus1.toFixed(3)}</td>
      <td>${r.Mean_Corpus2.toFixed(3)}</td>
      <td>${r.Std_Corpus1.toFixed(3)}</td>
      <td>${r.Std_Corpus2.toFixed(3)}</td>
      <td>${r.N_Corpus1}</td>
      <td>${r.N_Corpus2}</td>
    </tr>`;
  }).join('');
}
