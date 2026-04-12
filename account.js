// account.js —— 模拟账户数据库与验证
const userAccounts = [
    { username: "admin", password: "123456" },
    { username: "chris", password: "qwer1234" },
    { username: "test", password: "test" }
];

// 验证凭据，成功返回 true
function validateCredentials(username, password) {
    return userAccounts.some(acc => acc.username === username && acc.password === password);
}

// 登录状态管理 (使用 sessionStorage，关闭标签页即失效)
function setLoginStatus(username) {
    sessionStorage.setItem('logged_on', 'true');
    sessionStorage.setItem('currentUser', username);
}

function logout() {
    sessionStorage.removeItem('logged_on');
    sessionStorage.removeItem('currentUser');
}

function logged_on() {
    return sessionStorage.getItem('logged_on') === 'true';
}

function getCurrentUser() {
    return sessionStorage.getItem('currentUser');
}