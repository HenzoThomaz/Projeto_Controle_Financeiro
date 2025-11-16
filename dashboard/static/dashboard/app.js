/* ---------------------------
   Dashboard PRO - Single file
   - localStorage multi-user demo
   - avatar upload (base64), charts, CSV/PDF
   --------------------------- */

const COMPANY_KEY = 'dash_pro_company_v1'; // single company demo for now
const USERS_KEY = 'dash_pro_users_v1';
const TX_KEY = 'dash_pro_tx_v1';
const CATS_KEY = 'dash_pro_cats_v1';

let users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
let txs = JSON.parse(localStorage.getItem(TX_KEY) || '[]');
let categories = JSON.parse(localStorage.getItem(CATS_KEY) || 'null');
if(!categories){ categories = ['Salário','Vendas','Marketing','Infraestrutura','Outros']; localStorage.setItem(CATS_KEY, JSON.stringify(categories)); }

let currentUser = JSON.parse(localStorage.getItem('dash_pro_current') || 'null');

// Elements
const avatarBtn = document.getElementById('avatarBtn');
const userNameEl = document.getElementById('userName');
const userRoleEl = document.getElementById('userRole');
const brandName = document.getElementById('brandName');
const brandLogo = document.getElementById('brandLogo');
const balanceMini = document.getElementById('balanceMini');

const viewButtons = document.querySelectorAll('nav.menu button');
const sections = {
  dashboard: document.getElementById('view-dashboard'),
  transactions: document.getElementById('view-transactions'),
  reports: document.getElementById('view-reports'),
  settings: document.getElementById('view-settings')
};

// transaction elements
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('search');
const filterType = document.getElementById('filterType');
const filterMonth = document.getElementById('filterMonth');
const typeInput = document.getElementById('type');
const categoryInput = document.getElementById('category');
const descInput = document.getElementById('description');
const valueInput = document.getElementById('value');
const dateInput = document.getElementById('date');
const notesInput = document.getElementById('notes');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const manageCatsBtn = document.getElementById('manageCats');

const kSaldo = document.getElementById('kSaldo');
const kRec = document.getElementById('kReceitas');
const kDes = document.getElementById('kDespesas');
const summaryCats = document.getElementById('summaryCats');
const chartLineCtx = document.getElementById('chartLine').getContext('2d');
let chartLine = null;

/* ---------- Helpers ---------- */
function uid(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,9); }
function formatMoney(v){ return Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2}); }
function formatDate(d){ try{ return new Date(d+'T00:00').toLocaleDateString('pt-BR'); }catch(e){ return d } }
function saveAll(){ localStorage.setItem(USERS_KEY, JSON.stringify(users)); localStorage.setItem(TX_KEY, JSON.stringify(txs)); localStorage.setItem(CATS_KEY, JSON.stringify(categories)); }
function showToast(title, icon='success'){ Swal.fire({ toast:true, position:'top-end', icon, title, showConfirmButton:false, timer:1800 }); }

/* ---------- Auth & profile ---------- */
document.getElementById('btn-login').addEventListener('click', ()=> openAuthDialog());
avatarBtn.addEventListener('click', ()=> {
  if(!currentUser){ openAuthDialog(); return; }
  openProfileDialog();
});

function openAuthDialog(){
  Swal.fire({
    title: 'Conta / Login',
    html:
      `<div style="display:flex;gap:8px">
         <div style="flex:1"><input id="sw_login" class="swal2-input" placeholder="login"></div>
         <div style="flex:1"><input id="sw_pass" class="swal2-input" placeholder="senha (qualquer para demo)"></div>
       </div>
       <div style="display:flex;gap:8px;margin-top:8px">
         <input id="sw_new_login" class="swal2-input" placeholder="novo login (opcional)">
         <input id="sw_new_name" class="swal2-input" placeholder="nome (se criar)">
       </div>`,
    focusConfirm:false,
    preConfirm: () => {
      const login = document.getElementById('sw_login').value.trim();
      const pass = document.getElementById('sw_pass').value;
      const newLogin = document.getElementById('sw_new_login').value.trim();
      const newName = document.getElementById('sw_new_name').value.trim();
      return { login, pass, newLogin, newName };
    },
    showCancelButton:true,
    confirmButtonText: 'Entrar / Criar'
  }).then(async (res)=>{
    if(res.isConfirmed){
      const { login, pass, newLogin, newName } = res.value;
      if(newLogin && newName){
        // create user
        if(users.find(u=>u.login===newLogin)){ Swal.fire('Erro','Usuário já existe','error'); return; }
        const user = { id: uid('u'), login: newLogin, name: newName, avatar:null, role:'admin' };
        users.push(user); saveAll();
        Swal.fire('Conta criada','Use login para entrar','success');
        return;
      }
      if(!login){ Swal.fire('Erro','Preencha o login','error'); return; }
      // login by matching login (demo accepts any pass if user exists)
      let user = users.find(u=> u.login === login);
      if(!user){
        // optionally allow quick demo user creation
        if(confirm('Usuário não existe. Criar usuário demo com este login?')) {
          user = { id: uid('u'), login, name: login, avatar:null, role:'user' };
          users.push(user); saveAll();
          showToast('Usuário criado (demo)');
        } else { return; }
      }
      currentUser = user;
      localStorage.setItem('dash_pro_current', JSON.stringify(currentUser));
      updateUserUI();
      render();
      showToast('Bem-vindo, ' + (currentUser.name || currentUser.login));
    }
  });
}

function openProfileDialog(){
  Swal.fire({
    title: 'Editar perfil',
    html: `
      <div style="text-align:left">
        <label>Nome</label>
        <input id="pf_name" class="swal2-input" placeholder="Nome" value="${escapeHtml(currentUser.name||'')}">
        <label>Foto (upload)</label>
        <input id="pf_file" type="file" accept="image/*" class="swal2-file">
      </div>`,
    showCancelButton:true,
    confirmButtonText:'Salvar',
    preConfirm: ()=> {
      const fileEl = document.getElementById('pf_file');
      const name = document.getElementById('pf_name').value.trim();
      return { name, fileEl };
    }
  }).then(async (res)=>{
    if(res.isConfirmed){
      const { name, fileEl } = res.value;
      if(name) currentUser.name = name;
      if(fileEl && fileEl.files && fileEl.files[0]){
        const b = await fileToBase64(fileEl.files[0]);
        currentUser.avatar = b;
      }
      // persist
      const idx = users.findIndex(u=> u.id === currentUser.id);
      if(idx>-1) users[idx] = currentUser;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      localStorage.setItem('dash_pro_current', JSON.stringify(currentUser));
      updateUserUI();
      showToast('Perfil atualizado');
    }
  });
}

function updateUserUI(){
  if(!currentUser){
    userNameEl.textContent = 'Convidado';
    userRoleEl.textContent = '';
    avatarBtn.textContent = 'U';
    avatarBtn.style.backgroundImage = '';
  } else {
    userNameEl.textContent = currentUser.name || currentUser.login;
    userRoleEl.textContent = currentUser.role || 'Usuário';
    if(currentUser.avatar){ avatarBtn.style.backgroundImage = `url(${currentUser.avatar})`; avatarBtn.textContent = ''; avatarBtn.style.backgroundSize='cover'; } else { avatarBtn.style.backgroundImage=''; avatarBtn.textContent = (currentUser.name||currentUser.login||'U')[0].toUpperCase(); }
  }
}

/* ---------- Transactions ---------- */
function populateCategories(){
  categoryInput.innerHTML = categories.map(c=> `<option value="${escapeAttr(c)}">${c}</option>`).join('');
}
populateCategories();

function renderSummary(){
  const totals = txs.reduce((acc,t)=> { if(t.tipo==='receita') acc.r += t.valor; else acc.d += t.valor; return acc; }, {r:0,d:0});
  const saldo = Math.round((totals.r - totals.d) * 100)/100;
  kRec.textContent = 'R$ ' + formatMoney(totals.r);
  kDes.textContent = 'R$ ' + formatMoney(totals.d);
  kSaldo.textContent = 'R$ ' + formatMoney(saldo);
  balanceMini.textContent = 'Saldo: R$ ' + formatMoney(saldo);

  // categories
  const map = {};
  txs.forEach(t=> map[t.categoria] = (map[t.categoria]||0) + (t.tipo==='receita'? t.valor : -t.valor));
  summaryCats.innerHTML = Object.keys(map).sort((a,b)=> Math.abs(map[b]) - Math.abs(map[a])).map(k=> `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed rgba(255,255,255,0.03)"><div>${k}</div><div>R$ ${formatMoney(map[k])}</div></div>`).join('') || '<div class="muted">Nenhuma categoria</div>';
}

function renderTxTable(){
  const q = (searchInput.value || '').toLowerCase();
  const tFilter = filterType.value;
  const mFilter = filterMonth.value;
  const items = txs.filter(t=>{
    if(tFilter !== 'all' && t.tipo !== tFilter) return false;
    if(mFilter !== 'all' && t.data.slice(0,7) !== mFilter) return false;
    if(q && !(t.descricao.toLowerCase().includes(q) || t.categoria.toLowerCase().includes(q))) return false;
    return true;
  });
  tableBody.innerHTML = items.map(t=> `<tr>
    <td>${formatDate(t.data)}</td>
    <td><strong>${escapeHtml(t.descricao)}</strong><div class="muted" style="font-size:12px">${escapeHtml(t.obs||'')}</div></td>
    <td>${escapeHtml(t.categoria)}</td>
    <td style="text-align:right">R$ ${formatMoney(t.valor)}</td>
    <td class="actions"><button class="btn btn-ghost" data-id="${t.id}" data-act="edit">Editar</button><button class="btn btn-ghost" data-id="${t.id}" data-act="del">Excluir</button></td>
  </tr>`).join('') || `<tr><td colspan="5" class="muted">Nenhum lançamento</td></tr>`;

  // attach actions
  tableBody.querySelectorAll('button').forEach(b=> b.addEventListener('click', (e)=>{
    const id = e.currentTarget.dataset.id, act = e.currentTarget.dataset.act;
    if(act==='del'){ if(confirm('Excluir lançamento?')){ txs = txs.filter(x=> x.id !== id); localStorage.setItem(TX_KEY, JSON.stringify(txs)); render(); showToast('Excluído','success'); } }
    if(act==='edit'){ const tx = txs.find(x=> x.id === id); if(tx){ typeInput.value = tx.tipo; categoryInput.value = tx.categoria; descInput.value = tx.descricao; valueInput.value = tx.valor; dateInput.value = tx.data; notesInput.value = tx.obs; saveBtn.dataset.edit = id; window.scrollTo({top:0,behavior:'smooth'}); } }
  }));
}

function renderChart(){
  // monthly balance line
  const map = {};
  txs.forEach(t=> { const m = t.data.slice(0,7); map[m] = (map[m] || 0) + (t.tipo === 'receita' ? t.valor : -t.valor); });
  const months = Object.keys(map).sort();
  const data = months.map(m => map[m]);
  if(chartLine) chartLine.destroy();
  chartLine = new Chart(chartLineCtx, {
    type:'line',
    data:{ labels: months.map(x=> formatMonthLabel(x)), datasets:[{ data, label:'Saldo', borderColor:'#7c3aed', backgroundColor:'rgba(124,58,237,0.08)', fill:true, tension:0.3 }] },
    options:{ plugins:{legend:{display:false}}, scales:{ x:{ticks:{color:'#ddd'}}, y:{ticks:{color:'#ddd'}} } }
  });
}

function populateMonthFilter(){
  const months = new Set(txs.map(t=> t.data.slice(0,7)));
  const now = new Date();
  for(let i=0;i<12;i++){ months.add(new Date(now.getFullYear(), now.getMonth()-i,1).toISOString().slice(0,7)); }
  const arr = Array.from(months).filter(Boolean).sort().reverse();
  filterMonth.innerHTML = '<option value="all">Todos os meses</option>' + arr.map(m=> `<option value="${m}">${formatMonthLabel(m)}</option>`).join('');
}

/* ---------- Events ---------- */
saveBtn.addEventListener('click', ()=>{
  const v = parseFloat(valueInput.value || 0);
  if(!descInput.value.trim() || isNaN(v) || v === 0){ Swal.fire('Erro','Descrição e valor válidos são obrigatórios','error'); return; }
  const item = { id: uid('tx'), tipo: typeInput.value, categoria: categoryInput.value, descricao: descInput.value.trim(), valor: Math.round(v*100)/100, data: dateInput.value || new Date().toISOString().slice(0,10), obs: notesInput.value.trim() };
  const editId = saveBtn.dataset.edit;
  if(editId){
    txs = txs.map(x=> x.id === editId ? {...item, id: editId} : x);
    delete saveBtn.dataset.edit;
  } else {
    txs.unshift(item);
  }
  localStorage.setItem(TX_KEY, JSON.stringify(txs));
  clearForm();
  render();
  showToast('Lançamento salvo');
});
clearBtn.addEventListener('click', clearForm);

function clearForm(){
  typeInput.value = 'receita'; categoryInput.value = categories[0] || 'Outros'; descInput.value=''; valueInput.value=''; dateInput.value = new Date().toISOString().slice(0,10); notesInput.value='';
}

document.getElementById('btn-demo').addEventListener('click', ()=> {
  if(confirm('Criar dados demo (não apagará dados existentes)?')){
    createDemo();
    showToast('Demo carregado');
  }
});
document.getElementById('btn-reset').addEventListener('click', ()=> {
  if(confirm('Resetar todos os dados locais?')){ localStorage.clear(); location.reload(); }
});

/* search & filters */
searchInput.addEventListener('input', debounce(()=> { renderTxTable(); }, 250));
filterType.addEventListener('change', ()=> renderTxTable());
filterMonth.addEventListener('change', ()=> renderTxTable());

/* export CSV */
document.getElementById('btn-export-csv').addEventListener('click', ()=> {
  if(!txs.length){ Swal.fire('Sem dados','Não há lançamentos para exportar','info'); return; }
  const rows = [['id','data','descricao','categoria','tipo','valor','obs']];
  txs.slice().reverse().forEach(t=> rows.push([t.id,t.data,t.descricao,t.categoria,t.tipo,t.valor,t.obs]));
  const csv = rows.map(r=> r.map(c=> '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\\n');
  const blob = new Blob([csv], {type:'text/csv'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'lancamentos.csv'; a.click();
});

/* export PDF (simple) */
document.getElementById('btn-export-pdf').addEventListener('click', async ()=>{
  if(!txs.length){ Swal.fire('Sem dados','Não há lançamentos para exportar','info'); return; }
  // use html2canvas+jsPDF? we keep simple: build textual PDF via jsPDF (if available)
  if(window.jspdf){ // not loaded here by default - fallback to csv alert
    Swal.fire('PDF','Funcionalidade de PDF não disponível (use botão Relatórios)','','info');
  } else {
    Swal.fire('Exportar CSV','PDF offline não implementado nesta demo. Use "Relatórios" para gerar via impressão.','info');
  }
});

/* Reports PDF via html2canvas (on panel) */
document.getElementById('btnPdfReport').addEventListener('click', async ()=>{
  const report = document.getElementById('reportPreview');
  // fill content
  document.getElementById('reportCompany').textContent = document.getElementById('companyName').value || 'Esclarecer Tecnologia';
  const content = '<p><strong>Saldo:</strong> ' + kSaldo.textContent + ' • <strong>Receitas:</strong> ' + kRec.textContent + ' • <strong>Despesas:</strong> ' + kDes.textContent + '</p>';
  document.getElementById('reportContent').innerHTML = content + (txs.slice(0,20).map(t=> `<div>${t.data} — ${t.descricao} — R$ ${formatMoney(t.valor)}</div>`).join(''));
  // render via html2canvas
  if(window.html2canvas){
    html2canvas(report, {scale:2}).then(canvas=>{
      const img = canvas.toDataURL('image/png');
      // create link to download the image as PNG (quick)
      const link = document.createElement('a'); link.href = img; link.download = 'relatorio.png'; link.click();
    });
  } else {
    Swal.fire('PDF','Biblioteca html2canvas não carregada.','info');
  }
});

/* export company JSON */
document.getElementById('btnExportCompany').addEventListener('click', ()=>{
  const payload = {
    company: { name: document.getElementById('companyName').value || 'Esclarecer Tecnologia' },
    users, txs, categories
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'empresa-package.json'; a.click();
});

/* settings: create user */
document.getElementById('createUser').addEventListener('click', ()=>{
  const login = document.getElementById('newUserLogin').value.trim();
  const name = document.getElementById('newUserName').value.trim();
  if(!login || !name){ Swal.fire('Erro','Preencha login e nome','error'); return; }
  if(users.find(u=> u.login === login)){ Swal.fire('Erro','Login já existe','error'); return; }
  const user = { id: uid('u'), login, name, avatar:null, role:'user' };
  users.push(user); saveAll(); renderUsers();
  showToast('Usuário criado (demo)');
});

/* import / export all */
document.getElementById('exportAll').addEventListener('click', ()=>{
  const payload = { users, txs, categories, company: { name: document.getElementById('companyName').value || 'Esclarecer Tecnologia' } };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'backup_empresa.json'; a.click();
});
document.getElementById('importAll').addEventListener('click', ()=> {
  document.getElementById('importFile').click();
});
document.getElementById('importFile').addEventListener('change', (e)=> {
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader(); r.onload = ()=> {
    try{
      const payload = JSON.parse(r.result);
      users = payload.users || users;
      txs = payload.txs || txs;
      categories = payload.categories || categories;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      localStorage.setItem(TX_KEY, JSON.stringify(txs));
      localStorage.setItem(CATS_KEY, JSON.stringify(categories));
      showToast('Importado');
      render();
    }catch(err){ Swal.fire('Erro','Arquivo inválido','error'); }
  }; r.readAsText(f);
});

document.getElementById('companyLogoFile').addEventListener('change', async (e)=>{
  const f = e.target.files[0]; if(!f) return;
  const b = await fileToBase64(f);
  brandLogo.style.backgroundImage = `url(${b})`; brandLogo.textContent = '';
});

/* manage categories modal */
manageCatsBtn.addEventListener('click', ()=> {
  Swal.fire({
    title: 'Gerenciar categorias',
    html: `<div id="catsList" style="text-align:left"></div>
           <input id="newCatName" class="swal2-input" placeholder="Nova categoria">`,
    showCancelButton:true,
    preConfirm: ()=> {
      const name = document.getElementById('newCatName').value.trim();
      return { name };
    },
    didOpen: ()=> {
      const list = document.getElementById('catsList');
      list.innerHTML = categories.map(c=> `<div style="display:flex;justify-content:space-between;padding:6px 0"><div>${c}</div><button class="swal2-confirm" data-cat="${c}" style="background:#333;padding:4px;border-radius:6px">Excluir</button></div>`).join('');
      list.querySelectorAll('button').forEach(b=> b.addEventListener('click', (e)=> {
        const c = e.currentTarget.dataset.cat;
        if(confirm('Excluir categoria? Lançamentos serão movidos para "Outros".')){
          categories = categories.filter(x=> x!==c);
          txs = txs.map(t=> t.categoria === c ? {...t, categoria:'Outros'} : t);
          localStorage.setItem(CATS_KEY, JSON.stringify(categories));
          localStorage.setItem(TX_KEY, JSON.stringify(txs));
          render();
          Swal.close();
          showToast('Categoria excluída');
        }
      }));
    }
  }).then(res=>{
    if(res.isConfirmed && res.value && res.value.name){
      categories.push(res.value.name);
      localStorage.setItem(CATS_KEY, JSON.stringify(categories));
      populateCategories();
      showToast('Categoria adicionada');
    }
  });
});

/* users list */
function renderUsers(){ document.getElementById('usersList').innerHTML = users.map(u=> `<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px dashed rgba(255,255,255,0.03)"><div><strong>${u.name}</strong><div class="muted">${u.login} • ${u.role}</div></div><div style="display:flex;gap:6px"><button class="btn btn-ghost" data-login="${u.login}" data-act="prom">Promover</button><button class="btn btn-ghost" data-login="${u.login}" data-act="del">Remover</button></div></div>`).join('') || '<div class="muted">Nenhum usuário</div>';
  // attach
  document.getElementById('usersList').querySelectorAll('button').forEach(b=> b.addEventListener('click', (e)=> {
    const login = e.currentTarget.dataset.login, act = e.currentTarget.dataset.act;
    const user = users.find(x=> x.login===login); if(!user) return;
    if(act==='prom'){ user.role = 'admin'; localStorage.setItem(USERS_KEY, JSON.stringify(users)); renderUsers(); showToast('Promovido'); }
    if(act==='del'){ if(confirm('Remover usuário?')){ users = users.filter(x=> x.login!==login); localStorage.setItem(USERS_KEY, JSON.stringify(users)); renderUsers(); showToast('Removido'); } }
  }));
}

/* ---------- Render main ---------- */
function render(){
  // update branding
  brandName.textContent = document.getElementById('companyName').value || 'Esclarecer Tecnologia';
  document.getElementById('reportCompany').textContent = brandName.textContent;
  // populate categories
  populateCategories();
  // render users
  renderUsers();
  // render table & summary & chart
  renderTxTable();
  renderSummary();
  renderChart();
  populateMonthFilter();
  updateUserUI();
}

/* ---------- Utilities ---------- */
function createDemo(){
  // seed users
  users = [{ id: uid('u'), login:'admin', name:'Admin', role:'admin', avatar:null }, { id: uid('u'), login:'conta', name:'Contador', role:'accountant', avatar:null }];
  // seed categories
  categories = ['Salário','Vendas','Marketing','Infraestrutura','Outros'];
  // seed txs
  txs = [];
  const now = new Date();
  for(let i=0;i<90;i++){
    const d = new Date(now.getFullYear(), now.getMonth() - Math.floor(Math.random()*6), Math.max(1, Math.floor(Math.random()*28)));
    const tipo = Math.random() > 0.6 ? 'receita' : 'despesa';
    const valor = Math.round((Math.random()*4000 + (tipo==='receita'? 800 : 30)) * 100)/100;
    const cat = categories[Math.floor(Math.random()*categories.length)];
    txs.push({ id: uid('tx'), tipo, categoria: cat, descricao: `${tipo==='receita' ? 'Venda' : 'Compra'} ${Math.floor(Math.random()*999)}`, valor, data: d.toISOString().slice(0,10), obs:'' });
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(TX_KEY, JSON.stringify(txs));
  localStorage.setItem(CATS_KEY, JSON.stringify(categories));
  render();
}

function fileToBase64(file){ return new Promise((res,rej)=> { const r = new FileReader(); r.onload = ()=> res(r.result); r.onerror = rej; r.readAsDataURL(file); }); }

function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escapeAttr(s){ return String(s||'').replace(/"/g,'&quot;'); }
function formatMonthLabel(ym){ const [y,m] = ym.split('-'); const dt = new Date(y,parseInt(m)-1,1); return dt.toLocaleString('pt-BR',{month:'short', year:'numeric'}); }

function debounce(fn,ms=200){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }

/* initial UI wiring */
viewButtons.forEach(b=> b.addEventListener('click', (e)=>{
  viewButtons.forEach(x=> x.classList.remove('active'));
  e.currentTarget.classList.add('active');
  const view = e.currentTarget.dataset.view;
  Object.keys(sections).forEach(k=> sections[k].style.display = (k===view ? '' : 'none'));
}));

/* populate month filter initially */
function populateMonthFilter(){
  const months = new Set(txs.map(t=> t.data.slice(0,7)));
  const now = new Date();
  for(let i=0;i<12;i++) months.add(new Date(now.getFullYear(), now.getMonth()-i, 1).toISOString().slice(0,7));
  const arr = Array.from(months).filter(Boolean).sort().reverse();
  filterMonth.innerHTML = '<option value="all">Todos os meses</option>' + arr.map(m=> `<option value="${m}">${formatMonthLabel(m)}</option>`).join('');
}

/* initial load */
(function init(){
  // set company name from storage (if any)
  const compName = localStorage.getItem(COMPANY_KEY) || 'Esclarecer Tecnologia';
  document.getElementById('companyName').value = compName;
  users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  txs = JSON.parse(localStorage.getItem(TX_KEY) || '[]');
  categories = JSON.parse(localStorage.getItem(CATS_KEY) || JSON.stringify(categories));
  currentUser = JSON.parse(localStorage.getItem('dash_pro_current') || 'null');
  populateCategories();
  render();
})();

/* small helpers for uploading avatar quickly via hidden input (not required) */
document.getElementById('avatarFile').addEventListener('change', async (e)=>{
  if(!currentUser) return;
  const f = e.target.files[0]; if(!f) return;
  const b = await fileToBase64(f);
  currentUser.avatar = b;
  const idx = users.findIndex(u=> u.id === currentUser.id);
  if(idx>-1) users[idx].avatar = b;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem('dash_pro_current', JSON.stringify(currentUser));
  updateUserUI();
});

/* final */