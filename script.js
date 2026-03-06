const CONFIG = {
    API_KEY: '4d58425cb8734f3283f65a283c482b29',
    OFFICE_CODE: 'B10',
    SCHOOL_CODE: '7010077'
};

async function init() {
    const now = new Date();
    
    // 1. 저녁 7시(19시) 이후면 "내일 급식"을 기본으로 설정
    if (now.getHours() >= 19) {
        now.setDate(now.getDate() + 1);
    }

    let targetDate = now;
    let menuFound = false;
    let retryCount = 0;
    const maxRetries = 5; // 최대 5일 뒤까지 뒤져봄 (금요일 저녁이면 다음주 월요일까지)

    // 2. 급식 데이터가 있을 때까지 날짜를 하루씩 뒤로 밀며 탐색
    while (!menuFound && retryCount < maxRetries) {
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const date = String(targetDate.getDate()).padStart(2, '0');
        const yyyymmdd = `${year}${month}${date}`;

        // 화면 날짜 표시 업데이트
        document.getElementById('date-display').innerText = `${year}년 ${month}월 ${date}일`;

        // 금고(localStorage) 확인
        const cachedMenu = localStorage.getItem('bj_menu');
        const cachedDate = localStorage.getItem('bj_date');

        if (cachedMenu && cachedDate === yyyymmdd) {
            console.log(yyyymmdd + " 데이터 캐시 사용");
            renderMenu(cachedMenu);
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
                
                renderMenu(cleanMenu);
                menuFound = true;
            } else {
                // 오늘(또는 타겟날짜) 급식이 없으면 하루 더해봄
                targetDate.setDate(targetDate.getDate() + 1);
                retryCount++;
            }
        } catch (e) {
            renderMenu("급식을 가져오다가 오류가 났어.\n네트워크 확인해봐!");
            break;
        }
    }

    if (!menuFound) {
        renderMenu("며칠간 급식 정보가 없네?\n방학이거나 나이스 점검 중일지도!");
    }
}

function renderMenu(text) {
    const display = document.getElementById('menu-text');
    display.classList.remove('loading');
    display.innerText = text;
}

init();
