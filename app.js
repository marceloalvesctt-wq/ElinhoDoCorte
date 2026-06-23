/* ═══════════════════════════════════════
   ELINHO DO CORTE — Aplicação
   Firebase Firestore + Chart.js
═══════════════════════════════════════ */

import { initializeApp }      from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc,
         onSnapshot, query, orderBy, serverTimestamp, setDoc }
       from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { Chart, registerables } from "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/+esm";
Chart.register(...registerables);

const firebaseConfig = {
  apiKey:            "AIzaSyB2vcq5YKBexJqtJl1ATdKz0NGGPEy0sf0",
  authDomain:        "elinhodocorte-67f87.firebaseapp.com",
  projectId:         "elinhodocorte-67f87",
  storageBucket:     "elinhodocorte-67f87.firebasestorage.app",
  messagingSenderId: "601237905053",
  appId:             "1:601237905053:web:0641a64544564a0bb7be74"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── ESTADO ──
let vendas=[], reservas=[], gastos=[];
let calDate=new Date(), selDay=null;
let dashAno=new Date().getFullYear(), dashMes=new Date().getMonth();
let activeDashTab='geral';
let charts={};
let modalId=null, pgtoSel=null, sinalPgtoSel=null;
let vendaServicoSel=null, vendaPgtoSel=null, filtroAtivo='hoje';
const today=new Date();

// ── UTILS ──
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const COLS=['#c0392b','#2563eb','#d4aa5a','#27ae60','#8b5cf6','#e67e22','#1abc9c','#e91e63'];
function parseLocal(s){return new Date(s+'T12:00:00');}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function dataHoje(){return today.toISOString().split('T')[0];}
function fmtData(s){return s?s.split('-').reverse().join('/'):''}
function fmtHora(){const n=new Date();return String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0');}
function servicoBc(s){
  if(!s) return 'bc5'; const l=s.toLowerCase();
  if(l.includes('combo')||(l.includes('corte')&&l.includes('barba'))) return 'bc3';
  if(l.includes('corte')) return 'bc1';
  if(l.includes('barba')) return 'bc2';
  if(l.includes('pigment')||l.includes('relax')||l.includes('luzes')||l.includes('hidrat')) return 'bc4';
  return 'bc5';
}
function servicoIcon(s){
  if(!s) return '✂️'; const l=s.toLowerCase();
  if(l.includes('combo')) return '⭐';
  if(l.includes('barba')) return '🪒';
  if(l.includes('pigment')) return '🎨';
  if(l.includes('relax')) return '💆';
  return '✂️';
}

// ── TOAST ──
let toastTimer=null;
function showToast(msg,type='default'){
  const t=document.getElementById('toast');
  if(toastTimer) clearTimeout(toastTimer);
  t.textContent=msg; t.className='toast'+(type!=='default'?' toast-'+type:'');
  void t.offsetWidth; t.classList.add('show');
  toastTimer=setTimeout(()=>t.classList.remove('show'),3000);
}

// ── INIT ──
function iniciarApp(){
  const rd=document.getElementById('r-data');
  const gd=document.getElementById('g-data');
  if(rd) rd.valueAsDate=today;
  if(document.getElementById('r-hora')) document.getElementById('r-hora').value='09:00';
  if(gd) gd.valueAsDate=today;
  startListeners();
}
window._iniciarApp = iniciarApp;
if(window._loginOk) iniciarApp();

// ── FIREBASE LISTENERS ──
function mostrarApp(){
  document.getElementById('loading').classList.add('hide');
  document.getElementById('app-header').style.display='flex';
  document.getElementById('app-main').style.display='block';
  document.getElementById('bottom-nav').style.display='flex';
}
function startListeners(){
  // Timeout de segurança — se demorar mais de 8s, mostra o app mesmo assim
  const safetyTimer = setTimeout(()=>{
    mostrarApp();
    showToast('Conexão lenta. Verifique a internet.','warning');
  }, 8000);

  let primeiraVenda=false;
  // Vendas
  onSnapshot(query(collection(db,'vendas'),orderBy('criadoEm','desc')), snap=>{
    vendas=snap.docs.map(d=>({id:d.id,...d.data()}));
    renderVendas();
    if(!primeiraVenda){ primeiraVenda=true; clearTimeout(safetyTimer); mostrarApp(); }
  }, err=>{
    console.error('Erro vendas:',err);
    clearTimeout(safetyTimer);
    mostrarApp();
    showToast('Erro ao conectar. Recarregue a página.','error');
  });

  // Agendamentos
  onSnapshot(query(collection(db,'agendamentos'),orderBy('criadoEm','desc')), snap=>{
    reservas=snap.docs.map(d=>({id:d.id,...d.data()}));
    renderLista(); renderChecklist();
  }, err=>console.error('Erro agendamentos:',err));

  // Gastos
  onSnapshot(query(collection(db,'gastos'),orderBy('data','desc')), snap=>{
    gastos=snap.docs.map(d=>({id:d.id,...d.data()}));
  }, err=>console.error('Erro gastos:',err));
}

// ── NAV ──
window.switchView=function(v,btn){
  document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el=>el.classList.remove('active'));
  document.getElementById('view-'+v).classList.add('active');
  if(btn) btn.classList.add('active');
  document.querySelectorAll('.bnav-btn').forEach(el=>el.classList.remove('active'));
  const b=document.getElementById('bnav-'+v); if(b) b.classList.add('active');
  if(v==='calendario') renderCal();
  if(v==='dashboard'){atualizarLabelDashMes();renderDash();}
  if(v==='gastos') renderGastos();
  if(v==='clientes') renderChecklist();
  if(v==='vendas') renderVendas();
};
window.switchViewMobile=function(v){
  document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.bnav-btn').forEach(el=>el.classList.remove('active'));
  document.getElementById('view-'+v).classList.add('active');
  document.getElementById('bnav-'+v).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(el=>el.classList.remove('active'));
  if(v==='calendario') renderCal();
  if(v==='dashboard'){atualizarLabelDashMes();renderDash();}
  if(v==='gastos') renderGastos();
  if(v==='clientes') renderChecklist();
  if(v==='vendas') renderVendas();
};
window.switchDashTab=function(tab){
  activeDashTab=tab;
  document.querySelectorAll('.dash-tab').forEach(el=>el.classList.remove('active'));
  ['geral','servicos','barbeiros','pgto'].forEach(t=>{const el=document.getElementById('dash-'+t);if(el)el.style.display='none';});
  document.getElementById('dtab-'+tab).classList.add('active');
  document.getElementById('dash-'+tab).style.display='block';
  renderDashCharts();
};

// ── VENDAS ──
window.selecionarServico=function(nome,btn){
  vendaServicoSel=nome;
  document.querySelectorAll('#servico-grid .vt-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('v-servico-custom').value='';
  atualizarResumoVenda();
};
window.selecionarPgtoVenda=function(forma,btn){
  vendaPgtoSel=forma;
  document.querySelectorAll('#pgto-rapido-grid .pr-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  atualizarResumoVenda();
};
document.getElementById('v-valor').addEventListener('input', atualizarResumoVenda);
document.getElementById('v-servico-custom').addEventListener('input', function(){
  if(this.value.trim()){
    vendaServicoSel=this.value.trim();
    document.querySelectorAll('#servico-grid .vt-btn').forEach(b=>b.classList.remove('selected'));
  }
  atualizarResumoVenda();
});
function atualizarResumoVenda(){
  const custom=document.getElementById('v-servico-custom').value.trim();
  const servico=custom||vendaServicoSel;
  const valor=parseFloat((document.getElementById('v-valor').value||'').replace(',','.'))||0;
  const barb=document.getElementById('v-barbeiro').value;
  const resumo=document.getElementById('resumo-venda');
  if(servico||valor||vendaPgtoSel){
    resumo.style.display='block';
    document.getElementById('rv-servico').textContent=servico||'—';
    document.getElementById('rv-barbeiro').textContent=barb||'—';
    document.getElementById('rv-pgto').textContent=vendaPgtoSel||'—';
    document.getElementById('rv-valor').textContent='R$ '+(valor||0).toFixed(2);
  } else { resumo.style.display='none'; }
}
window.addVenda=async function(){
  const custom=document.getElementById('v-servico-custom').value.trim();
  const servico=custom||vendaServicoSel;
  const barbeiro=document.getElementById('v-barbeiro').value;
  const nome=document.getElementById('v-nome').value.trim();
  const valor=parseFloat((document.getElementById('v-valor').value||'').replace(',','.'))||0;
  if(!barbeiro){alert('Selecione o barbeiro.');return;}
  if(!servico){alert('Selecione ou digite o serviço.');return;}
  if(!valor||valor<=0){alert('Digite o valor da venda.');return;}
  if(!vendaPgtoSel){alert('Selecione a forma de pagamento.');return;}
  const btn=document.getElementById('btn-add-venda');
  btn.disabled=true; btn.textContent='Salvando...';
  try{
    await addDoc(collection(db,'vendas'),{nome,barbeiro,servico,valor,formaPagamento:vendaPgtoSel,data:dataHoje(),hora:fmtHora(),tipo:'walkin',criadoEm:serverTimestamp()});
    document.getElementById('v-nome').value='';
    document.getElementById('v-barbeiro').value='';
    document.getElementById('v-valor').value='';
    document.getElementById('v-servico-custom').value='';
    document.querySelectorAll('#servico-grid .vt-btn').forEach(b=>b.classList.remove('selected'));
    document.querySelectorAll('#pgto-rapido-grid .pr-btn').forEach(b=>b.classList.remove('selected'));
    vendaServicoSel=null; vendaPgtoSel=null;
    document.getElementById('resumo-venda').style.display='none';
    showToast('✓ Venda registrada!','success');
  } catch(e){alert('Erro: '+e.message);}
  btn.disabled=false; btn.textContent='✓ Registrar venda';
};
window.switchFiltro=function(f){
  filtroAtivo=f;
  document.querySelectorAll('.ftab').forEach(b=>b.classList.remove('active'));
  document.getElementById('ftab-'+f).classList.add('active');
  renderVendas();
};
window.delVenda=async function(id){
  if(!confirm('Remover esta venda?')) return;
  try{await deleteDoc(doc(db,'vendas',id));showToast('Venda removida.','error');}
  catch(e){alert('Erro: '+e.message);}
};
function renderVendas(){
  const hoje=dataHoje();
  const inicioSem=new Date(today); inicioSem.setDate(today.getDate()-today.getDay());
  const inicioSemStr=inicioSem.toISOString().split('T')[0];
  let lista=vendas;
  if(filtroAtivo==='hoje') lista=vendas.filter(v=>v.data===hoje);
  else if(filtroAtivo==='semana') lista=vendas.filter(v=>v.data>=inicioSemStr);
  const totalHoje=vendas.filter(v=>v.data===hoje).reduce((s,v)=>s+Number(v.valor),0);
  document.getElementById('hoje-total').textContent='R$ '+totalHoje.toFixed(2);
  const el=document.getElementById('lista-vendas');
  if(!lista.length){
    el.innerHTML='<div class="empty"><span class="ic">💰</span>'+(filtroAtivo==='hoje'?'Nenhuma venda hoje ainda.':filtroAtivo==='semana'?'Nenhuma venda esta semana.':'Nenhuma venda registrada.')+'</div>';
    return;
  }
  el.innerHTML=lista.map(v=>`
    <div class="rcard venda-card">
      <div class="tbadge ${servicoBc(v.servico)}">${servicoIcon(v.servico)}</div>
      <div class="ri">
        <div class="rn">${v.nome||'Cliente walk-in'}</div>
        <div class="rs">${v.servico} · ${v.formaPagamento}${v.barbeiro?' · ✂️ '+v.barbeiro:''}</div>
        <div class="pgto-tag tag-venda" style="margin-top:4px">✓ Pago</div>
      </div>
      <div class="rr"><div class="rv">R$ ${Number(v.valor).toFixed(2)}</div><div class="rh">${fmtData(v.data)} ${v.hora||''}</div></div>
      <button class="btn-ghost" onclick="delVenda('${v.id}')">✕</button>
    </div>`).join('');
}

// ── MODAL AGENDAMENTO ──
window.abrirModal=function(id){
  const r=reservas.find(x=>x.id===id); if(!r) return;
  modalId=id; pgtoSel=null; sinalPgtoSel=null;
  document.getElementById('modal-nome').textContent=r.nome;
  document.getElementById('modal-tel').textContent=r.tel?'📞 '+r.tel:'';
  document.getElementById('modal-info').textContent=r.obs||'';
  document.getElementById('modal-servico').textContent=r.servico;
  document.getElementById('modal-barbeiro').textContent=r.barbeiro||'—';
  document.getElementById('modal-datahora').textContent=fmtData(r.data)+' às '+r.hora;
  document.getElementById('modal-valor').textContent='R$ '+Number(r.valor).toFixed(2);
  ['pix','dinheiro','debito','credito'].forEach(k=>{
    document.getElementById('pgto-'+k).classList.remove('selected');
    document.getElementById('spgto-'+k).classList.remove('selected');
  });
  document.getElementById('btn-confirmar-pgto').disabled=true;
  document.getElementById('btn-confirmar-sinal').disabled=true;
  document.getElementById('sinal-valor').value='';
  if(r.pago){
    document.getElementById('modal-pago-status').style.display='flex';
    document.getElementById('modal-forma-paga').textContent=r.formaPagamento||'—';
    document.getElementById('modal-ag-status').style.display='none';
    document.getElementById('modal-pgto-section').style.display='none';
    document.getElementById('modal-sinal-box').style.display='none';
    document.getElementById('btn-cancelar-pgto').style.display='block';
  } else {
    document.getElementById('modal-pago-status').style.display='none';
    document.getElementById('modal-ag-status').style.display='flex';
    document.getElementById('modal-pgto-section').style.display='block';
    document.getElementById('btn-cancelar-pgto').style.display='none';
    document.getElementById('modal-sinal-box').style.display='block';
    if(r.sinal&&r.sinal.valor){
      document.getElementById('modal-sinal-pago-info').style.display='flex';
      document.getElementById('modal-sinal-valor-pago').textContent='R$ '+Number(r.sinal.valor).toFixed(2);
      document.getElementById('modal-sinal-forma-paga').textContent=r.sinal.forma||'—';
      document.getElementById('modal-sinal-form').style.display='none';
      document.getElementById('btn-remover-sinal').style.display='block';
    } else {
      document.getElementById('modal-sinal-pago-info').style.display='none';
      document.getElementById('modal-sinal-form').style.display='block';
      document.getElementById('btn-remover-sinal').style.display='none';
    }
  }
  document.getElementById('modal-overlay').classList.add('open');
};
window.fecharModal=function(e){if(e&&e.target!==document.getElementById('modal-overlay'))return;closeModal();};
window.closeModal=function(){document.getElementById('modal-overlay').classList.remove('open');modalId=null;pgtoSel=null;sinalPgtoSel=null;};

window.selecionarSinalPgto=function(f){
  sinalPgtoSel=f;
  ['pix','dinheiro','debito','credito'].forEach(k=>document.getElementById('spgto-'+k).classList.remove('selected'));
  const m={'Pix':'pix','Dinheiro':'dinheiro','Débito':'debito','Crédito':'credito'};
  document.getElementById('spgto-'+m[f]).classList.add('selected');
  const v=parseFloat((document.getElementById('sinal-valor').value||'').replace(',','.'));
  document.getElementById('btn-confirmar-sinal').disabled=!(v>0&&sinalPgtoSel);
};
document.getElementById('sinal-valor').addEventListener('input',function(){
  const v=parseFloat((this.value||'').replace(',','.'));
  document.getElementById('btn-confirmar-sinal').disabled=!(v>0&&sinalPgtoSel);
});
window.confirmarSinal=async function(){
  const v=parseFloat((document.getElementById('sinal-valor').value||'').replace(',','.'));
  if(!modalId||!sinalPgtoSel||!v) return;
  try{await setDoc(doc(db,'agendamentos',modalId),{sinal:{valor:v,forma:sinalPgtoSel}},{merge:true});showToast('✓ Sinal de R$ '+v.toFixed(2)+' registrado!','success');closeModal();}
  catch(e){alert('Erro: '+e.message);}
};
window.removerSinal=async function(){
  if(!modalId||!confirm('Remover sinal?')) return;
  try{await setDoc(doc(db,'agendamentos',modalId),{sinal:null},{merge:true});showToast('Sinal removido.','warning');closeModal();}
  catch(e){alert('Erro: '+e.message);}
};
window.selecionarPgto=function(f){
  pgtoSel=f;
  ['pix','dinheiro','debito','credito'].forEach(k=>document.getElementById('pgto-'+k).classList.remove('selected'));
  const m={'Pix':'pix','Dinheiro':'dinheiro','Débito':'debito','Crédito':'credito'};
  document.getElementById('pgto-'+m[f]).classList.add('selected');
  document.getElementById('btn-confirmar-pgto').disabled=false;
};
window.confirmarPagamento=async function(){
  if(!modalId||!pgtoSel) return;
  const btn=document.getElementById('btn-confirmar-pgto');
  btn.disabled=true; btn.textContent='Salvando...';
  try{await setDoc(doc(db,'agendamentos',modalId),{pago:true,formaPagamento:pgtoSel},{merge:true});showToast('✓ Pagamento via '+pgtoSel+'!','success');closeModal();}
  catch(e){alert('Erro: '+e.message);btn.disabled=false;btn.textContent='Confirmar pagamento';}
};
window.cancelarPagamento=async function(){
  if(!modalId||!confirm('Cancelar pagamento?')) return;
  try{await setDoc(doc(db,'agendamentos',modalId),{pago:false,formaPagamento:''},{merge:true});showToast('Pagamento cancelado.','warning');closeModal();}
  catch(e){alert('Erro: '+e.message);}
};

// ── AGENDAMENTOS ──
window.addReserva=async function(){
  const nome=document.getElementById('r-nome').value.trim();
  const tel=document.getElementById('r-tel').value.trim();
  const barbeiro=document.getElementById('r-barbeiro').value;
  const servico=document.getElementById('r-servico').value;
  const data=document.getElementById('r-data').value;
  const hora=document.getElementById('r-hora').value;
  const valor=parseFloat((document.getElementById('r-valor').value||'0').replace(',','.'))||0;
  const obs=document.getElementById('r-obs').value.trim();
  if(!nome||!barbeiro||!data||!hora){alert('Preencha: nome, barbeiro, data e horário.');return;}
  const btn=document.getElementById('btn-add-reserva');
  btn.disabled=true; btn.textContent='Salvando...';
  try{
    await addDoc(collection(db,'agendamentos'),{nome,tel,barbeiro,servico,data,hora,valor,obs,pago:false,formaPagamento:'',sinal:null,fichaObs:'',criadoEm:serverTimestamp()});
    ['r-nome','r-tel','r-valor','r-obs'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('r-barbeiro').value='';
    showToast('Agendamento criado!','success');
  } catch(e){alert('Erro: '+e.message);}
  btn.disabled=false; btn.textContent='+ Agendar cliente';
};
window.delReserva=async function(id,e){
  e.stopPropagation();
  if(!confirm('Remover agendamento?')) return;
  try{await deleteDoc(doc(db,'agendamentos',id));showToast('Agendamento removido.','error');}
  catch(e){alert('Erro: '+e.message);}
};
function renderLista(){
  const el=document.getElementById('lista-reservas');
  if(!reservas.length){el.innerHTML='<div class="empty"><span class="ic">✂️</span>Nenhum agendamento ainda.</div>';return;}
  el.innerHTML=reservas.map(r=>{
    const tag=r.pago?`<div class="pgto-tag tag-pago">✓ ${r.formaPagamento||'Pago'}</div>`:r.sinal&&r.sinal.valor?`<div class="pgto-tag tag-sinal">💰 Sinal R$ ${Number(r.sinal.valor).toFixed(2)}</div>`:`<div class="pgto-tag tag-pend">Aguardando pgto</div>`;
    const barb=r.barbeiro?`<span class="barb-badge">✂️ ${r.barbeiro}</span>`:'';
    return `<div class="rcard${r.pago?' pago':''}" onclick="abrirModal('${r.id}')">
      <div class="tbadge ${servicoBc(r.servico)}">${servicoIcon(r.servico)}</div>
      <div class="ri"><div class="rn">${r.nome}</div><div class="rs">${r.servico}${r.tel?' · '+r.tel:''}${r.obs?' · '+r.obs:''}</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">${barb}${tag}</div></div>
      <div class="rr"><div class="rv">R$ ${Number(r.valor).toFixed(2)}</div><div class="rh">${fmtData(r.data)} ${r.hora}</div></div>
      <button class="btn-ghost" onclick="delReserva('${r.id}',event)">✕</button>
    </div>`;
  }).join('');
}

// ── CALENDÁRIO ──
window.calNav=function(dir){calDate=new Date(calDate.getFullYear(),calDate.getMonth()+dir,1);renderCal();};
function renderCal(){
  const y=calDate.getFullYear(),m=calDate.getMonth();
  document.getElementById('cal-title').textContent=MESES[m]+' '+y;
  const first=new Date(y,m,1).getDay(),total=new Date(y,m+1,0).getDate(),prev=new Date(y,m,0).getDate();
  let html=DIAS.map(d=>`<div class="cal-lbl">${d}</div>`).join('');
  for(let i=0;i<first;i++) html+=`<div class="cal-cell other"><div class="cal-num">${prev-first+i+1}</div></div>`;
  for(let d=1;d<=total;d++){
    const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dr=reservas.filter(r=>r.data===ds);
    const dv=vendas.filter(v=>v.data===ds);
    const isT=today.getFullYear()===y&&today.getMonth()===m&&today.getDate()===d;
    const dotsR=dr.slice(0,2).map(r=>`<div class="cal-dot dc1">${r.hora} ${r.nome.split(' ')[0]}</div>`).join('');
    const dotsV=dv.slice(0,1).map(v=>`<div class="cal-dot dc2">${v.hora||''} ${v.nome||'Walk-in'}</div>`).join('');
    html+=`<div class="cal-cell${isT?' today':''}${selDay===ds?' selected':''}" onclick="selectDay('${ds}')"><div class="cal-num">${d}</div>${dotsR}${dotsV}</div>`;
  }
  for(let d=1;d<=42-first-total;d++) html+=`<div class="cal-cell other"><div class="cal-num">${d}</div></div>`;
  document.getElementById('cal-grid').innerHTML=html;
  if(selDay) showCalDetail(selDay); else document.getElementById('cal-det').innerHTML='';
}
window.selectDay=function(ds){selDay=ds;renderCal();};
function showCalDetail(ds){
  const dr=reservas.filter(r=>r.data===ds);
  const dv=vendas.filter(v=>v.data===ds);
  const d=fmtData(ds); const el=document.getElementById('cal-det');
  const total=dr.length+dv.length;
  if(!total){el.innerHTML=`<div class="cal-det"><div class="cal-det-title">${d}</div><p style="color:var(--muted);font-size:13px">Nenhum atendimento neste dia.</p></div>`;return;}
  const rowsAg=dr.map(r=>`<div class="cal-row" onclick="abrirModal('${r.id}')">
    <div class="tbadge ${servicoBc(r.servico)}" style="width:36px;height:36px;font-size:16px;flex-shrink:0">${servicoIcon(r.servico)}</div>
    <div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600">${r.nome}</div><div style="font-size:12px;color:var(--muted)">${r.servico}${r.barbeiro?' · '+r.barbeiro:''}</div></div>
    <div style="text-align:right;flex-shrink:0"><div style="font-family:'Playfair Display',serif;font-size:18px">R$ ${Number(r.valor).toFixed(2)}</div><div style="font-size:11px;color:var(--muted)">${r.hora} · ${r.pago?'✓ Pago':'Pendente'}</div></div>
    <div style="color:var(--muted);font-size:16px;padding-left:4px">›</div>
  </div>`).join('');
  const rowsV=dv.map(v=>`<div class="cal-row">
    <div class="tbadge ${servicoBc(v.servico)}" style="width:36px;height:36px;font-size:16px;flex-shrink:0">${servicoIcon(v.servico)}</div>
    <div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600">${v.nome||'Walk-in'}</div><div style="font-size:12px;color:var(--muted)">${v.servico}${v.barbeiro?' · '+v.barbeiro:''} · ${v.formaPagamento}</div></div>
    <div style="text-align:right;flex-shrink:0"><div style="font-family:'Playfair Display',serif;font-size:18px">R$ ${Number(v.valor).toFixed(2)}</div><div style="font-size:11px;color:#27ae60">${v.hora||''} · ✓ Pago</div></div>
  </div>`).join('');
  el.innerHTML=`<div class="cal-det"><div class="cal-det-title">${d} — ${total} atendimento${total>1?'s':''}</div>${rowsAg}${rowsV}</div>`;
}

// ── CLIENTES ──
function renderChecklist(){
  const el=document.getElementById('lista-checklist');
  if(!reservas.length){el.innerHTML='<div class="empty"><span class="ic">👤</span>Nenhum cliente ainda.</div>';return;}
  el.innerHTML=reservas.map(r=>{
    const temObs=r.fichaObs&&r.fichaObs.trim().length>0;
    return `<div class="ck-card">
      <div class="ck-head" onclick="toggleCk('${r.id}')">
        <div class="tbadge ${servicoBc(r.servico)}" style="flex-shrink:0">${servicoIcon(r.servico)}</div>
        <div class="ck-head-info"><div class="ck-nome">${r.nome}</div><div class="ck-sub">${r.servico}${r.barbeiro?' · ✂️ '+r.barbeiro:''} · ${fmtData(r.data)} ${r.hora}</div></div>
        <span class="ck-status ${temObs?'ck-ok':'ck-pend'}">${temObs?'✓ Com ficha':'Sem ficha'}</span>
        <button class="ck-toggle" onclick="event.stopPropagation();toggleCk('${r.id}')">&#8964;</button>
      </div>
      <div class="ck-body" id="ck-body-${r.id}">
        <div style="margin-top:14px">
          <div class="sec" style="margin-bottom:10px">Ficha do cliente</div>
          ${temObs?`<div class="ck-obs-text">${esc(r.fichaObs)}</div>`:''}
          <div class="ck-form">
            <div class="field"><label>Preferências, histórico e observações</label><textarea id="obs-${r.id}" placeholder="Ex: Prefere degradê baixo, alergia a certos produtos...">${esc(r.fichaObs||'')}</textarea></div>
            <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn-sm" onclick="salvarObs('${r.id}')">Salvar ficha</button><button class="btn-ghost" onclick="document.getElementById('obs-${r.id}').value=''">Limpar</button></div>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}
window.toggleCk=function(id){document.getElementById('ck-body-'+id).classList.toggle('open');};
window.salvarObs=async function(id){
  const obs=document.getElementById('obs-'+id).value.trim();
  try{await setDoc(doc(db,'agendamentos',id),{fichaObs:obs},{merge:true});showToast('Ficha salva!','success');renderChecklist();}
  catch(e){alert('Erro: '+e.message);}
};

// ── DASHBOARD ──
function atualizarLabelDashMes(){
  const el=document.getElementById('dash-mes-label');
  if(el) el.textContent=MESES[dashMes].substring(0,3).toUpperCase()+' '+dashAno;
}
window.dashNavMes=function(dir){
  dashMes+=dir;
  if(dashMes>11){dashMes=0;dashAno++;} if(dashMes<0){dashMes=11;dashAno--;}
  atualizarLabelDashMes(); renderDash();
};
function destroyCharts(){Object.values(charts).forEach(c=>{if(c)c.destroy();});charts={};}
function mkChart(id,type,labels,datasets,opts={}){
  const base={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}};
  if(type!=='doughnut'&&type!=='pie'){
    base.scales={y:{beginAtZero:true,grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#5a6a85',...(opts.yTick||{})}},x:{grid:{display:false},ticks:{color:'#5a6a85',...(opts.xTick||{})}}};
  }
  if(opts.indexAxis) base.indexAxis=opts.indexAxis;
  if(opts.cutout) base.cutout=opts.cutout;
  charts[id]=new Chart(document.getElementById(id),{type,data:{labels,datasets},options:base});
}
function renderDash(){
  atualizarLabelDashMes();
  // cards de hoje
  const hoje=dataHoje();
  const vendasHoje=vendas.filter(v=>v.data===hoje);
  const agHoje=reservas.filter(r=>r.pago&&r.data===hoje);
  const fatHoje=vendasHoje.reduce((s,v)=>s+Number(v.valor),0)+agHoje.reduce((s,r)=>s+Number(r.valor),0);
  const atHoje=vendasHoje.length+agHoje.length;
  const elFat=document.getElementById("hoje-faturamento");
  const elAt=document.getElementById("hoje-atendimentos");
  if(elFat) elFat.textContent="R$ "+fatHoje.toFixed(2);
  if(elAt) elAt.textContent=atHoje;
  // metricas do mes
  const y=dashAno,m=dashMes;
  const inMonth=(data)=>{if(!data)return false;const d=parseLocal(data);return d.getFullYear()===y&&d.getMonth()===m;};
  const mV=vendas.filter(v=>inMonth(v.data));
  const mAP=reservas.filter(r=>r.pago&&inMonth(r.data));
  const mG=gastos.filter(g=>inMonth(g.data));
  const recV=mV.reduce((s,v)=>s+Number(v.valor),0);
  const recA=mAP.reduce((s,r)=>s+Number(r.valor),0);
  const rec=recV+recA;
  const gas=mG.reduce((s,g)=>s+(g.total||Number(g.valor)),0);
  const luc=rec-gas; const total=mV.length+mAP.length;
  const ticket=total?rec/total:0; const margem=rec>0?(luc/rec*100):0;
  document.getElementById('m-receita').textContent='R$ '+rec.toFixed(2);
  document.getElementById('m-qtd').textContent=total;
  document.getElementById('m-gastos').textContent='R$ '+gas.toFixed(2);
  const elL=document.getElementById('m-lucro');
  elL.textContent='R$ '+luc.toFixed(2); elL.style.color=luc>=0?'#27ae60':'#e74c3c';
  document.getElementById('m-ticket').textContent='R$ '+ticket.toFixed(0);
  document.getElementById('m-walkin').textContent=mV.length;
  document.getElementById('m-agpagos').textContent=mAP.length;
  const elM=document.getElementById('m-margem');
  elM.textContent=margem.toFixed(0)+'%';
  elM.style.color=margem>=50?'#27ae60':margem>=20?'#d4aa5a':'#e74c3c';
  renderDashCharts();
}
function renderDashCharts(){
  destroyCharts();
  Chart.defaults.color='#5a6a85';
  Chart.defaults.borderColor='rgba(255,255,255,0.05)';
  const y=dashAno,m=dashMes;
  const inMonth=(data)=>{if(!data)return false;const d=parseLocal(data);return d.getFullYear()===y&&d.getMonth()===m;};
  const mV=vendas.filter(v=>inMonth(v.data));
  const mAP=reservas.filter(r=>r.pago&&inMonth(r.data));
  const mG=gastos.filter(g=>inMonth(g.data));
  const todos=[...mV,...mAP];
  const rec=todos.reduce((s,x)=>s+Number(x.valor),0);
  const gas=mG.reduce((s,g)=>s+(g.total||Number(g.valor)),0);

  if(activeDashTab==='geral'){
    const cats={Corte:0,'Corte+Barba':0,Barba:0,Tratamento:0,Outros:0};
    todos.forEach(x=>{const s=(x.servico||'').toLowerCase();if(s.includes('combo')||(s.includes('corte')&&s.includes('barba')))cats['Corte+Barba']+=Number(x.valor);else if(s.includes('corte'))cats['Corte']+=Number(x.valor);else if(s.includes('barba'))cats['Barba']+=Number(x.valor);else if(s.includes('pigment')||s.includes('relax')||s.includes('luzes')||s.includes('hidrat'))cats['Tratamento']+=Number(x.valor);else cats['Outros']+=Number(x.valor);});
    const cc=['#c0392b','#2563eb','#d4aa5a','#27ae60','#5a6a85'];
    document.getElementById('leg-cat').innerHTML=Object.keys(cats).map((k,i)=>`<span><span class="lsq" style="background:${cc[i]}"></span>${k} R$ ${cats[k].toFixed(0)}</span>`).join('');
    mkChart('ch-cat','doughnut',Object.keys(cats),[{data:Object.values(cats),backgroundColor:cc,borderWidth:0}],{cutout:'60%'});
    document.getElementById('leg-rg').innerHTML=`<span><span class="lsq" style="background:#c0392b"></span>Receita R$ ${rec.toFixed(0)}</span><span><span class="lsq" style="background:#2563eb"></span>Gastos R$ ${gas.toFixed(0)}</span>`;
    mkChart('ch-rg','bar',['Este mês'],[{data:[rec],backgroundColor:'#c0392b',borderRadius:4,borderWidth:0},{data:[gas],backgroundColor:'#2563eb',borderRadius:4,borderWidth:0}],{yTick:{callback:v=>'R$'+v}});
    const recV=mV.reduce((s,v)=>s+Number(v.valor),0);
    const recA=mAP.reduce((s,r)=>s+Number(r.valor),0);
    document.getElementById('leg-tipo').innerHTML=`<span><span class="lsq" style="background:#c0392b"></span>Walk-in R$ ${recV.toFixed(0)} (${mV.length})</span><span><span class="lsq" style="background:#2563eb"></span>Agendados R$ ${recA.toFixed(0)} (${mAP.length})</span>`;
    mkChart('ch-tipo','doughnut',['Walk-in','Agendamentos'],[{data:[recV,recA],backgroundColor:['#c0392b','#2563eb'],borderWidth:0}],{cutout:'55%'});
  }
  if(activeDashTab==='servicos'){
    const sc={},sr={};
    todos.forEach(x=>{sc[x.servico]=(sc[x.servico]||0)+1;sr[x.servico]=(sr[x.servico]||0)+Number(x.valor);});
    const sl=Object.keys(sc).sort((a,b)=>sc[b]-sc[a]);
    document.getElementById('leg-serv').innerHTML=sl.map((l,i)=>`<span><span class="lsq" style="background:${COLS[i%8]}"></span>${l} (${sc[l]})</span>`).join('');
    mkChart('ch-serv','bar',sl.length?sl:['—'],[{data:sl.length?sl.map(l=>sc[l]):[0],backgroundColor:sl.map((_,i)=>COLS[i%8]),borderWidth:0}],{indexAxis:'y',xTick:{stepSize:1}});
    const sl2=Object.keys(sr).sort((a,b)=>sr[b]-sr[a]);
    mkChart('ch-serv-rec','bar',sl2.length?sl2:['—'],[{data:sl2.length?sl2.map(l=>sr[l]):[0],backgroundColor:sl2.map((_,i)=>COLS[i%8]),borderWidth:0}],{indexAxis:'y',yTick:{callback:v=>'R$'+v}});
  }
  if(activeDashTab==='barbeiros'){
    const bq={},br={};
    todos.forEach(x=>{const b=x.barbeiro||'N/I';bq[b]=(bq[b]||0)+1;br[b]=(br[b]||0)+Number(x.valor);});
    const bl=Object.keys(bq).sort((a,b)=>bq[b]-bq[a]);
    mkChart('ch-barb','bar',bl.length?bl:['—'],[{data:bl.length?bl.map(l=>bq[l]):[0],backgroundColor:bl.map((_,i)=>COLS[i%8]),borderRadius:4,borderWidth:0}]);
    const bl2=Object.keys(br).sort((a,b)=>br[b]-br[a]);
    mkChart('ch-barb-rec','bar',bl2.length?bl2:['—'],[{data:bl2.length?bl2.map(l=>br[l]):[0],backgroundColor:bl2.map((_,i)=>COLS[i%8]),borderRadius:4,borderWidth:0}],{yTick:{callback:v=>'R$'+v}});
  }
  if(activeDashTab==='pgto'){
    const fp={},fr={};
    todos.forEach(x=>{const f=x.formaPagamento||'Outro';fp[f]=(fp[f]||0)+1;fr[f]=(fr[f]||0)+Number(x.valor);});
    const fl=Object.keys(fp);
    document.getElementById('leg-pgto').innerHTML=fl.map((l,i)=>`<span><span class="lsq" style="background:${COLS[i%8]}"></span>${l} (${fp[l]})</span>`).join('');
    mkChart('ch-pgto','doughnut',fl.length?fl:['—'],[{data:fl.length?fl.map(l=>fp[l]):[1],backgroundColor:fl.length?fl.map((_,i)=>COLS[i%8]):['#2a3550'],borderWidth:0}],{cutout:'55%'});
    const fl2=Object.keys(fr);
    document.getElementById('leg-pgto-rec').innerHTML=fl2.map((l,i)=>`<span><span class="lsq" style="background:${COLS[i%8]}"></span>${l} R$ ${fr[l].toFixed(0)}</span>`).join('');
    mkChart('ch-pgto-rec','bar',fl2.length?fl2:['—'],[{data:fl2.length?fl2.map(l=>fr[l]):[0],backgroundColor:fl2.map((_,i)=>COLS[i%8]),borderRadius:4,borderWidth:0}],{yTick:{callback:v=>'R$'+v}});
  }
}

// ── GASTOS ──
window.addGasto=async function(){
  const desc=document.getElementById('g-desc').value.trim();
  const cat=document.getElementById('g-cat').value;
  const valor=parseFloat((document.getElementById('g-valor').value||'0').replace(',','.'))||0;
  const qtd=parseInt(document.getElementById('g-qtd').value)||1;
  const data=document.getElementById('g-data').value;
  if(!desc||!data||!valor){alert('Preencha descrição, valor e data.');return;}
  const btn=document.getElementById('btn-add-gasto');
  btn.disabled=true; btn.textContent='Salvando...';
  try{
    await addDoc(collection(db,'gastos'),{desc,cat,valor,qtd,total:valor*qtd,data,criadoEm:serverTimestamp()});
    document.getElementById('g-desc').value='';
    document.getElementById('g-valor').value='';
    document.getElementById('g-qtd').value='1';
    showToast('Gasto lançado!','success');
  } catch(e){alert('Erro: '+e.message);}
  btn.disabled=false; btn.textContent='+ Lançar gasto';
};
window.delGasto=async function(id){
  if(!confirm('Remover este gasto?')) return;
  try{await deleteDoc(doc(db,'gastos',id));showToast('Gasto removido.','error');}
  catch(e){alert('Erro: '+e.message);}
};
function renderGastos(){
  const el=document.getElementById('lista-gastos');
  if(!gastos.length){el.innerHTML='<div class="empty"><span class="ic">💸</span>Nenhum gasto lançado.</div>';document.getElementById('total-gastos').innerHTML='';return;}
  el.innerHTML=gastos.map(g=>{
    const qtd=g.qtd||1; const total=g.total||Number(g.valor)*qtd;
    const qi=qtd>1?`<span class="gqtd">${qtd}x R$ ${Number(g.valor).toFixed(2)}</span>`:'';
    return `<div class="grow"><span class="gcat">${g.cat}</span><span class="gdesc">${g.desc}${qi}</span><span class="gdata">${fmtData(g.data)}</span><span class="gval">− R$ ${total.toFixed(2)}</span><button class="btn-ghost" onclick="delGasto('${g.id}')">✕</button></div>`;
  }).join('');
  const total=gastos.reduce((s,g)=>s+(g.total||Number(g.valor)),0);
  document.getElementById('total-gastos').innerHTML=`Total de gastos: <strong>R$ ${total.toFixed(2)}</strong>`;
}

window.renderDash=renderDash;
window.renderGastos=renderGastos;
window.renderCal=renderCal;
window.renderChecklist=renderChecklist;
