const CONFIG = {
    API_KEY: '4d58425cb8734f3283f65a283c482b29',
    OFFICE_CODE: 'B10',
    SCHOOL_CODE: '7010170'
};

async function init() {
    let now = new Date();
    
    // 1. 저녁 7시(19시) 이후면 "내일" 기준으로 탐색 시작
    if (now.getHours() >= 19) {
        now.setDate(now.getDate() + 1);
    }

    let targetDate = new Date(now); 
    let menuFound = false;

    // 2. 최대 7일까지 뒤져봄 (주말/연휴 돌파용)
    for (let i = 0; i < 7; i++) {
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const date = String(targetDate.getDate()).padStart(2, '0');
        const yyyymmdd = `${year}${month}${date}`;

        // 캐시 확인
        const cachedMenu = localStorage.getItem('bj_menu');
        const cachedDate = localStorage.getItem('bj_date');

        if (cachedMenu && cachedDate === yyyymmdd) {
            renderPage(yyyymmdd, cachedMenu);
            menuFound = true;
            break;
        }

        // API 호출
        try {
            const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${CONFIG.API_KEY}&Type=json&ATPT_OFIC_CODE=${CONFIG.OFFICE_CODE}&SD_SCHUL_CODE=${CONFIG.SCHOOL_CODE}&MLSV_YMD=${yyyymmdd}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.mealServiceDietInfo) {
                let rawMenu = data.mealServiceDietInfo[1].row[0].DDISH_NM;
                let cleanMenu = rawMenu.replace(/\([^)]*\)/g, '').replace(/<br\/>/g, '\n').trim();
                
                localStorage.setItem('bj_menu', cleanMenu);
                localStorage.setItem('bj_date', yyyymmdd);
                
                renderPage(yyyymmdd, cleanMenu);
                menuFound = true;
                break; 
            } else {
                // 오늘 데이터 없으면 다음날로 세팅하고 루프 계속
                targetDate.setDate(targetDate.getDate() + 1);
            }
        } catch (e) {
            console.error("연결 오류", e);
            break;
        }
    }

    if (!menuFound) {
        document.getElementById('menu-text').innerText = "당분간 급식 정보가 없네.\n방학인가?";
        document.getElementById('menu-text').classList.remove('loading');
    }
}

function renderPage(dateStr, menu) {
    // yyyymmdd -> yyyy년 mm월 dd일 변환
    const y = dateStr.substring(0, 4);
    const m = dateStr.substring(4, 6);
    const d = dateStr.substring(6, 8);
    
    document.getElementById('date-display').innerText = `${y}년 ${m}월 ${d}일`;
    const display = document.getElementById('menu-text');
    display.classList.remove('loading');
    display.innerText = menu;
}

init();
