// 用户资料页面脚本：从 localStorage 读取资料并显示，支持更新模拟数据，并显示 OJ 总分

document.addEventListener('DOMContentLoaded', function() {
    // ========== 统一获取当前用户名（与 OJ 页面一致）==========
    function getCurrentUsername() {
        if (typeof get_cur_user === 'function') return get_cur_user();
        if (typeof getCurrentUser === 'function') return getCurrentUser();
        return localStorage.getItem('currentUser');
    }

    // 从 localStorage 加载用户完整资料
    function loadUserProfile() {
        const username = getCurrentUsername();
        if (!username) return null;
        const storageKey = `userProfile_${username}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try { return JSON.parse(stored); } catch(e) { console.error(e); }
        }
        // 默认资料
        const defaultProfile = {
            username: username,
            email: `${username}@example.com`,
            regDate: new Date().toLocaleDateString('zh-CN'),
            lastLogin: new Date().toLocaleString('zh-CN')
        };
        localStorage.setItem(storageKey, JSON.stringify(defaultProfile));
        return defaultProfile;
    }

    function saveUserProfile(profile) {
        const username = getCurrentUsername();
        if (!username) return;
        localStorage.setItem(`userProfile_${username}`, JSON.stringify(profile));
    }

    // 读取 OJ 总分（与 OJ 页面键名一致）
    function loadOjScore() {
        const username = getCurrentUsername();
        if (!username) return 0;
        const scoreKey = `oj_score_${username}`;
        const score = localStorage.getItem(scoreKey);
        if (score !== null && !isNaN(parseInt(score))) {
            return parseInt(score, 10);
        }
        return 0;
    }

    function displayProfile(profile) {
        if (!profile) return;
        document.getElementById('profileUsername').textContent = profile.username || '未知';
        document.getElementById('profileEmail').textContent = profile.email || '未提供';
        document.getElementById('profileRegDate').textContent = profile.regDate || '未提供';
        document.getElementById('profileLastLogin').textContent = profile.lastLogin || '未提供';
        // 显示 OJ 总分（实时读取，确保最新）
        const ojScore = loadOjScore();
        document.getElementById('profileOjScore').textContent = ojScore;
    }

    function updateHeaderUser() {
        const username = getCurrentUsername();
        const headerSpan = document.getElementById('currentUserDisplay');
        if (headerSpan) headerSpan.textContent = username || '访客';
    }

    function promptUpdateProfile() {
        const profile = loadUserProfile();
        if (!profile) return;
        const newEmail = prompt('请输入新的电子邮箱地址：', profile.email);
        if (newEmail && newEmail.trim() !== '') {
            profile.email = newEmail.trim();
            profile.lastLogin = new Date().toLocaleString('zh-CN');
            saveUserProfile(profile);
            displayProfile(profile);
            alert('资料已更新！');
        } else if (newEmail === '') {
            alert('邮箱不能为空');
        }
    }

    function setupClock() {
        const clockSpan = document.querySelector('.clock-time');
        if (!clockSpan) return;
        function updateClock() {
            const now = new Date();
            clockSpan.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        }
        updateClock();
        setInterval(updateClock, 1000);
    }

    function setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (!logoutBtn) return;
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof logout === 'function') logout();
            else {
                localStorage.removeItem('currentUser');
                sessionStorage.clear();
            }
            window.location.href = '../login.html';
        });
    }

    function setupUpdateButton() {
        const updateBtn = document.getElementById('updateProfileBtn');
        if (updateBtn) updateBtn.addEventListener('click', promptUpdateProfile);
    }

    function init() {
        updateHeaderUser();
        const profile = loadUserProfile();
        if (profile) {
            displayProfile(profile);
        } else {
            document.getElementById('profileUsername').textContent = '未登录';
            document.getElementById('profileEmail').textContent = '请先登录';
            document.getElementById('profileRegDate').textContent = '—';
            document.getElementById('profileLastLogin').textContent = '—';
            document.getElementById('profileOjScore').textContent = '—';
        }
        setupLogout();
        setupClock();
        setupUpdateButton();
    }

    init();
});