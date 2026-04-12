// account.js —— 使用加密存储的账户数据

// 加密密钥（与 C++ 程序一致）
const ENCRYPT_KEY = "SecretPassword:)";

// 从 C++ 程序生成的密文（十六进制字符串）
const encryptedAccounts = [
    { usernameHex: "32010e1b0b", passwordHex: "61514b305d162923000115084b31721061560d4b4d3c7642" },
    { usernameHex: "210a0c06", passwordHex: "2b124a344f0363070341030140104d4c" },
    { usernameHex: "27001006", passwordHex: "27001006" },
];

function hexToString(hex) {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
}

function decrypt(encryptedHex) {
    const encrypted = hexToString(encryptedHex);
    let plain = '';
    for (let i = 0; i < encrypted.length; i++) {
        const charCode = encrypted.charCodeAt(i) ^ ENCRYPT_KEY.charCodeAt(i % ENCRYPT_KEY.length);
        plain += String.fromCharCode(charCode);
    }
    return plain;
}

function validateCredentials(username, password) {
    return encryptedAccounts.some(acc => {
        const storedUser = decrypt(acc.usernameHex);
        const storedPass = decrypt(acc.passwordHex);
        return storedUser === username && storedPass === password;
    });
}

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
