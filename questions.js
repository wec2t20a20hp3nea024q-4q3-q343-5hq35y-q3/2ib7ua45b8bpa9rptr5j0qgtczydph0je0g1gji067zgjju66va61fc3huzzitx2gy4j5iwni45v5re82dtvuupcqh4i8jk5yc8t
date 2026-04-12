// questions.js —— 静态题库数据管理（支持科目/单元过滤）

// --------------------- 科目 & 单元常量 ---------------------
const subjects = [
    { id: '1', name: '计算机科学' },
    { id: '2', name: '数学' },
    { id: '3', name: '物理' }
];

const topics = [
    // 科目1：计算机科学
    { id: '01', subjectId: '1', name: '编程基础' },
    { id: '02', subjectId: '1', name: '数据结构' },
    { id: '03', subjectId: '1', name: '算法' },
    // 科目2：数学
    { id: '01', subjectId: '2', name: '代数' },
    { id: '02', subjectId: '2', name: '几何' },
    { id: '03', subjectId: '2', name: '概率' },
    // 科目3：物理
    { id: '01', subjectId: '3', name: '力学' },
    { id: '02', subjectId: '3', name: '电磁学' },
    { id: '03', subjectId: '3', name: '光学' }
];

// --------------------- 初始示例数据 ---------------------
const defaultQuestions = [
    {
        idx: '101001',
        statement: '<p>以下哪个是 JavaScript 的原始类型？</p>',
        choice: ['Number', 'Object', 'Array', 'Function'],
        letter: 'A',
        answer: '<p>Number 是原始类型，其他为引用类型。</p>'
    },
    {
        idx: '101002',
        statement: '<p>let a = 10; 中 typeof a 的结果是？</p>',
        choice: ['number', 'string', 'object', 'undefined'],
        letter: 'A',
        answer: '<p>typeof 10 返回 "number"。</p>'
    },
    {
        idx: '102001',
        statement: '<p>栈（Stack）的特点是？</p>',
        choice: ['先进先出', '后进先出', '按优先级', '随机'],
        letter: 'B',
        answer: '<p>栈是后进先出（LIFO）。</p>'
    },
    {
        idx: '201001',
        statement: '<p>解方程：2x + 5 = 13，x = ?</p>',
        choice: ['2', '3', '4', '5'],
        letter: 'C',
        answer: '<p>2x = 8，x = 4。</p>'
    }
];

// --------------------- 初始化 ---------------------
function initQuestionDB() {
    if (!localStorage.getItem('questionDB')) {
        localStorage.setItem('questionDB', JSON.stringify(defaultQuestions));
    }
}

function getAllQuestions() {
    initQuestionDB();
    return JSON.parse(localStorage.getItem('questionDB')) || [];
}

function saveQuestions(questions) {
    localStorage.setItem('questionDB', JSON.stringify(questions));
}

// --------------------- 索引生成 ---------------------
// 生成下一个题目序号（基于科目+单元）
function generateNextIdx(subjectId, topicId) {
    const questions = getAllQuestions();
    const prefix = subjectId + topicId; // 例如 '1' + '01' = '101'
    const sameUnit = questions.filter(q => q.idx.startsWith(prefix));
    if (sameUnit.length === 0) return prefix + '001';
    const maxNum = Math.max(...sameUnit.map(q => parseInt(q.idx.slice(3))));
    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    return prefix + nextNum;
}

// --------------------- 多题批量导入 ---------------------
// 解析形如：\\...\\ 每道题，内部用 ~ 分隔字段
// 字段顺序：statement ~ choice(JSON数组) ~ 答案选项(如 A) ~ answer(HTML)
function parseBulkInput(inputText) {
    const blocks = inputText.split(/\\\\/).filter(block => block.trim() !== '');
    const newQuestions = [];
    
    blocks.forEach(block => {
        const parts = block.split('~').map(s => s.trim());
        if (parts.length < 4) return; // 跳过格式错误
        
        const statement = parts[0];
        let choice = null;
        try {
            choice = JSON.parse(parts[1]);
        } catch (e) {
            choice = null;
        }
        const letter = parts[2].toUpperCase();
        const answer = parts[3];
        
        if (statement && answer) {
            newQuestions.push({ statement, choice, letter, answer });
        }
    });
    return newQuestions;
}

// 批量添加（需要指定科目和单元）
function addBulkQuestions(subjectId, topicId, questionsArray) {
    const all = getAllQuestions();
    questionsArray.forEach(q => {
        const idx = generateNextIdx(subjectId, topicId);
        all.push({
            idx,
            statement: q.statement,
            choice: q.choice,
            letter: q.letter,
            answer: q.answer
        });
    });
    saveQuestions(all);
    return questionsArray.length;
}

// --------------------- CRUD ---------------------
function addQuestion(subjectId, topicId, statement, choice, letter, answer) {
    const questions = getAllQuestions();
    const newQ = {
        idx: generateNextIdx(subjectId, topicId),
        statement,
        choice,
        letter: letter ? letter.toUpperCase() : null,
        answer
    };
    questions.push(newQ);
    saveQuestions(questions);
    return newQ.idx;
}

function getQuestionByIdx(idx) {
    return getAllQuestions().find(q => q.idx === idx);
}

function updateQuestion(idx, updatedData) {
    const questions = getAllQuestions();
    const index = questions.findIndex(q => q.idx === idx);
    if (index === -1) return false;
    questions[index] = { ...questions[index], ...updatedData };
    saveQuestions(questions);
    return true;
}

function deleteQuestion(idx) {
    const questions = getAllQuestions();
    const filtered = questions.filter(q => q.idx !== idx);
    saveQuestions(filtered);
    return true;
}

// --------------------- 过滤相关 ---------------------
// 保存过滤状态到 localStorage
function saveFilterState(subjectId, topicId) {
    localStorage.setItem('questionFilter', JSON.stringify({ subjectId, topicId }));
}

function loadFilterState() {
    const saved = localStorage.getItem('questionFilter');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return { subjectId: 'all', topicId: 'all' };
        }
    }
    return { subjectId: 'all', topicId: 'all' };
}

// 根据过滤条件获取题目
function getFilteredQuestions(subjectId, topicId) {
    const all = getAllQuestions();
    return all.filter(q => {
        const sub = q.idx.charAt(0);
        const top = q.idx.substring(1, 3);
        if (subjectId !== 'all' && sub !== subjectId) return false;
        if (topicId !== 'all' && top !== topicId) return false;
        return true;
    });
}

// --------------------- 辅助工具 ---------------------
function getSubjectNameById(id) {
    return subjects.find(s => s.id === id)?.name || '';
}

function getTopicNameById(subjectId, topicId) {
    return topics.find(t => t.subjectId === subjectId && t.id === topicId)?.name || '';
}

function getTopicsBySubjectId(subjectId) {
    return topics.filter(t => t.subjectId === subjectId);
}