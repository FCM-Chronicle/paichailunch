const CONFIG = {
    API_KEY: '4d58425cb8734f3283f65a283c482b29',
    OFFICE_CODE: 'B10',
    SCHOOL_CODE: '7010170'
};

const MEAL_TYPES = {
    '1': { name: '아침', cutoff: 10 }, // 오전 10시 이후면 내일 아침
    '2': { name: '점심', cutoff: 18 }, // 오후 6시 이후면 내일 점심
    '3': { name: '저녁', cutoff: 19 }  // 오후 7시 이후면 내일 저녁
};

async function init() {
    createButtons();
    searchMeal('2'); // 기본값 점심
}

function createButtons() {
    if (document.getElementById('meal-buttons')) return;

    const container = document.createElement('div');
    container.id = 'meal-buttons';
    container.style.textAlign = 'center';
    container.style.marginBottom = '15px';

    Object.keys(MEAL_TYPES).forEach(code => {
        const btn = document.createElement('button');
        btn.innerText = MEAL_TYPES[code].name;
        btn.id = `btn-${code}`;
        btn.style.margin = '0 5px';
        btn.style.padding = '5px 10px';
        btn.style.cursor = 'pointer';
        btn.onclick = () => searchMeal(code);
        container.appendChild(btn);
    });

    const dateDisplay = document.getElementById('date-display');
    if (dateDisplay) {
        dateDisplay.parentNode.insertBefore(container, dateDisplay);
    }
}

async function searchMeal(mealCode) {
    // 버튼 스타일 업데이트
    Object.keys(MEAL_TYPES).forEach(code => {
        const btn = document.getElementById(`btn-${code}`);
        if (btn) {
            btn.style.fontWeight = code === mealCode ? 'bold' : 'normal';
            btn.style.backgroundColor = code === mealCode ? '#ddd' : '#f9f9f9';
        }
    });

    let targetDate = new Date();
    const cutoff = MEAL_TYPES[mealCode].cutoff;

    if (targetDate.getHours() >= cutoff) {
        targetDate.setDate(targetDate.getDate() + 1);
    }

    let menuFound = false;
    const display = document.getElementById('menu-text');
    if (display) {
        display.classList.add('loading');
        display.innerText = '불러오는 중...';
    }

    // 최대 7일까지 탐색
    for (let i = 0; i < 7; i++) {
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        const yyyymmdd = `${year}${month}${day}`;
        
        try {
            const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${CONFIG.API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${CONFIG.OFFICE_CODE}&SD_SCHUL_CODE=${CONFIG.SCHOOL_CODE}&MLSV_YMD=${yyyymmdd}&MMEAL_SC_CODE=${mealCode}`;            
            
            const response = await fetch(url);
            
            // 응답이 정상인지 확인
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();

            // 데이터가 존재하는지 확인
            if (data.mealServiceDietInfo) {
                const rawMenu = data.mealServiceDietInfo[1].row[0].DDISH_NM;
                const cleanMenu = rawMenu.replace(/\([^)]*\)/g, '').replace(/<br\/>/g, '\n').trim();
                
                renderPage(yyyymmdd, cleanMenu);
                menuFound = true;
                break; 
            } else {
                console.log(`${yyyymmdd}: 급식 데이터가 없습니다. (주말, 공휴일 등)`);
            }
        } catch (e) {
            console.error("데이터 가져오기 실패:", e);
        }
        
        // 메뉴 못 찾았으면 다음날로 넘김
        targetDate.setDate(targetDate.getDate() + 1);
    }

    if (!menuFound && display) {
        display.innerText = "당분간 급식 정보가 없네.\n(방학 혹은 주말)";
        display.classList.remove('loading');
    }
}

function renderPage(dateStr, menu) {
    const y = dateStr.substring(0, 4);
    const m = dateStr.substring(4, 6);
    const d = dateStr.substring(6, 8);
    document.getElementById('date-display').innerText = `${y}년 ${m}월 ${d}일`;
    
    const display = document.getElementById('menu-text');
    display.classList.remove('loading');
    display.innerText = menu;
}

init();
