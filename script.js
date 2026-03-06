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

let currentDate = new Date();
let currentMealCode = '2'; // 기본값 점심

async function init() {
    injectStyles();
    createButtons();
    createNavigation();
    createModal();
    
    // 초기 로드: 가장 가까운 점심 찾기
    await findNearestMealFromToday('2');
}

function injectStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        body { background-color: #eef2f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; }
        #meal-buttons { text-align: center; margin-bottom: 20px; }
        .styled-btn {
            background: white;
            border: 2px solid #111827;
            border-radius: 10px;
            padding: 10px 15px;
            font-weight: 600;
            color: #111827;
            cursor: pointer;
            box-shadow: 4px 4px 0 #111827;
            transition: transform 0.1s, box-shadow 0.1s;
            margin: 0 5px;
        }
        .styled-btn:active {
            transform: translate(4px, 4px);
            box-shadow: 0 0 0 #111827;
        }
        .styled-btn.active {
            background-color: #004080;
            color: white;
        }
        .styled-btn.small {
            padding: 5px 12px;
            font-size: 0.9em;
            border-radius: 8px;
            box-shadow: 3px 3px 0 #111827;
        }
        .styled-btn.small:active {
            transform: translate(3px, 3px);
            box-shadow: 0 0 0 #111827;
        }
        .nav-container { display: flex; justify-content: center; align-items: center; margin-bottom: 20px; gap: 15px; }
        .today-btn-container { text-align: center; margin-top: -10px; margin-bottom: 20px; }
        #date-display.styled-btn {
            min-width: 180px; /* 날짜 길이에 따른 너비 변화 방지 */
        }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; justify-content: center; align-items: center; z-index: 1000; }
        .modal-content { background: white; padding: 20px; border-radius: 10px; width: 85%; max-width: 400px; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .modal-list-item { padding: 12px; border-bottom: 1px solid #eee; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .modal-list-item:hover { background: #f5f5f5; }
        .modal-date { font-weight: bold; margin-right: 10px; min-width: 60px; }
        .modal-menu { color: #555; font-size: 0.9em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
        .close-modal { float: right; cursor: pointer; font-size: 1.5em; margin-top: -10px; }
    `;
    document.head.appendChild(style);
}

function createButtons() {
    if (document.getElementById('meal-buttons')) return;

    const container = document.createElement('div');
    container.id = 'meal-buttons';

    Object.keys(MEAL_TYPES).forEach(code => {
        const btn = document.createElement('button');
        btn.innerText = MEAL_TYPES[code].name;
        btn.className = 'styled-btn';
        btn.id = `btn-${code}`;
        btn.onclick = () => changeMealType(code);
        container.appendChild(btn);
    });

    const dateDisplay = document.getElementById('date-display');
    if (dateDisplay) {
        dateDisplay.parentNode.insertBefore(container, dateDisplay);
    }
}

function createNavigation() {
    const dateDisplay = document.getElementById('date-display');
    if (!dateDisplay || document.getElementById('nav-container')) return;

    // 날짜 디스플레이를 버튼 스타일로 변경
    dateDisplay.classList.add('styled-btn');

    const navContainer = document.createElement('div');
    navContainer.id = 'nav-container';
    navContainer.className = 'nav-container';

    const prevBtn = document.createElement('button');
    prevBtn.innerText = '◀';
    prevBtn.className = 'styled-btn';
    prevBtn.onclick = () => changeDate(-1);

    const nextBtn = document.createElement('button');
    nextBtn.innerText = '▶';
    nextBtn.className = 'styled-btn';
    nextBtn.onclick = () => changeDate(1);

    const todayBtn = document.createElement('button');
    todayBtn.innerText = '오늘';
    todayBtn.className = 'styled-btn small'; // 작은 버튼 클래스 적용
    todayBtn.onclick = () => findNearestMealFromToday(currentMealCode);

    // '오늘' 버튼을 위한 별도 컨테이너 생성
    const todayContainer = document.createElement('div');
    todayContainer.className = 'today-btn-container';
    todayContainer.appendChild(todayBtn);

    // 기존 날짜 요소를 네비게이션 컨테이너로 이동
    dateDisplay.parentNode.insertBefore(navContainer, dateDisplay);
    navContainer.appendChild(prevBtn);
    navContainer.appendChild(dateDisplay);
    navContainer.appendChild(nextBtn);
    
    // 네비게이션 컨테이너 바로 뒤에 '오늘' 버튼 컨테이너 추가
    navContainer.insertAdjacentElement('afterend', todayContainer);

    // 날짜 클릭 시 모달 열기
    dateDisplay.onclick = openModal;
}

function createModal() {
    const modal = document.createElement('div');
    modal.id = 'date-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="document.getElementById('date-modal').style.display='none'">&times;</span>
            <h3 style="margin-top:0; text-align:center;">7일간의 급식</h3>
            <div id="modal-list"></div>
        </div>
    `;
    document.body.appendChild(modal);

    // 모달 배경 클릭 시 닫기
    modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };
}

// 아침/점심/저녁 버튼 클릭 시: 현재 날짜에서 급식 종류만 변경
async function changeMealType(mealCode) {
    currentMealCode = mealCode;
    updateButtonStyles();
    await renderCurrentDate();
}

// 초기 로드 또는 '오늘' 버튼 클릭 시: 오늘부터 가장 가까운 급식을 찾음
async function findNearestMealFromToday(mealCode) {
    currentMealCode = mealCode;
    updateButtonStyles();

    let searchDate = new Date(); // 오늘부터 검색 시작
    const cutoff = MEAL_TYPES[mealCode].cutoff;

    // 컷오프 시간이 지났으면 내일부터 검색
    if (searchDate.getHours() >= cutoff) {
        searchDate.setDate(searchDate.getDate() + 1);
    }

    await searchAndRender(searchDate, 7); // 최대 7일 검색
}

function updateButtonStyles() {
    Object.keys(MEAL_TYPES).forEach(code => {
        const btn = document.getElementById(`btn-${code}`);
        if (btn) {
            if (code === currentMealCode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
}

// 화살표 클릭 시: 하루씩 이동 (데이터 유무 상관없이 이동)
async function changeDate(offset) {
    currentDate.setDate(currentDate.getDate() + offset);
    await renderCurrentDate();
}

// 특정 날짜부터 검색해서 데이터가 있는 첫 날을 찾아 보여줌 (findNearestMealFromToday에서 사용)
async function searchAndRender(startDate, limit) {
    const display = document.getElementById('menu-text');
    if (display) {
        display.classList.add('loading');
        display.innerText = '불러오는 중...';
    }

    const searchStartDate = new Date(startDate);
    const searchEndDate = new Date(startDate);
    searchEndDate.setDate(searchEndDate.getDate() + limit - 1);

    const startStr = `${searchStartDate.getFullYear()}${String(searchStartDate.getMonth() + 1).padStart(2, '0')}${String(searchStartDate.getDate()).padStart(2, '0')}`;
    const endStr = `${searchEndDate.getFullYear()}${String(searchEndDate.getMonth() + 1).padStart(2, '0')}${String(searchEndDate.getDate()).padStart(2, '0')}`;

    try {
        const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${CONFIG.API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${CONFIG.OFFICE_CODE}&SD_SCHUL_CODE=${CONFIG.SCHOOL_CODE}&MLSV_FROM_YMD=${startStr}&MLSV_TO_YMD=${endStr}&MMEAL_SC_CODE=${currentMealCode}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        if (data.mealServiceDietInfo) {
            const firstMeal = data.mealServiceDietInfo[1].row[0];
            const mealDateStr = firstMeal.MLSV_YMD;
            // YYYYMMDD 문자열을 Date 객체로 변환
            const mealDate = new Date(parseInt(mealDateStr.substring(0, 4)), parseInt(mealDateStr.substring(4, 6)) - 1, parseInt(mealDateStr.substring(6, 8)));
            
            currentDate = mealDate; // 데이터 찾은 날짜로 업데이트
            updateDateDisplay(currentDate);
            renderPage(parseMenu(firstMeal.DDISH_NM));
        } else {
            // 검색 기간 내에 급식 정보가 없는 경우
            currentDate = new Date(startDate);
            updateDateDisplay(startDate);
            display.innerText = "당분간 급식 정보가 없네.\n(방학 혹은 주말)";
            display.classList.remove('loading');
        }
    } catch (e) {
        console.error("데이터 가져오기 실패:", e);
        // 못 찾았으면 검색 시작 날짜로 설정하고 메시지 표시
        currentDate = new Date(startDate);
        updateDateDisplay(startDate);
        display.innerText = "당분간 급식 정보가 없네.\n(방학 혹은 주말)";
        display.classList.remove('loading');
    }
}

// 현재 currentDate 기준으로 데이터 가져와서 표시 (화살표/모달용)
async function renderCurrentDate() {
    const display = document.getElementById('menu-text');
    if (display) {
        display.classList.add('loading');
        display.innerText = '불러오는 중...';
    }

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const yyyymmdd = `${year}${month}${day}`;

    updateDateDisplay(currentDate);

    try {
        const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${CONFIG.API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${CONFIG.OFFICE_CODE}&SD_SCHUL_CODE=${CONFIG.SCHOOL_CODE}&MLSV_YMD=${yyyymmdd}&MMEAL_SC_CODE=${currentMealCode}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.mealServiceDietInfo) {
            renderPage(parseMenu(data.mealServiceDietInfo[1].row[0].DDISH_NM));
        } else {
            if (display) {
                display.innerText = "급식 정보가 없어.";
                display.classList.remove('loading');
            }
        }
    } catch (e) {
        if (display) {
            display.innerText = "오류가 발생했어.";
            display.classList.remove('loading');
        }
    }
}

function parseMenu(rawMenu) {
    return rawMenu.replace(/\([^)]*\)/g, '').replace(/<br\/>/g, '\n').trim();
}

function updateDateDisplay(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = days[dateObj.getDay()];
    
    document.getElementById('date-display').innerText = `${y}년 ${m}월 ${d}일 (${dayName})`;
}

function renderPage(menu) {
    const display = document.getElementById('menu-text');
    display.classList.remove('loading');
    display.innerText = menu;
}

async function openModal() {
    const modal = document.getElementById('date-modal');
    const listContainer = document.getElementById('modal-list');
    listContainer.innerHTML = '<div style="text-align:center; padding:20px;">로딩 중...</div>';
    modal.style.display = 'flex';

    // 현재 보고 있는 날짜부터 7일간 조회
    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + 6);

    const startStr = `${startDate.getFullYear()}${String(startDate.getMonth()+1).padStart(2,'0')}${String(startDate.getDate()).padStart(2,'0')}`;
    const endStr = `${endDate.getFullYear()}${String(endDate.getMonth()+1).padStart(2,'0')}${String(endDate.getDate()).padStart(2,'0')}`;

    try {
        const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${CONFIG.API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${CONFIG.OFFICE_CODE}&SD_SCHUL_CODE=${CONFIG.SCHOOL_CODE}&MLSV_FROM_YMD=${startStr}&MLSV_TO_YMD=${endStr}&MMEAL_SC_CODE=${currentMealCode}`;
        const response = await fetch(url);
        const data = await response.json();

        listContainer.innerHTML = '';

        // 날짜별 데이터 매핑
        const menuMap = {};
        if (data.mealServiceDietInfo) {
            data.mealServiceDietInfo[1].row.forEach(item => {
                menuMap[item.MLSV_YMD] = item.DDISH_NM;
            });
        }

        // 7일치 리스트 생성
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
            const dayName = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'modal-list-item';
            
            const dateSpan = document.createElement('span');
            dateSpan.className = 'modal-date';
            dateSpan.innerText = `${d.getMonth()+1}/${d.getDate()} (${dayName})`;
            
            const menuSpan = document.createElement('span');
            menuSpan.className = 'modal-menu';
            if (menuMap[ymd]) {
                menuSpan.innerText = parseMenu(menuMap[ymd]).replace(/\n/g, ', ');
            } else {
                menuSpan.innerText = '(급식 없음)';
                menuSpan.style.color = '#ccc';
            }

            itemDiv.appendChild(dateSpan);
            itemDiv.appendChild(menuSpan);

            itemDiv.onclick = () => {
                currentDate = new Date(d);
                renderCurrentDate();
                modal.style.display = 'none';
            };

            listContainer.appendChild(itemDiv);
        }

    } catch (e) {
        listContainer.innerHTML = '<div style="text-align:center; color:red;">목록을 불러오지 못했어.</div>';
    }
}

init();
