// manage.js - 题目管理核心逻辑（支持HTML渲染、连续相同题目压缩、卡片间添加按钮、ESC关闭模态框）
const STORAGE_QUESTIONS_KEY = 'manage_questions';
const TEMPLATE_KEY = 'last_added_template';
const COMPRESSED_KEY = 'compress_enabled';

let questions = [];
let compactMode = false;
let currentEditIndex = null;
let compressedGroups = new Map(); // 存储压缩组信息：组索引 -> { originalIndices, count }

// DOM 元素
const questionsList = document.getElementById('questionsList');
const addBtn = document.getElementById('addQuestionBtn');
const toggleModeBtn = document.getElementById('toggleModeBtn');
const saveToLocalBtn = document.getElementById('saveToLocalBtn');
const modal = document.getElementById('questionModal');
const modalTitle = document.getElementById('modalTitle');
const questionForm = document.getElementById('questionForm');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const closeModalBtn = document.querySelector('.close-modal');

// 表单字段
const typeField = document.getElementById('type');
const subjectField = document.getElementById('subject');
const topicField = document.getElementById('topic');
const sourceField = document.getElementById('source');
const pointField = document.getElementById('point');
const statementField = document.getElementById('statement');
const choiceField = document.getElementById('choice');
const letterField = document.getElementById('letter');
const ansField = document.getElementById('ans');
const mcFields = document.getElementById('mcFields');

// 添加压缩控制按钮
function addCompressButton() {
    const headerActions = document.querySelector('.manage-actions');
    if (document.getElementById('compressBtn')) return;
    const compressBtn = document.createElement('button');
    compressBtn.id = 'compressBtn';
    compressBtn.className = 'btn-secondary';
    compressBtn.textContent = '压缩连续相同题目';
    headerActions.insertBefore(compressBtn, saveToLocalBtn);
    compressBtn.addEventListener('click', toggleCompression);
}

let compressEnabled = false;

// 判断两道题是否完全相同（用于压缩）
function isSameQuestion(q1, q2) {
    return JSON.stringify({
        type: q1.type,
        subject: q1.subject,
        topic: q1.topic,
        source: q1.source,
        point: q1.point,
        statement: q1.statement,
        choice: q1.choice,
        letter: q1.letter,
        ans: q1.ans
    }) === JSON.stringify({
        type: q2.type,
        subject: q2.subject,
        topic: q2.topic,
        source: q2.source,
        point: q2.point,
        statement: q2.statement,
        choice: q2.choice,
        letter: q2.letter,
        ans: q2.ans
    });
}

// 执行压缩（将连续相同的题目合并为一个，记录数量）
function compressQuestions() {
    if (questions.length === 0) return [];
    const compressed = [];
    const groups = [];
    let currentGroup = [questions[0]];
    for (let i = 1; i < questions.length; i++) {
        if (isSameQuestion(questions[i], questions[i-1])) {
            currentGroup.push(questions[i]);
        } else {
            groups.push(currentGroup);
            currentGroup = [questions[i]];
        }
    }
    groups.push(currentGroup);
    // 构建压缩后的数组和组映射
    const newQuestions = [];
    const newGroups = new Map();
    let newIdx = 0;
    for (let g of groups) {
        if (g.length > 1) {
            // 压缩：只保留第一个，并记录数量
            const representative = { ...g[0], _compressedCount: g.length, _originalIndices: [] };
            newQuestions.push(representative);
            newGroups.set(newIdx, { count: g.length, originalIndices: [] });
            newIdx++;
        } else {
            newQuestions.push(g[0]);
            newGroups.set(newIdx, { count: 1, originalIndices: [] });
            newIdx++;
        }
    }
    return { compressedQuestions: newQuestions, groupInfo: newGroups };
}

// 展开压缩（恢复原数组）
function expandQuestions(compressedQs, groupInfo) {
    const expanded = [];
    let compIdx = 0;
    for (let i = 0; i < compressedQs.length; i++) {
        const q = compressedQs[i];
        const info = groupInfo.get(i);
        const count = info ? info.count : 1;
        for (let j = 0; j < count; j++) {
            const copy = { ...q };
            delete copy._compressedCount;
            expanded.push(copy);
        }
    }
    return expanded;
}

// 切换压缩状态
function toggleCompression() {
    const compressBtn = document.getElementById('compressBtn');
    if (!compressEnabled) {
        // 执行压缩
        const result = compressQuestions();
        if (result.compressedQuestions.length === questions.length) {
            alert('没有发现连续相同的题目，无需压缩。');
            return;
        }
        // 保存原始数据以便展开
        sessionStorage.setItem('original_questions_before_compress', JSON.stringify(questions));
        sessionStorage.setItem('compress_group_info', JSON.stringify(Array.from(result.groupInfo.entries())));
        questions = result.compressedQuestions;
        compressedGroups = result.groupInfo;
        compressEnabled = true;
        compressBtn.textContent = '展开所有题目';
        saveQuestionsToLocal();
        renderQuestions();
    } else {
        // 展开
        const originalStr = sessionStorage.getItem('original_questions_before_compress');
        if (originalStr) {
            questions = JSON.parse(originalStr);
            sessionStorage.removeItem('original_questions_before_compress');
            sessionStorage.removeItem('compress_group_info');
        } else {
            // 降级：尝试从当前压缩状态反向展开
            if (compressedGroups.size) {
                questions = expandQuestions(questions, compressedGroups);
            } else {
                alert('无法展开，请刷新页面重试。');
                return;
            }
        }
        compressedGroups.clear();
        compressEnabled = false;
        compressBtn.textContent = '压缩连续相同题目';
        saveQuestionsToLocal();
        renderQuestions();
    }
}

// 初始化：加载数据，添加压缩按钮
function loadQuestions() {
    const stored = localStorage.getItem(STORAGE_QUESTIONS_KEY);
    if (stored) {
        questions = JSON.parse(stored);
    } else if (typeof database !== 'undefined' && Array.isArray(database)) {
        questions = database.map(q => ({ ...q }));
        questions.forEach((q, idx) => { if (!q.qId) q.qId = 'q_' + idx; });
        saveQuestionsToLocal();
    } else {
        questions = [];
    }
    // 检查是否有压缩状态残留（页面刷新后恢复）
    const compressedFlag = sessionStorage.getItem('compress_enabled_flag');
    if (compressedFlag === 'true') {
        const groupInfoStr = sessionStorage.getItem('compress_group_info');
        if (groupInfoStr) {
            compressedGroups = new Map(JSON.parse(groupInfoStr));
            compressEnabled = true;
            const btn = document.getElementById('compressBtn');
            if (btn) btn.textContent = '展开所有题目';
        }
    }
    renderQuestions();
}

function saveQuestionsToLocal() {
    localStorage.setItem(STORAGE_QUESTIONS_KEY, JSON.stringify(questions));
    if (compressEnabled) {
        sessionStorage.setItem('compress_enabled_flag', 'true');
    } else {
        sessionStorage.removeItem('compress_enabled_flag');
    }
}

// 在每两个卡片之间插入“添加题目”按钮，同时在开头和结尾也可添加
function renderQuestions() {
    if (!questionsList) return;
    questionsList.innerHTML = '';
    if (questions.length === 0) {
        questionsList.innerHTML = '<div class="no-questions">暂无题目，点击“添加题目”创建。</div>';
        return;
    }

    // 先渲染所有卡片并记录每个卡片对应的原始索引（压缩后）
    const cardElements = [];
    questions.forEach((q, idx) => {
        const card = createCardElement(q, idx);
        cardElements.push(card);
    });

    // 构建带添加按钮的列表
    const container = document.createElement('div');
    container.className = 'questions-list-inner';

    // 在列表最前面添加一个“添加题目”按钮
    const topAddBtn = createAddBetweenButton(-1);
    container.appendChild(topAddBtn);

    for (let i = 0; i < cardElements.length; i++) {
        container.appendChild(cardElements[i]);
        // 在每个卡片后面（除了最后一个）添加一个添加按钮
        const addBtnBetween = createAddBetweenButton(i);
        container.appendChild(addBtnBetween);
    }

    questionsList.appendChild(container);

    // 绑定卡片内按钮事件
    attachCardEvents();
}

// 创建单个卡片元素（支持HTML内容）
function createCardElement(q, idx) {
    const card = document.createElement('div');
    card.className = `question-card ${q.type}`;
    card.dataset.index = idx;
    // 如果是压缩后的代表，显示重复标记
    let compressedBadge = '';
    if (q._compressedCount && q._compressedCount > 1) {
        compressedBadge = `<span class="compressed-badge" title="此卡片代表 ${q._compressedCount} 道连续相同题目">📚 x${q._compressedCount}</span>`;
    }

    let contentHtml = '';
    if (compactMode) {
        let extraHtml = '';
        if (q.type === 'mc' && q.choice && q.letter) {
            const choicesHtml = q.choice.map((ch, i) => {
                const letter = String.fromCharCode(65 + i);
                return `<div class="option"><span class="option-text">${letter}. ${escapeHtml(ch)}</span></div>`;
            }).join('');
            extraHtml = `<div class="options">${choicesHtml}</div>
                         <div class="answer-preview">正确答案: ${escapeHtml(q.letter)}</div>`;
        } else if (q.type === 'lq') {
            const preview = q.ans.substring(0, 80);
            extraHtml = `<div class="answer-preview">答案预览: ${escapeHtml(preview)}${q.ans.length > 80 ? '…' : ''}</div>`;
        }
        contentHtml = `
            <div class="card-header">
                <div class="card-meta">
                    <span class="meta-tag type-tag">${q.type === 'mc' ? 'MC' : 'LQ'}</span>
                    <span class="question-points">${q.point} pts</span>
                    ${compressedBadge}
                </div>
                <div class="card-actions">
                    <button class="edit-btn" data-index="${idx}" title="编辑">✏️</button>
                    <button class="delete-btn" data-index="${idx}" title="删除">🗑️</button>
                    <button class="move-up-btn" data-index="${idx}" title="上移" ${idx === 0 ? 'disabled' : ''}>↑</button>
                    <button class="move-down-btn" data-index="${idx}" title="下移" ${idx === questions.length-1 ? 'disabled' : ''}>↓</button>
                </div>
            </div>
            <div class="statement">${q.statement}</div>
            ${extraHtml}
        `;
    } else {
        let mcHtml = '';
        if (q.type === 'mc' && q.choice) {
            const choicesHtml = q.choice.map((ch, i) => {
                const letter = String.fromCharCode(65 + i);
                return `<div class="option"><span class="option-text">${letter}. ${escapeHtml(ch)}</span></div>`;
            }).join('');
            mcHtml = `<div class="options"><strong>选项：</strong><br>${choicesHtml}</div>
                     <div><strong>正确答案：</strong> ${escapeHtml(q.letter)}</div>`;
        }
        contentHtml = `
            <div class="card-header">
                <div class="card-meta">
                    <span class="meta-tag">${escapeHtml(q.subject)}</span>
                    <span class="meta-tag">${escapeHtml(q.topic)}</span>
                    <span class="meta-tag">${escapeHtml(q.source)}</span>
                    <span class="meta-tag type-tag">${q.type === 'mc' ? 'MC' : 'LQ'}</span>
                    <span class="question-points">${q.point} pts</span>
                    ${compressedBadge}
                </div>
                <div class="card-actions">
                    <button class="edit-btn" data-index="${idx}" title="编辑">✏️</button>
                    <button class="delete-btn" data-index="${idx}" title="删除">🗑️</button>
                    <button class="move-up-btn" data-index="${idx}" title="上移" ${idx === 0 ? 'disabled' : ''}>↑</button>
                    <button class="move-down-btn" data-index="${idx}" title="下移" ${idx === questions.length-1 ? 'disabled' : ''}>↓</button>
                </div>
            </div>
            <div class="statement">${q.statement}</div>
            ${mcHtml}
            <div><strong>答案解释：</strong> ${escapeHtml(q.ans)}</div>
        `;
    }
    card.innerHTML = contentHtml;
    return card;
}

// 创建“在此添加题目”按钮
function createAddBetweenButton(indexAfter) {
    const btnWrapper = document.createElement('div');
    btnWrapper.className = 'add-between-wrapper';
    const btn = document.createElement('button');
    btn.className = 'btn-primary';
    btn.textContent = '+添加题目';
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        // indexAfter 表示在这个卡片之后插入（-1 表示在最前面插入）
        openAddModalAtIndex(indexAfter);
    });
    btnWrapper.appendChild(btn);
    return btnWrapper;
}

// 在指定位置后添加题目（indexAfter: 现有数组索引，-1表示开头）
function openAddModalAtIndex(indexAfter) {
    currentEditIndex = null;
    currentInsertAfter = indexAfter; // 全局变量记录插入位置
    modalTitle.textContent = '添加题目';
    const template = localStorage.getItem(TEMPLATE_KEY);
    let defaults = {
        type: 'mc',
        subject: '',
        topic: '',
        source: '',
        point: 1,
        statement: '',
        choice: '',
        letter: '',
        ans: ''
    };
    if (template) {
        try {
            const tmpl = JSON.parse(template);
            defaults = { ...defaults, ...tmpl };
        } catch(e) {}
    }
    fillForm(defaults);
    modal.classList.remove('hidden');
}
let currentInsertAfter = null; // 用于记录插入位置

// 保存题目时支持插入到指定位置
function saveQuestion(e) {
    e.preventDefault();
    const newQuestion = getQuestionFromForm();
    if (!newQuestion.subject || !newQuestion.topic || !newQuestion.source || !newQuestion.statement || !newQuestion.ans) {
        alert('请填写所有带*的字段');
        return;
    }
    if (newQuestion.type === 'mc' && (newQuestion.choice.length === 0 || !newQuestion.letter)) {
        alert('MC题型需要填写选项和正确答案字母');
        return;
    }
    if (currentEditIndex === null) {
        // 添加模式
        if (currentInsertAfter !== undefined && currentInsertAfter !== null) {
            // 在指定位置后插入
            const insertPos = currentInsertAfter + 1;
            questions.splice(insertPos, 0, newQuestion);
        } else {
            questions.push(newQuestion);
        }
        // 保存模板
        const template = {
            type: newQuestion.type,
            subject: newQuestion.subject,
            topic: newQuestion.topic,
            source: newQuestion.source,
            point: newQuestion.point,
            statement: '',
            choice: newQuestion.type === 'mc' ? (newQuestion.choice.join('\n') || '') : '',
            letter: newQuestion.letter || '',
            ans: ''
        };
        localStorage.setItem(TEMPLATE_KEY, JSON.stringify(template));
    } else {
        // 编辑模式
        newQuestion.qId = questions[currentEditIndex].qId;
        questions[currentEditIndex] = newQuestion;
    }
    saveQuestionsToLocal();
    // 重置插入位置
    currentInsertAfter = null;
    currentEditIndex = null;
    renderQuestions();
    closeModal();
}

// 绑定卡片内按钮事件（动态绑定，因为卡片是动态生成的）
function attachCardEvents() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.removeEventListener('click', handleEdit);
        btn.addEventListener('click', handleEdit);
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.removeEventListener('click', handleDelete);
        btn.addEventListener('click', handleDelete);
    });
    document.querySelectorAll('.move-up-btn').forEach(btn => {
        btn.removeEventListener('click', handleMoveUp);
        btn.addEventListener('click', handleMoveUp);
    });
    document.querySelectorAll('.move-down-btn').forEach(btn => {
        btn.removeEventListener('click', handleMoveDown);
        btn.addEventListener('click', handleMoveDown);
    });
}

function handleEdit(e) {
    const idx = parseInt(e.currentTarget.dataset.index);
    openEditModal(idx);
}
function handleDelete(e) {
    const idx = parseInt(e.currentTarget.dataset.index);
    if (confirm('确定删除该题目吗？')) {
        questions.splice(idx, 1);
        saveQuestionsToLocal();
        renderQuestions();
    }
}
function handleMoveUp(e) {
    const idx = parseInt(e.currentTarget.dataset.index);
    if (idx > 0) {
        [questions[idx-1], questions[idx]] = [questions[idx], questions[idx-1]];
        saveQuestionsToLocal();
        renderQuestions();
    }
}
function handleMoveDown(e) {
    const idx = parseInt(e.currentTarget.dataset.index);
    if (idx < questions.length-1) {
        [questions[idx+1], questions[idx]] = [questions[idx], questions[idx+1]];
        saveQuestionsToLocal();
        renderQuestions();
    }
}

// ========== 已存在的辅助函数（需补齐） ==========
function openEditModal(index) {
    currentEditIndex = index;
    modalTitle.textContent = '编辑题目';
    const q = questions[index];
    const formData = {
        type: q.type,
        subject: q.subject,
        topic: q.topic,
        source: q.source,
        point: q.point,
        statement: q.statement,
        choice: Array.isArray(q.choice) ? q.choice.join('\n') : '',
        letter: q.letter || '',
        ans: q.ans
    };
    fillForm(formData);
    modal.classList.remove('hidden');
}

function fillForm(data) {
    typeField.value = data.type;
    subjectField.value = data.subject;
    topicField.value = data.topic;
    sourceField.value = data.source;
    pointField.value = data.point;
    statementField.value = data.statement;
    choiceField.value = data.choice;
    letterField.value = data.letter;
    ansField.value = data.ans;
    toggleMcFields(data.type === 'mc');
}

function toggleMcFields(show) {
    mcFields.style.display = show ? 'block' : 'none';
    if (!show) {
        choiceField.required = false;
        letterField.required = false;
    } else {
        choiceField.required = true;
        letterField.required = true;
    }
}

function getQuestionFromForm() {
    const type = typeField.value;
    const choiceRaw = choiceField.value.trim();
    let choiceArray = [];
    if (type === 'mc' && choiceRaw) {
        choiceArray = choiceRaw.split('\n').filter(line => line.trim() !== '');
    }
    return {
        type: type,
        subject: subjectField.value.trim(),
        topic: topicField.value.trim(),
        source: sourceField.value.trim(),
        point: parseInt(pointField.value, 10),
        statement: statementField.value.trim(),
        choice: choiceArray,
        letter: letterField.value.trim().toUpperCase(),
        ans: ansField.value.trim(),
        qId: 'q_' + Date.now() + Math.random()
    };
}

function closeModal() {
    modal.classList.add('hidden');
    questionForm.reset();
    currentEditIndex = null;
    currentInsertAfter = null;
}

function toggleMode() {
    compactMode = !compactMode;
    toggleModeBtn.textContent = compactMode ? '切换到正常模式' : '切换到简洁模式';
    renderQuestions();
    if (compactMode) {
        questionsList.classList.add('compact-mode');
    } else {
        questionsList.classList.remove('compact-mode');
    }
}

function manualSave() {
    saveQuestionsToLocal();
    alert('题目数据已保存到浏览器本地存储。');
}

// 打开添加模态框（末尾添加）
function openAddModal() {
    currentEditIndex = null;
    currentInsertAfter = null;
    modalTitle.textContent = '添加题目';
    const template = localStorage.getItem(TEMPLATE_KEY);
    let defaults = {
        type: 'mc',
        subject: '',
        topic: '',
        source: '',
        point: 1,
        statement: '',
        choice: '',
        letter: '',
        ans: ''
    };
    if (template) {
        try {
            const tmpl = JSON.parse(template);
            defaults = { ...defaults, ...tmpl };
        } catch(e) {}
    }
    fillForm(defaults);
    modal.classList.remove('hidden');
}

// ========== 新增 ESC 键关闭模态框 ==========
function setupEscToClose() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            closeModal();
            e.preventDefault(); // 防止意外提交
        }
    });
}

// 事件绑定
addBtn.addEventListener('click', () => { currentInsertAfter = null; openAddModal(); });
toggleModeBtn.addEventListener('click', toggleMode);
saveToLocalBtn.addEventListener('click', manualSave);
cancelModalBtn.addEventListener('click', closeModal);
closeModalBtn.addEventListener('click', closeModal);
questionForm.addEventListener('submit', saveQuestion);
typeField.addEventListener('change', () => toggleMcFields(typeField.value === 'mc'));

// 页面加载
addCompressButton();
loadQuestions();
setupEscToClose();  // 启用 ESC 关闭模态框
if (questionsList) questionsList.classList.remove('compact-mode');

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}