const data = window.DASHBOARD_DATA || { tables: {}, figures: [] };
const tabsRoot = document.getElementById('tabs');
const tablesRoot = document.getElementById('tables-root');
const graphPanel = document.getElementById('panel-graficas');
const subtitle = document.getElementById('subtitle');

if (data.title) document.title = data.title;
if (subtitle) {
  const nTables = Object.keys(data.tables || {}).length;
  const nCharts = (data.figures || []).length;
  subtitle.textContent = `Visualizacion general con ${nCharts} grafica(s) y ${nTables} tabla(s).`;
}

function activatePanel(panelId, button) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');
  if (button) button.classList.add('active');

  if (panelId === 'panel-graficas') {
    setTimeout(() => {
      document.querySelectorAll('.chart').forEach(el => Plotly.Plots.resize(el));
    }, 120);
  }
}

function createTab(label, panelId, isActive = false) {
  const btn = document.createElement('button');
  btn.className = 'tab-btn';
  btn.type = 'button';
  btn.textContent = label;
  btn.addEventListener('click', () => activatePanel(panelId, btn));
  tabsRoot.appendChild(btn);
  if (isActive) btn.classList.add('active');
}

function normalizeLayout(layout = {}) {
  return {
    ...layout,
    autosize: true,
    margin: { l: 60, r: 30, t: 70, b: 60, ...(layout.margin || {}) },
    legend: {
      orientation: 'h',
      y: -0.2,
      x: 0,
      ...(layout.legend || {}),
    },
  };
}

function isDonutOrPieFigure(figure = {}) {
  const traces = figure.data || [];
  return traces.some(trace => {
    const t = String(trace.type || '').toLowerCase();
    return t === 'pie';
  });
}

function getFigureTitle(figure = {}) {
  const rawTitle = figure?.layout?.title;
  if (typeof rawTitle === 'string') return rawTitle.trim().toLowerCase();
  if (rawTitle && typeof rawTitle.text === 'string') {
    return rawTitle.text.replace(/<[^>]*>/g, '').trim().toLowerCase();
  }
  return '';
}

function renderGraphs() {
  graphPanel.className = 'panel active';
  const wrap = document.createElement('div');
  wrap.className = 'grid';
  graphPanel.appendChild(wrap);

  const seen = new Set();
  const seenTitles = new Set();
  const figures = (data.figures || []).filter(item => {
    const figure = item.figure || {};
    const title = getFigureTitle(figure);
    if (title) {
      if (seenTitles.has(title)) return false;
      seenTitles.add(title);
    }

    const signature = JSON.stringify({
      data: figure.data || [],
      layout: figure.layout || {},
    });
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });

  if (subtitle) {
    const nTables = Object.keys(data.tables || {}).length;
    subtitle.textContent = `Visualizacion general con ${figures.length} grafica(s) y ${nTables} tabla(s).`;
  }

  figures.forEach((item, i) => {
    const card = document.createElement('article');
    card.className = 'chart-card';
    const chartId = `chart-${i}`;
    const el = document.createElement('div');
    el.id = chartId;
    el.className = 'chart';
    card.appendChild(el);
    wrap.appendChild(card);

    const figure = item.figure || {};
    const baseLayout = normalizeLayout(figure.layout || {});
    const finalLayout = isDonutOrPieFigure(figure)
      ? { ...baseLayout, showlegend: false }
      : baseLayout;

    Plotly.react(chartId, figure.data || [], finalLayout, {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
    });
  });

  if (!figures.length) {
    graphPanel.innerHTML = '<p>No hay graficas disponibles.</p>';
  }
}

function renderTablePanel(name, tableData) {
  const panelId = `panel-${name}`;
  const section = document.createElement('section');
  section.id = panelId;
  section.className = 'panel';

  const toolbar = document.createElement('div');
  toolbar.className = 'table-toolbar';
  if (tableData.excel) {
    const link = document.createElement('a');
    link.className = 'btn-excel';
    link.href = tableData.excel;
    link.download = tableData.excel;
    link.textContent = 'Descargar Excel';
    toolbar.appendChild(link);
  }
  section.appendChild(toolbar);

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  (tableData.columns || []).forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  (tableData.rows || []).forEach(row => {
    const tr = document.createElement('tr');
    (tableData.columns || []).forEach(col => {
      const td = document.createElement('td');
      const value = row[col];
      td.textContent = value == null ? '' : String(value);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  wrap.appendChild(table);
  section.appendChild(wrap);
  tablesRoot.appendChild(section);

  return panelId;
}

createTab('Principal - Graficas', 'panel-graficas', true);
renderGraphs();

Object.entries(data.tables || {}).forEach(([name, tableData]) => {
  const panelId = renderTablePanel(name, tableData);
  createTab(name.replace('tabla_', 'Tabla ').replace(/_/g, ' '), panelId, false);
});

window.addEventListener('resize', () => {
  document.querySelectorAll('.chart').forEach(el => Plotly.Plots.resize(el));
});
