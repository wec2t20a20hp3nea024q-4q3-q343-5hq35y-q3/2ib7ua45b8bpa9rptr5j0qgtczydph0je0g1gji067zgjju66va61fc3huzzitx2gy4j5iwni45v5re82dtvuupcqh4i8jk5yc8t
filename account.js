// account.js —— 使用加密存储的账户数据

// 加密密钥（与 C++ 程序一致）
const ENCRYPT_KEY = "SecretPassword:)";

// 从 C++ 程序生成的密文（十六进制字符串）
const encryptedAccounts = [
    { usernameHex: "32010e1b0b", passwordHex: "61514b305d162923000115084b31721061560d4b4d3c7642" },
    { usernameHex: "210a0c06", passwordHex: "2b124a344f0363070341030140104d4c" },
    { usernameHex: "27001006", passwordHex: "27001006" },
];

// 十六进制字符串转普通字符串（解密前预处理）
function hexToString(hex) {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
}

// XOR 解密函数（与 C++ 加密算法互逆）
function decrypt(encryptedHex) {
    const encrypted = hexToString(encryptedHex);
    let plain = '';
    for (let i = 0; i < encrypted.length; i++) {
        const charCode = encrypted.charCodeAt(i) ^ ENCRYPT_KEY.charCodeAt(i % ENCRYPT_KEY.length);
        plain += String.fromCharCode(charCode);
    }
    return plain;
}

// 验证凭据：对输入的明文与存储的密文解密后比对
function validateCredentials(username, password) {
    return encryptedAccounts.some(acc => {
        const storedUser = decrypt(acc.usernameHex);
        const storedPass = decrypt(acc.passwordHex);
        return storedUser === username && storedPass === password;
    });
}

// 登录状态管理（存储加密后的用户名，防止查看）
function setLoginStatus(username) {
    // 简单加密用户名再存储（可复用上述加密函数）
    sessionStorage.setItem('logged_on', 'true');
    // 这里也可以对 username 加密存储，但 getCurrentUser 需要解密
    sessionStorage.setItem('currentUser', username); // 如需加密可自行添加
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
