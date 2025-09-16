// ===================================================================================
// INITIALIZATION & GLOBAL STATE
// ===================================================================================

// 전역 상태 관리 객체
let appState = {
    service: '',
    platform: '',
    mood: { soft: 50, static: 50 },
    keyword: '',
    primaryColor: '',
    generatedResult: null // 생성된 최종 결과 저장
};

// 지식 베이스 데이터 저장 변수
let knowledgeBase = {};

document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    try {
        const response = await fetch('./knowledge_base.json');
        if (!response.ok) throw new Error('Network response was not ok');
        knowledgeBase = await response.json();
        
        setupNavigation();
        initializeMainPage();
        initializeLabPage(); // 페이지 로드 시 Lab 페이지도 초기화

    } catch (error) {
        console.error('Failed to initialize app:', error);
        updateAIMessage("시스템 초기화 중 오류가 발생했습니다. 페이지를 새로고침해주세요.");
    }
}


// ===================================================================================
// NAVIGATION
// ===================================================================================

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link, .interactive-button');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.currentTarget.dataset.target;
            
            document.querySelectorAll('.main-page, .lab-page').forEach(page => {
                page.classList.remove('active');
                page.classList.add('hidden');
            });
            
            const targetPage = document.getElementById(targetId);
            if(targetPage) {
                targetPage.classList.remove('hidden');
                targetPage.classList.add('active');
            }

            document.querySelectorAll('.nav-link').forEach(nav => {
                nav.classList.toggle('active', nav.dataset.target === targetId);
            });

            // If navigating to lab, pass generated data
            if (targetId === 'lab-page' && appState.generatedResult) {
                const { bgColor, textColor, fontSize } = appState.generatedResult;
                updateLabPageWithData(bgColor, textColor, fontSize);
            }
        });
    });
}


// ===================================================================================
// MAIN PAGE LOGIC (STEP 1, 2, 3 복구)
// ===================================================================================

function initializeMainPage() {
    initializeDropdowns();
    initializeSliders();
    document.getElementById('generate-btn').addEventListener('click', generateGuide);
    updateAIMessage("안녕하세요! TYPOUNIVERSE AI Design Assistant입니다. 어떤 프로젝트를 위한 디자인 가이드를 찾으시나요? 먼저 서비스의 목적과 타겟 플랫폼을 알려주세요.");
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
        const platformKey = appState.platform.toLowerCase();
        const platformGuide = knowledgeBase.guidelines[platformKey];
        if (platformGuide) {
            updateAIMessage(`${appState.platform} 플랫폼을 선택하셨군요! ${platformGuide.description} 권장 본문 크기는 ${platformGuide.defaultSize}입니다. 이제 서비스의 핵심 분위기를 정해주세요.`);
        }
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
    let group = (soft < 40 && staticMood >= 60) ? 'group1' :
                (soft < 40 && staticMood < 40) ? 'group2' :
                (soft >= 60 && staticMood < 40) ? 'group3' :
                (soft >= 60 && staticMood >= 60) ? 'group4' : 'group5';
    
    const { keywords, description } = knowledgeBase.iri_colors[group];
    const keywordContainer = document.getElementById('keyword-tags');
    keywordContainer.innerHTML = '';
    
    keywords.forEach(keyword => {
        const tag = document.createElement('div');
        tag.className = 'tag'; // 'tag-light' 제거
        tag.textContent = keyword;
        tag.onclick = () => selectKeyword(keyword, group);
        keywordContainer.appendChild(tag);
    });

    updateAIMessage(`선택하신 '${description}' 분위기에 맞는 키워드들을 확인해 보세요.`);
}

function selectKeyword(keyword, group) {
    appState.keyword = keyword;
    
    document.querySelectorAll('#keyword-tags .tag').forEach(tag => {
        tag.classList.toggle('selected', tag.textContent === keyword);
        // tag.classList.toggle('tag-purple', tag.textContent === keyword); // 'tag-purple' 제거
    });

    const { key_colors } = knowledgeBase.iri_colors[group];
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
    updateAIMessage(`선택하신 '${keyword}' 키워드에 어울리는 대표 색상들을 제안합니다. 주조 색상을 선택해주세요.`);
}

function selectColor(color) {
    appState.primaryColor = color;
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        // 배경색 비교 시 hexToRgb 변환 후 비교하여 정확도 높임
        const currentSwatchHex = rgbToHex(
            hexToRgb(swatch.style.backgroundColor || '#000000').r,
            hexToRgb(swatch.style.backgroundColor || '#000000').g,
            hexToRgb(swatch.style.backgroundColor || '#000000').b
        );
        const selectedColorHex = rgbToHex(
            hexToRgb(color || '#000000').r,
            hexToRgb(color || '#000000').g,
            hexToRgb(color || '#000000').b
        );
        swatch.classList.toggle('selected', currentSwatchHex === selectedColorHex);
    });
    document.getElementById('generate-btn').classList.remove('hidden');
    updateAIMessage("최고의 선택입니다! 이 색상을 기준으로 가이드를 생성합니다.");
}

function generateGuide() {
    const { primaryColor, platform } = appState;
    if (!primaryColor || !platform) {
        alert("주조 색상과 플랫폼을 선택해주세요.");
        return;
    }

    // --- Palette Generation ---
    const primary = primaryColor;
    const primaryLight = lightenColor(primary, 20);
    const primaryDark = darkenColor(primary, 20);
    const secondary = getComplementaryColor(primary);
    const secondaryLight = lightenColor(secondary, 20);
    const secondaryDark = darkenColor(secondary, 20);
    
    // --- Typography & Accessibility ---
    const platformKey = platform.toLowerCase();
    const platformGuide = knowledgeBase.guidelines[platformKey] || knowledgeBase.guidelines.web;
    const textColorOnPrimary = getContrastRatio(primary, '#FFFFFF') > getContrastRatio(primary, '#333333') ? '#FFFFFF' : '#333333';
    const contrastRatio = getContrastRatio(primary, textColorOnPrimary); // toFixed(2) 제거
    
    // --- Store Results ---
    appState.generatedResult = {
        bgColor: primary,
        textColor: textColorOnPrimary,
        fontSize: parseInt(platformGuide.defaultSize),
        palette: { primary, primaryLight, primaryDark, secondary, secondaryLight, secondaryDark },
        typography: {
            bodySize: platformGuide.defaultSize,
            headlineSize: platformGuide.typeScale.headline || platformGuide.typeScale.largeTitle,
            minimumSize: platformGuide.minimumSize,
            unit: platformGuide.font.unit,
            source: platformGuide.source
        },
        accessibility: {
            textColorOnPrimary,
            contrastRatio: contrastRatio.toFixed(2) + ':1' // 다시 toFixed(2) 추가
        }
    };

    displayGeneratedGuide();
}

function displayGeneratedGuide() {
    const { palette, typography, accessibility } = appState.generatedResult;

    // Color Display
    updateColorBoxOnMain('primary-main', palette.primary);
    updateColorBoxOnMain('primary-light', palette.primaryLight);
    updateColorBoxOnMain('primary-dark', palette.primaryDark);
    
    updateColorBoxOnMain('secondary-main', palette.secondary);
    updateColorBoxOnMain('secondary-light', palette.secondaryLight);
    updateColorBoxOnMain('secondary-dark', palette.secondaryDark);

    // Typography Display
    document.getElementById('contrast-description').innerHTML = `Primary 색상 배경 사용 시, WCAG AA 기준을 충족하는 텍스트 색상은 <strong>${accessibility.textColorOnPrimary}</strong>이며, 대비는 <strong>${accessibility.contrastRatio}</strong>입니다.`;
    document.getElementById('font-size-description').innerHTML = `<strong>${typography.bodySize}</strong> (본문) / <strong>${typography.headlineSize}</strong> (헤드라인)<br>최소 크기: <strong>${typography.minimumSize}</strong> / 단위: <strong>${typography.unit}</strong><br><span style="font-size: 12px; color: #888;">${typography.source}</span>`;

    document.getElementById('ai-report').style.display = 'block';
    document.getElementById('guidelines').style.display = 'grid';
    updateAIMessage(`${appState.platform} 플랫폼에 최적화된 디자인 가이드가 생성되었습니다! 인터랙티브 실험실에서 더 자세히 테스트해보세요.`);
}

// 메인 페이지 컬러 박스 업데이트 (텍스트 색상 자동 조정 포함)
function updateColorBoxOnMain(id, color) {
    const element = document.getElementById(id);
    if (!element) return;
    element.style.background = color;
    const codeElement = element.querySelector('.color-code');
    const labelElement = element.querySelector('.color-label');

    const textColor = getContrastRatio(color, '#FFFFFF') > getContrastRatio(color, '#333333') ? '#FFFFFF' : '#333333';
    codeElement.style.color = textColor;
    labelElement.style.color = textColor;
    codeElement.textContent = color;
}


// ===================================================================================
// LAB PAGE LOGIC
// ===================================================================================

function initializeLabPage() {
    const elements = {
        bgColorInput: document.getElementById('bg-color-input'),
        bgColorPicker: document.getElementById('bg-color-picker'),
        textColorInput: document.getElementById('text-color-input'),
        textColorPicker: document.getElementById('text-color-picker'),
        lineHeightInput: document.getElementById('line-height-input'),
        fontSizeInput: document.getElementById('font-size-input'),
        fontBaseSizeInput: document.getElementById('font-base-size-input') // rem 기준 폰트 크기 입력 필드
    };

    const updateAllLabDisplays = () => {
        updateContrastDisplay();
        updateFontUnits();
        updateUniversalColorDisplay();
    };
    
    elements.bgColorInput.oninput = (e) => { elements.bgColorPicker.value = e.target.value; updateAllLabDisplays(); };
    elements.bgColorPicker.oninput = (e) => { elements.bgColorInput.value = e.target.value; updateAllLabDisplays(); };
    elements.textColorInput.oninput = (e) => { elements.textColorPicker.value = e.target.value; updateAllLabDisplays(); };
    elements.textColorPicker.oninput = (e) => { elements.textColorInput.value = e.target.value; updateAllLabDisplays(); };
    elements.lineHeightInput.oninput = () => updateContrastDisplay();
    elements.fontSizeInput.oninput = () => updateFontUnits();
    elements.fontBaseSizeInput.onchange = () => updateFontUnits(); // rem 기준 폰트 크기 변경 시


    // 초기에는 적록색약 시뮬레이터가 기본으로 활성화되도록
    // document.getElementById('redgreen').checked = true; // 라디오 버튼 제거되었으므로 불필요
    
    updateAllLabDisplays(); // Initial render
}

function updateLabPageWithData(bgColor, textColor, fontSize) {
    document.getElementById('bg-color-input').value = bgColor;
    document.getElementById('bg-color-picker').value = bgColor;
    document.getElementById('text-color-input').value = textColor;
    document.getElementById('text-color-picker').value = textColor;
    document.getElementById('font-size-input').value = fontSize;
    
    updateContrastDisplay();
    updateUniversalColorDisplay();
    updateFontUnits();
}

function updateContrastDisplay() {
    const bgColor = document.getElementById('bg-color-input').value;
    const textColor = document.getElementById('text-color-input').value;
    const lineHeight = document.getElementById('line-height-input').value;

    const ratio = getContrastRatio(bgColor, textColor);
    document.getElementById('contrast-ratio').textContent = `${ratio.toFixed(2)} : 1`;

    const aaStatus = document.getElementById('aa-status');
    const aaaStatus = document.getElementById('aaa-status');
    const statusText = document.getElementById('status-text');

    // AA Status
    if (ratio >= 4.5) {
        aaStatus.classList.add('pass');
        aaStatus.classList.remove('fail');
    } else {
        aaStatus.classList.add('fail');
        aaStatus.classList.remove('pass');
    }

    // AAA Status
    if (ratio >= 7) {
        aaaStatus.classList.add('pass');
        aaaStatus.classList.remove('fail');
    } else {
        aaaStatus.classList.add('fail');
        aaaStatus.classList.remove('pass');
    }

    // Status Text Update
    if (ratio >= 7) {
        statusText.textContent = "훌륭합니다! WCAG AAA 기준을 충족합니다.";
        statusText.style.color = '#5CB85C'; // Green
    } else if (ratio >= 4.5) {
        statusText.textContent = "좋습니다! WCAG AA 기준을 충족합니다.";
        statusText.style.color = '#F0AD4E'; // Yellow/Orange
    } else {
        statusText.textContent = "개선이 필요합니다. WCAG AA 기준(4.5:1) 미달입니다.";
        statusText.style.color = '#D9534F'; // Red
    }
    
    const preview = document.getElementById('text-preview');
    preview.style.backgroundColor = bgColor;
    preview.style.color = textColor;
    preview.style.lineHeight = lineHeight;
    document.getElementById('line-height-value').textContent = lineHeight;
}

function updateFontUnits() {
    const sizeInput = document.getElementById('font-size-input');
    const baseSizeInput = document.getElementById('font-base-size-input');

    const size = parseFloat(sizeInput.value);
    const baseSize = parseFloat(baseSizeInput.value || 16); // 기본값 16px

    if (isNaN(size) || isNaN(baseSize) || size <= 0 || baseSize <= 0) return;
    
    const pt = (size * 0.75).toFixed(1); // 1px = 0.75pt
    const rem = (size / baseSize).toFixed(2); // rem = px / root font-size
    
    document.getElementById('pt-example').textContent = `${pt}pt`;
    document.getElementById('pt-example').style.fontSize = `${pt}pt`; // 실제 pt 크기 적용
    
    document.getElementById('rem-example').textContent = `${rem}rem`;
    document.getElementById('rem-example').style.fontSize = `${rem * baseSize}px`; // 실제 rem 크기 (px 변환값) 적용
    
    document.getElementById('sp-example').textContent = `${size}sp`;
    document.getElementById('sp-example').style.fontSize = `${size}px`; // sp는 px와 유사하게 렌더링되므로 px 적용
}


// --- Universal Color System (in Lab) ---
// 적록색약 시뮬레이션 매트릭스만 사용
const colorBlindnessMatrix_RedGreen = [
    [0.625, 0.375, 0],
    [0.7, 0.3, 0],
    [0, 0.3, 0.7]
];

function updateUniversalColorDisplay() {
    const bgColor = document.getElementById('bg-color-input').value;
    const textColor = document.getElementById('text-color-input').value;

    // 원본 색상 (일반 시각)
    updateSimColorBox('origBg', bgColor);
    updateSimColorBox('origText', textColor);

    // 시뮬레이션 색상 (적록색약 시각)
    const simBgColor = simulateColor(bgColor, colorBlindnessMatrix_RedGreen);
    const simTextColor = simulateColor(textColor, colorBlindnessMatrix_RedGreen);
    updateSimColorBox('simBg', simBgColor);
    updateSimColorBox('simText', simTextColor);

    // AI 접근성 솔루션 업데이트
    const simRatio = getContrastRatio(simBgColor, simTextColor);
    const solutionTextElement = document.getElementById('solution-text');
    
    if (simRatio < 3.0) { // WCAG 대형 텍스트 기준 (3:1) 미달 시
        solutionTextElement.innerHTML = `🚨 <span style="font-weight:bold;">경고:</span> 적록색약 시뮬레이션 대비율이