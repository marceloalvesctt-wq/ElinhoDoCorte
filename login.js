/* ═══════════════════════════════════════
   ELINHO DO CORTE — Login
═══════════════════════════════════════ */

const USUARIOS = {'admin':'1234'};
window.fazerLogin = function(){
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const err  = document.getElementById('login-err');
  if(USUARIOS[user] && USUARIOS[user] === pass){
    err.textContent = '';
    sessionStorage.setItem('ec_logado','sim');
    document.getElementById('login-screen').classList.add('hide');
    document.getElementById('loading').classList.remove('hide');
    if(window._iniciarApp) window._iniciarApp();
    else window._loginOk = true;
  } else {
    err.textContent = 'Usuário ou senha incorretos.';
    document.getElementById('login-pass').value = '';
    document.getElementById('login-pass').focus();
  }
};
window.fazerLogout = function(){
  if(!confirm('Deseja sair?')) return;
  sessionStorage.removeItem('ec_logado');
  location.reload();
};
if(sessionStorage.getItem('ec_logado')==='sim'){
  document.getElementById('login-screen').classList.add('hide');
  document.getElementById('loading').classList.remove('hide');
  window._loginOk = true;
}
