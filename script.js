// 字符集定义
const CHAR_SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

// 相似字符和歧义字符
const SIMILAR_CHARS = '0O1lI';
const AMBIGUOUS_CHARS = '{}[]()/\\\'"`~,;:.<>';

// DOM 元素
const elements = {
    passwordDisplay: document.getElementById('passwordDisplay'),
    passwordText: document.getElementById('passwordText'),
    generateBtn: document.getElementById('generateBtn'),
    copyBtn: document.getElementById('copyBtn'),
    lengthSlider: document.getElementById('lengthSlider'),
    lengthValue: document.getElementById('lengthValue'),
    uppercase: document.getElementById('uppercase'),
    lowercase: document.getElementById('lowercase'),
    numbers: document.getElementById('numbers'),
    symbols: document.getElementById('symbols'),
    excludeSimilar: document.getElementById('excludeSimilar'),
    excludeAmbiguous: document.getElementById('excludeAmbiguous'),
    strengthLevel: document.getElementById('strengthLevel'),
    strengthBar: document.getElementById('strengthBar'),
    entropyValue: document.getElementById('entropyValue'),
    crackTime: document.getElementById('crackTime'),
    passwordAnalysis: document.getElementById('passwordAnalysis'),
    batchToggle: document.getElementById('batchToggle'),
    batchPanel: document.getElementById('batchPanel'),
    batchCount: document.getElementById('batchCount'),
    batchGenerateBtn: document.getElementById('batchGenerateBtn'),
    batchResults: document.getElementById('batchResults'),
    exportBtn: document.getElementById('exportBtn'),
    themeToggle: document.getElementById('themeToggle'),
    presetButtons: document.querySelectorAll('[data-preset]')
};

// 当前密码
let currentPassword = '';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    registerServiceWorker();
});

// 注册 Service Worker (PWA支持)
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then((registration) => {
                    console.log('Service Worker 注册成功:', registration.scope);
                })
                .catch((error) => {
                    console.log('Service Worker 注册失败:', error);
                });
        });
    }
}

function initializeApp() {
    // 加载主题设置
    loadTheme();
    
    // 绑定事件
    bindEvents();
    
    // 初始化密码生成
    generatePassword();
}

// 绑定事件
function bindEvents() {
    // 生成密码
    elements.generateBtn.addEventListener('click', generatePassword);
    
    // 复制密码
    elements.copyBtn.addEventListener('click', copyPassword);
    
    // 长度滑块
    elements.lengthSlider.addEventListener('input', (e) => {
        elements.lengthValue.textContent = e.target.value;
        if (currentPassword) {
            updateStrengthDisplay(currentPassword);
        }
    });
    
    // 字符类型复选框
    [elements.uppercase, elements.lowercase, elements.numbers, elements.symbols].forEach(checkbox => {
        checkbox.addEventListener('change', validateCharacterTypes);
    });
    
    // 高级选项
    elements.excludeSimilar.addEventListener('change', () => {
        if (currentPassword) {
            updateStrengthDisplay(currentPassword);
        }
    });
    elements.excludeAmbiguous.addEventListener('change', () => {
        if (currentPassword) {
            updateStrengthDisplay(currentPassword);
        }
    });
    
    // 预设按钮
    elements.presetButtons.forEach(btn => {
        btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
    });
    
    // 批量生成
    elements.batchToggle.addEventListener('click', toggleBatchPanel);
    elements.batchGenerateBtn.addEventListener('click', generateBatchPasswords);
    elements.exportBtn.addEventListener('click', exportPasswords);
    
    // 主题切换
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // 键盘快捷键
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// 验证字符类型选择
function validateCharacterTypes() {
    const hasSelection = elements.uppercase.checked || 
                        elements.lowercase.checked || 
                        elements.numbers.checked || 
                        elements.symbols.checked;
    
    if (!hasSelection) {
        showToast('请至少选择一种字符类型', 'error');
        // 自动选中小写字母
        elements.lowercase.checked = true;
    }
}

// 生成密码
async function generatePassword() {
    try {
        const length = parseInt(elements.lengthSlider.value);
        const options = getPasswordOptions();
        
        if (!options.charSet) {
            showToast('请至少选择一种字符类型', 'error');
            return;
        }
        
        const password = await generateSecurePassword(length, options);
        currentPassword = password;
        
        // 更新显示
        elements.passwordText.textContent = password;
        elements.copyBtn.disabled = false;
        
        // 更新强度显示
        updateStrengthDisplay(password);
        
        // 添加生成动画
        elements.passwordDisplay.style.animation = 'none';
        setTimeout(() => {
            elements.passwordDisplay.style.animation = 'fadeIn 0.3s ease';
        }, 10);
        
    } catch (error) {
        console.error('生成密码失败:', error);
        showToast('生成密码失败，请重试', 'error');
    }
}

// 获取密码选项
function getPasswordOptions() {
    let charSet = '';
    
    if (elements.uppercase.checked) {
        charSet += CHAR_SETS.uppercase;
    }
    if (elements.lowercase.checked) {
        charSet += CHAR_SETS.lowercase;
    }
    if (elements.numbers.checked) {
        charSet += CHAR_SETS.numbers;
    }
    if (elements.symbols.checked) {
        charSet += CHAR_SETS.symbols;
    }
    
    // 排除相似字符
    if (elements.excludeSimilar.checked) {
        charSet = charSet.split('').filter(char => !SIMILAR_CHARS.includes(char)).join('');
    }
    
    // 排除歧义字符
    if (elements.excludeAmbiguous.checked) {
        charSet = charSet.split('').filter(char => !AMBIGUOUS_CHARS.includes(char)).join('');
    }
    
    return { charSet };
}

// 使用 Web Crypto API 生成安全随机密码
async function generateSecurePassword(length, options) {
    const { charSet } = options;
    const charSetLength = charSet.length;
    
    if (charSetLength === 0) {
        throw new Error('字符集为空');
    }
    
    // 使用 crypto.getRandomValues 生成随机数
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    
    let password = '';
    for (let i = 0; i < length; i++) {
        // 使用模运算确保均匀分布
        const randomIndex = randomValues[i] % charSetLength;
        password += charSet[randomIndex];
    }
    
    return password;
}

// 计算密码熵值
function calculateEntropy(password, charSetSize) {
    return password.length * Math.log2(charSetSize);
}

// 估算破解时间
function estimateCrackTime(entropy) {
    // 假设攻击者每秒可以尝试 10^9 次（10亿次）
    const attemptsPerSecond = 1e9;
    const totalCombinations = Math.pow(2, entropy);
    const seconds = totalCombinations / attemptsPerSecond;
    
    if (seconds < 60) {
        return `${Math.round(seconds)} 秒`;
    } else if (seconds < 3600) {
        return `${Math.round(seconds / 60)} 分钟`;
    } else if (seconds < 86400) {
        return `${Math.round(seconds / 3600)} 小时`;
    } else if (seconds < 31536000) {
        return `${Math.round(seconds / 86400)} 天`;
    } else if (seconds < 31536000000) {
        return `${Math.round(seconds / 31536000)} 年`;
    } else {
        return `${(seconds / 31536000000).toFixed(1)} 千年`;
    }
}

// 评估密码强度
function evaluatePasswordStrength(password, charSetSize) {
    const entropy = calculateEntropy(password, charSetSize);
    const length = password.length;
    
    let strength = 'weak';
    let level = '弱';
    
    if (entropy >= 100 && length >= 16) {
        strength = 'very-strong';
        level = '极强';
    } else if (entropy >= 60 && length >= 12) {
        strength = 'strong';
        level = '强';
    } else if (entropy >= 40 && length >= 8) {
        strength = 'medium';
        level = '中等';
    } else {
        strength = 'weak';
        level = '弱';
    }
    
    return { strength, level, entropy };
}

// 分析密码组成
function analyzePassword(password) {
    const analysis = [];
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
    const length = password.length;
    
    if (hasUppercase) analysis.push('包含大写字母');
    if (hasLowercase) analysis.push('包含小写字母');
    if (hasNumbers) analysis.push('包含数字');
    if (hasSymbols) analysis.push('包含特殊字符');
    
    if (length >= 16) {
        analysis.push('长度 ≥ 16 位（推荐）');
    } else if (length >= 12) {
        analysis.push('长度 ≥ 12 位（良好）');
    } else {
        analysis.push('长度 < 12 位（建议增加长度）');
    }
    
    // 检查常见模式
    if (/(.)\1{2,}/.test(password)) {
        analysis.push('⚠️ 包含重复字符（建议避免）');
    }
    
    if (/123|abc|qwe/i.test(password)) {
        analysis.push('⚠️ 包含常见序列（建议避免）');
    }
    
    return analysis;
}

// 更新强度显示
function updateStrengthDisplay(password) {
    if (!password) return;
    
    const options = getPasswordOptions();
    const charSetSize = options.charSet.length;
    
    const { strength, level, entropy } = evaluatePasswordStrength(password, charSetSize);
    const crackTime = estimateCrackTime(entropy);
    
    // 更新强度等级
    elements.strengthLevel.textContent = level;
    elements.strengthLevel.className = 'strength-level';
    elements.strengthLevel.classList.add(strength);
    
    // 更新进度条
    elements.strengthBar.className = 'strength-bar';
    elements.strengthBar.classList.add(strength);
    
    // 更新熵值和破解时间
    elements.entropyValue.textContent = `${entropy.toFixed(1)} bits`;
    elements.crackTime.textContent = crackTime;
    
    // 更新分析
    const analysis = analyzePassword(password);
    elements.passwordAnalysis.innerHTML = `
        <ul>
            ${analysis.map(item => `<li>${item}</li>`).join('')}
        </ul>
    `;
}

// 复制密码到剪贴板
async function copyPassword() {
    if (!currentPassword) return;
    
    try {
        await navigator.clipboard.writeText(currentPassword);
        showToast('密码已复制到剪贴板', 'success');
        
        // 更新按钮状态
        const originalText = elements.copyBtn.innerHTML;
        elements.copyBtn.innerHTML = '<span>✓</span> 已复制';
        elements.copyBtn.disabled = true;
        
        setTimeout(() => {
            elements.copyBtn.innerHTML = originalText;
            elements.copyBtn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('复制失败:', error);
        // 降级方案：使用传统方法
        fallbackCopy(currentPassword);
    }
}

// 降级复制方案
function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showToast('密码已复制到剪贴板', 'success');
    } catch (error) {
        showToast('复制失败，请手动复制', 'error');
    }
    
    document.body.removeChild(textarea);
}

// 应用预设
function applyPreset(preset) {
    switch (preset) {
        case 'strong':
            elements.lengthSlider.value = 16;
            elements.lengthValue.textContent = '16';
            elements.uppercase.checked = true;
            elements.lowercase.checked = true;
            elements.numbers.checked = true;
            elements.symbols.checked = true;
            elements.excludeSimilar.checked = false;
            elements.excludeAmbiguous.checked = false;
            break;
        case 'medium':
            elements.lengthSlider.value = 12;
            elements.lengthValue.textContent = '12';
            elements.uppercase.checked = true;
            elements.lowercase.checked = true;
            elements.numbers.checked = true;
            elements.symbols.checked = false;
            elements.excludeSimilar.checked = false;
            elements.excludeAmbiguous.checked = false;
            break;
        case 'pin':
            elements.lengthSlider.value = 6;
            elements.lengthValue.textContent = '6';
            elements.uppercase.checked = false;
            elements.lowercase.checked = false;
            elements.numbers.checked = true;
            elements.symbols.checked = false;
            elements.excludeSimilar.checked = false;
            elements.excludeAmbiguous.checked = false;
            break;
    }
    generatePassword();
}

// 批量生成密码
async function generateBatchPasswords() {
    const count = parseInt(elements.batchCount.value) || 10;
    
    if (count < 1 || count > 100) {
        showToast('生成数量应在 1-100 之间', 'error');
        return;
    }
    
    elements.batchResults.innerHTML = '<div style="text-align: center; padding: 1rem;">生成中...</div>';
    elements.batchGenerateBtn.disabled = true;
    
    const passwords = [];
    const options = getPasswordOptions();
    const length = parseInt(elements.lengthSlider.value);
    
    try {
        for (let i = 0; i < count; i++) {
            const password = await generateSecurePassword(length, options);
            passwords.push(password);
        }
        
        displayBatchResults(passwords);
        elements.exportBtn.style.display = 'block';
        
    } catch (error) {
        console.error('批量生成失败:', error);
        showToast('批量生成失败', 'error');
    } finally {
        elements.batchGenerateBtn.disabled = false;
    }
}

// 显示批量生成结果
function displayBatchResults(passwords) {
    elements.batchResults.innerHTML = passwords.map((password, index) => `
        <div class="batch-result-item">
            <span>${index + 1}. ${password}</span>
            <button class="batch-copy-btn" onclick="copyToClipboard('${password}')">复制</button>
        </div>
    `).join('');
}

// 复制单个密码（批量模式）
window.copyToClipboard = async function(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('已复制', 'success');
    } catch (error) {
        fallbackCopy(text);
    }
};

// 导出密码
function exportPasswords() {
    const items = elements.batchResults.querySelectorAll('.batch-result-item');
    if (items.length === 0) {
        showToast('没有可导出的密码', 'error');
        return;
    }
    
    const passwords = Array.from(items).map(item => {
        const text = item.querySelector('span').textContent;
        return text.replace(/^\d+\.\s/, ''); // 移除序号
    });
    
    // 创建 CSV 内容
    const csvContent = passwords.map((pwd, index) => `${index + 1},${pwd}`).join('\n');
    const csvHeader = '序号,密码\n';
    const fullContent = csvHeader + csvContent;
    
    // 创建下载链接
    const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `passwords_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast('密码已导出', 'success');
}

// 切换批量面板
function toggleBatchPanel() {
    const isVisible = elements.batchPanel.style.display !== 'none';
    elements.batchPanel.style.display = isVisible ? 'none' : 'block';
    elements.batchToggle.textContent = isVisible ? '批量生成' : '收起';
}

// 主题管理
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme === 'auto' ? (prefersDark ? 'dark' : 'light') : savedTheme;
    
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = elements.themeToggle.querySelector('.theme-icon');
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Toast 通知
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 键盘快捷键
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + Enter: 生成密码
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        generatePassword();
    }
    
    // Ctrl/Cmd + C: 复制密码（当密码显示时）
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && currentPassword) {
        // 只在没有选中文本时复制密码
        if (window.getSelection().toString() === '') {
            e.preventDefault();
            copyPassword();
        }
    }
}

