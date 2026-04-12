// 获取当前用户显示
const userSpan = document.getElementById('currentUserDisplay');
if (userSpan) {
    userSpan.textContent = getCurrentUser() || '未知用户';
}

// 登出功能
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
    window.location.href = './login.html';
});

// 时钟更新
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
})();

// ---------- 游戏卡片数据（只保留您自己的游戏，请根据实际路径调整）----------
const gamesList = [
    { 
        name: "滑动华容道", 
        description: "", 
        url: "./games/hrd/index.html"   // 请确认您的游戏实际路径
    },
    {
      name:"Acid-Base neutralizing simulator",
      description:"Study purpost",
      url:"./games/chem/index.html"
    }
    // 您可以在此继续添加更多自己的游戏，格式同上
];

// 渲染游戏卡片到 main-content
function renderGames() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    
    mainContent.innerHTML = '';
    const gridContainer = document.createElement('div');
    gridContainer.className = 'games-grid';
    
    gamesList.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        
        const title = document.createElement('h3');
        title.textContent = game.name;
        
        const desc = document.createElement('p');
        desc.textContent = game.description;
        
        // 内部跳转：使用普通链接，在当前页面跳转
        const link = document.createElement('a');
        link.href = game.url;
        link.textContent = '开始游戏 →';
        link.className = 'game-link';
        
        card.appendChild(title);
        card.appendChild(desc);
        card.appendChild(link);
        gridContainer.appendChild(card);
    });
    
    mainContent.appendChild(gridContainer);
}

// 恢复默认占位内容（可选，用于其他链接如需恢复）
function renderDefaultContent() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    mainContent.innerHTML = `
        <div class="content-card">
            <h2>N/A</h2>
            <p>...</p>
            <p>...</p>
        </div>
        <div class="content-card">
            <h3>...</h3>
            <div class="placeholder-list">
                <span>...</span>
                <span>...</span>
                <span>...</span>
                <span>...</span>
            </div>
        </div>
    `;
}

// 更新右侧统计数据（题目总数）
function updateStatistics() {
    let totalQuestions = 0;
    const storedQuestions = localStorage.getItem('manage_questions');
    if (storedQuestions) {
        try {
            const questions = JSON.parse(storedQuestions);
            totalQuestions = questions.length;
        } catch(e) {}
    } else if (typeof database !== 'undefined' && Array.isArray(database)) {
        totalQuestions = database.length;
    }
    const countSpan = document.getElementById('totalQuestionsCount');
    if (countSpan) countSpan.textContent = totalQuestions;
}

// 监听 Games 链接，阻止默认跳转并渲染游戏卡片
document.addEventListener('DOMContentLoaded', () => {
    const gamesLink = document.getElementById('gamesLink');
    if (gamesLink) {
        gamesLink.addEventListener('click', (e) => {
            e.preventDefault();
            renderGames();
        });
    }
    
    updateStatistics();
});
