const CONFIG = {
    API_KEY: '4d58425cb8734f3283f65a283c482b29',
    OFFICE_CODE: 'B10',
    SCHOOL_CODE: '7010170'
};

async function init() {
    let targetDate = new Date();
    // 금요일 7시(19시) 이후면 월요일로 점프하기 위한 로직
    if (targetDate.getHours() >= 19) {
        targetDate.setDate(targetDate.getDate() + 1);
    }

    let menuFound = false;

    // 최대 7일까지 탐색
    for (let i = 0; i < 7; i++) {
        const yyyymmdd = targetDate.toISOString().slice(0, 10).replace(/-/g, "");
        
        try {
            const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${CONFIG.API_KEY}&Type=json&ATPT_OFIC_CODE=${CONFIG.OFFICE_CODE}&SD_SCHUL_CODE=${CONFIG.SCHOOL_CODE}&MLSV_YMD=${yyyymmdd}&MMEAL_SC_NM=중식`;
            
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
            }
        } catch (e) {
            console.error("데이터 가져오기 실패:", e);
        }
        
        // 메뉴 못 찾았으면 다음날로 넘김
        targetDate.setDate(targetDate.getDate() + 1);
    }

    if (!menuFound) {
        document.getElementById('menu-text').innerText = "당분간 점심 급식 정보가 없네.\n(방학 혹은 주말)";
        document.getElementById('menu-text').classList.remove('loading');
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
