const userSpan = document.getElementById('currentUserDisplay');
if (userSpan) {
    userSpan.textContent = getCurrentUser() || '未知用户';
}
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
    window.location.href = './login.html';
});



(function(){
  function update_clock(){
    const cur=new Date();
    const h=cur.getHours().toString().padStart(2,'0');
    const m=cur.getMinutes().toString().padStart(2,'0');
    const s=cur.getSeconds().toString().padStart(2,'0');
    document.querySelector('.clock-time').textContent=`${h}:${m}:${s}`;
  }
  setInterval(update_clock,1000);
  update_clock();
})()
