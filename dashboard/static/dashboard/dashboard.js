const ctxCategoriasDespesa = document.getElementById('grafico-categorias-despesa');
const ctxCategoriasReceita = document.getElementById('grafico-categorias-receita');
const ctxLinhas = document.getElementById('grafico-linhas');

let transacoes = [];

const coresDespesa = ['#f44336', '#ff9800', '#9c27b0', '#00bcd4', '#8bc34a', '#ffc107', '#795548'];
const coresReceita = ['#4caf50', '#2196f3', '#00bcd4', '#8bc34a', '#ffc107', '#9c27b0'];

// Gráficos
let graficoCategoriasDespesa = new Chart(ctxCategoriasDespesa, {
  type: 'pie',
  data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
  options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
});

let graficoCategoriasReceita = new Chart(ctxCategoriasReceita, {
  type: 'pie',
  data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
  options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
});

let graficoLinhas = new Chart(ctxLinhas, {
  type: 'bar',
  data: {
    labels: [],
    datasets: [
      { label: 'Receita', data: [], backgroundColor: 'rgba(76, 175, 80, 0.6)' },
      { label: 'Despesa', data: [], backgroundColor: 'rgba(244, 67, 54, 0.6)' }
    ]
  },
  options: { responsive: true, scales: { y: { beginAtZero: true } } }
});

// Funções
function atualizarResumo() {
  let receita = transacoes.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0);
  let despesa = transacoes.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0);
  let saldo = receita - despesa;

  document.getElementById('receita-total').textContent = `R$${receita.toFixed(2)}`;
  document.getElementById('despesa-total').textContent = `R$${despesa.toFixed(2)}`;
  document.getElementById('saldo-atual').textContent = `R$${saldo.toFixed(2)}`;
}

function atualizarTabela() {
  const corpo = document.getElementById('lista-transacoes');
  corpo.innerHTML = "";

  if (transacoes.length === 0) {
    corpo.innerHTML = `<tr><td colspan="5" class="placeholder">Nenhuma transação encontrada.</td></tr>`;
    return;
  }

  transacoes.slice(-5).reverse().forEach(t => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${t.data}</td>
      <td class="${t.tipo}">${t.tipo === 'receita' ? 'Receita' : 'Despesa'}</td>
      <td>${t.categoria}</td>
      <td class="${t.tipo}">${t.tipo === 'receita' ? '+' : '-'}R$${t.valor.toFixed(2)}</td>
      <td>${t.descricao || '-'}</td>
    `;
    corpo.appendChild(linha);
  });
}

function atualizarGraficoCategorias() {
  const despesas = transacoes.filter(t => t.tipo === 'despesa');
  const receitas = transacoes.filter(t => t.tipo === 'receita');

  const catDespesa = {};
  despesas.forEach(t => catDespesa[t.categoria] = (catDespesa[t.categoria] || 0) + t.valor);

  const catReceita = {};
  receitas.forEach(t => catReceita[t.categoria] = (catReceita[t.categoria] || 0) + t.valor);

  graficoCategoriasDespesa.data.labels = Object.keys(catDespesa);
  graficoCategoriasDespesa.data.datasets[0].data = Object.values(catDespesa);
  graficoCategoriasDespesa.data.datasets[0].backgroundColor = coresDespesa;
  graficoCategoriasDespesa.update();

  graficoCategoriasReceita.data.labels = Object.keys(catReceita);
  graficoCategoriasReceita.data.datasets[0].data = Object.values(catReceita);
  graficoCategoriasReceita.data.datasets[0].backgroundColor = coresReceita;
  graficoCategoriasReceita.update();
}

function atualizarGraficoLinhas() {
  const datas = {};
  transacoes.forEach(t => {
    if (!datas[t.data]) datas[t.data] = { receita: 0, despesa: 0 };
    datas[t.data][t.tipo] += t.valor;
  });

  graficoLinhas.data.labels = Object.keys(datas);
  graficoLinhas.data.datasets[0].data = Object.values(datas).map(d => d.receita);
  graficoLinhas.data.datasets[1].data = Object.values(datas).map(d => d.despesa);
  graficoLinhas.update();
}

// Eventos
document.getElementById('form-transacao').addEventListener('submit', e => {
  e.preventDefault();
  const tipo = document.querySelector('input[name="tipo"]:checked').value;
  const valor = parseFloat(document.getElementById('valor').value);
  const categoria = document.getElementById('categoria').value;
  const descricao = document.getElementById('descricao').value;
  const data = document.getElementById('data').value;

  if (isNaN(valor) || !categoria || !data) {
    alert("Preencha todos os campos obrigatórios!");
    return;
  }

  transacoes.push({ tipo, valor, categoria, descricao, data });

  atualizarResumo();
  atualizarTabela();
  atualizarGraficoCategorias();
  atualizarGraficoLinhas();

  document.getElementById('form-transacao').reset();
});

// Botão Limpar
document.querySelector('.limpar').addEventListener('click', () => {
  document.getElementById('form-transacao').reset();
});
