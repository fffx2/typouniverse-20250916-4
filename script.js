// ===================================================================================
// INITIALIZATION & GLOBAL STATE
// ===================================================================================

let appState = {
    service: '', platform: '',
    mood: { soft: 50, static: 50 },
    keyword: '', primaryColor: '',
    generatedResult: null
};
let knowledgeBase = {};

document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    try {
        const response = await fetch('./knowledge_base.json');
        if (!response.ok) throw new Error('Network response was not ok');
        knowledgeBase = await response.json();
        
        setupNavigation();
        initializeMainPage();
        initializeLabPage();

    } catch (error) {
        console.error('Failed to initialize app:', error);
        updateAIMessage("시스템 초기화 중 오류가 발생했습니다. 페이지를 새로고침해주세요.");
    }
}

// ===================================================================================
// NAVIGATION
// ===================================================================================

function setupNavigation() {
    document.querySelectorAll('.nav-link, .interactive-button').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.currentTarget.dataset.target;
            
            document.querySelectorAll('.main-page, .lab-page').forEach(page => {
                page.classList.toggle('active', page.id === targetId);
                page.classList.toggle('hidden', page.id !== targetId);
            });
            
            document.querySelectorAll('.nav-link').forEach(nav => {
                nav.classList.toggle('active', nav.dataset.target === targetId);
            });

            if (targetId === 'lab-page' && appState.generatedResult) {
                const { bgColor, textColor } = appState.generatedResult;
                updateLabPageWithData(bgColor, textColor);
            }
        });
    });
}

// ===================================================================================
// MAIN PAGE LOGIC
// ===================================================================================

function initializeMainPage() {
    initializeDropdowns();
    initializeSliders();
    document.getElementById('generate-btn').addEventListener('click', generateGuide);
    updateAIMessage("안녕하세요! TYPOUNIVERSE AI Design Assistant입니다. 어떤 프로젝트를 위한 디자인 가이드를 찾으시나요?");
}

function initializeDropdowns() {
    const services = ['포트폴리오', '브랜드 홍보', '제품 판매', '정보 전달', '학습', '엔터테인먼트'];
    const platforms = ['iOS', 'Android', 'Web', 'Desktop', 'Tablet', 'Wearable', 'VR'];
    
    populateDropdown('service', services);
    populateDropdown('platform', platforms);

    document.getElementById('service-dropdown').addEventListener('click', () => toggleDropdown('service'));
    document.getElementById('platform-dropdown').addEventListener('click', () => toggleDropdown('platform'));
}

function populateDropdown(type, options) {
    const menu = document.getElementById(`${type}-menu`);
    menu.innerHTML = '';
    options.forEach(optionText => {
        const option = document.createElement('div');
        option.className = 'dropdown-option';
        option.textContent = optionText;
        option.onclick = () => selectOption(type, optionText);
        menu.appendChild(option);
    });
}

function toggleDropdown(type) {
    document.getElementById(`${type}-menu`).classList.toggle('show');
}

function selectOption(type, value) {
    document.getElementById(`${type}-text`).textContent = value;
    document.getElementById(`${type}-dropdown`).classList.add('selected');
    appState[type] = value;
    toggleDropdown(type);

    if (appState.service && appState.platform) {
        document.getElementById('step02').classList.remove('hidden');
    }
}

function initializeSliders() {
    const softHardSlider = document.getElementById('soft-hard-slider');
    const staticDynamicSlider = document.getElementById('static-dynamic-slider');
    
    const updateMoodAndKeywords = () => {
        appState.mood.soft = parseInt(softHardSlider.value);
        appState.mood.static = parseInt(staticDynamicSlider.value);
        
        if (Math.abs(appState.mood.soft - 50) > 10 || Math.abs(appState.mood.static - 50) > 10) {
            document.getElementById('step03').classList.remove('hidden');
            renderKeywords();
        }
    };
    
    softHardSlider.addEventListener('input', updateMoodAndKeywords);
    staticDynamicSlider.addEventListener('input', updateMoodAndKeywords);
}

function renderKeywords() {
    const { soft, static: staticMood } = appState.mood;
    let groupKey = (soft < 40 && staticMood >= 60) ? 'group1' :
                   (soft < 40 && staticMood < 40) ? 'group2' :
                   (soft >= 60 && staticMood < 40) ? 'group3' :
                   (soft >= 60 && staticMood >= 60) ? 'group4' : 'group5';
    
    const { keywords } = knowledgeBase.iri_colors[groupKey];
    const keywordContainer = document.getElementById('keyword-tags');
    keywordContainer.innerHTML = '';
    
    keywords.forEach(keyword => {
        const tag = document.createElement('div');
        tag.className = 'tag tag-light';
        tag.textContent = keyword;
        tag.onclick = () => selectKeyword(keyword, groupKey);
        keywordContainer.appendChild(tag);
    });
}

function selectKeyword(keyword, groupKey) {
    appState.keyword = keyword;
    
    document.querySelectorAll('#keyword-tags .tag').forEach(tag => {
        tag.classList.toggle('selected', tag.textContent === keyword);
        tag.classList.toggle('tag-purple', tag.textContent === keyword);
    });

    const { key_colors } = knowledgeBase.iri_colors[groupKey];
    const colorContainer = document.getElementById('color-selection');
    colorContainer.innerHTML = '';

    key_colors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.background = color;
        swatch.onclick = () => selectColor(color);
        colorContainer.appendChild(swatch);
    });
    document.getElementById('color-selection-wrapper').style.display = 'block';
}

function selectColor(color) {
    appState.primaryColor = color;
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.classList.toggle('selected', swatch.style.backgroundColor === color);
    });
    document.getElementById('generate-btn').classList.remove('hidden');
}

// Simplified function, as the AI part is now handled by the backend.
function generateGuide() {
    // This is a placeholder for where you might call the backend
    // For now, it will just display some mock data for demonstration
    const mockData = {
        colorSystem: {
            primary: { main: '#663399', light: '#9a66cc', dark: '#402060' },
            secondary: { main: '#99cc33', light: '#c2e078', dark: '#6b8f23' }
        },
        typography: { bodySize: '16px', headlineSize: '24px', lineHeight: '1.5' },
        accessibility: { textColorOnPrimary: '#FFFFFF', contrastRatio: '7.5:1' }
    };
    displayGeneratedGuide(mockData);
}

function displayGeneratedGuide(data) {
    appState.generatedResult = {
        bgColor: data.colorSystem.primary.main,
        textColor: data.accessibility.textColorOnPrimary
    };

    // Populate color boxes
    for (const type of ['primary', 'secondary']) {
        for (const shade of ['main', 'light', 'dark']) {
            const element = document.getElementById(`${type}-${shade}`);
            const color = data.colorSystem[type][shade];
            element.style.background = color;
            element.querySelector('.color-code').textContent = color;
        }
    }
    document.getElementById('ai-report').style.display = 'block';
    document.getElementById('guidelines').style.display = 'grid';
}

// ===================================================================================
// LAB PAGE LOGIC
// ===================================================================================

function initializeLabPage() {
    const inputs = ['bg-color-input', 'bg-color-picker', 'text-color-input', 'text-color-picker', 'line-height-input', 'font-size-input'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('input', updateLab);
    });
    updateLab();
}

function updateLab() {
    // Contrast Test
    const bgColor = document.getElementById('bg-color-input').value;
    const textColor = document.getElementById('text-color-input').value;
    const lineHeight = document.getElementById('line-height-input').value;
    
    document.getElementById('bg-color-picker').value = bgColor;
    document.getElementById('text-color-picker').value = textColor;
    
    const ratio = calculateContrast(bgColor, textColor);
    document.getElementById('contrast-ratio').textContent = ratio.toFixed(2) + ' : 1';
    
    document.getElementById('aa-status').classList.toggle('pass', ratio >= 4.5);
    document.getElementById('aaa-status').classList.toggle('pass', ratio >= 7);
    
    const preview = document.getElementById('text-preview');
    preview.style.backgroundColor = bgColor;
    preview.style.color = textColor;
    preview.style.lineHeight = lineHeight;
    document.getElementById('line-height-value').textContent = lineHeight;

    // Font Units
    const fontSize = document.getElementById('font-size-input').value || 16;
    document.getElementById('pt-example').textContent = (fontSize * 0.75).toFixed(1) + 'pt';
    document.getElementById('rem-example').textContent = (fontSize / 16).toFixed(2) + 'rem';
    document.getElementById('sp-example').textContent = fontSize + 'sp';

    // Colorblind Simulator
    updateSimulator(bgColor, textColor);
}

function updateSimulator(bgColor, textColor) {
    const simBg = daltonizeColor(bgColor, 'Protanopia');
    const simText = daltonizeColor(textColor, 'Protanopia');

    const origBgEl = document.getElementById('origBg');
    const origTextEl = document.getElementById('origText');
    const simBgEl = document.getElementById('simBg');
    const simTextEl = document.getElementById('simText');

    updatePaletteItem(origBgEl, bgColor);
    updatePaletteItem(origTextEl, textColor);
    updatePaletteItem(simBgEl, simBg);
    updatePaletteItem(simTextEl, simText);

    const simRatio = calculateContrast(simBg, simText);
    const solutionText = document.getElementById('solution-text');
    if (simRatio >= 4.5) {
        solutionText.innerHTML = `✅ 양호: 시뮬레이션 결과, 대비율이 ${simRatio.toFixed(2)}:1로 충분하여 색상 구분에 문제가 없을 것으로 보입니다.`;
        solutionText.style.color = 'green';
    } else {
        solutionText.innerHTML = `⚠️ 주의: 시뮬레이션 결과, 대비율이 ${simRatio.toFixed(2)}:1로 낮아 색상 구분이 어려울 수 있습니다. 명도 차이를 더 확보하거나, 색상 외 다른 시각적 단서(아이콘, 굵기 등)를 함께 사용하는 것을 권장합니다.`;
        solutionText.style.color = 'orange';
    }
}

function updatePaletteItem(element, color) {
    element.style.background = color;
    element.querySelector('.hex-code-sim').textContent = color;
    const contrastColor = getContrastingTextColor(color);
    element.style.color = contrastColor;
}

function updateLabPageWithData(bgColor, textColor) {
    document.getElementById('bg-color-input').value = bgColor;
    document.getElementById('text-color-input').value = textColor;
    updateLab();
}


// ===================================================================================
// HELPER FUNCTIONS (Color, etc.)
// ===================================================================================
// [요청 4] 추가된 헬퍼 함수
function getContrastingTextColor(hex) {
    if (!hex) return '#000000';
    const rgb = hexToRgb(hex);
    if (!rgb) return '#000000';
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

function calculateContrast(hex1, hex2) {
    const lum1 = getLuminance(hex1);
    const lum2 = getLuminance(hex2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}

function getLuminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const [r, g, b] = Object.values(rgb).map(c => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

// Colorblind simulation (Simplified Daltonize function)
function daltonizeColor(hex, type) {
    const rgb = hexToRgb(hex);
    if (!rgb) return '#000000';
    // This is a simplified simulation for red-green color blindness
    const r = rgb.r * 0.56667 + rgb.g * 0.43333 + rgb.b * 0;
    const g = rgb.r * 0.55833 + rgb.g * 0.44167 + rgb.b * 0;
    const b = rgb.r * 0 + rgb.g * 0.24167 + rgb.b * 0.75833;
    const toHex = c => ('0' + Math.round(c).toString(16)).slice(-2);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// AI Message (Placeholder, as there's no typing effect in this version)
function updateAIMessage(message) {
    const el = document.getElementById('ai-message');
    if (el) el.textContent = message;
}