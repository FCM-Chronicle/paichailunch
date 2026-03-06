const CONFIG = {
    API_KEY: '4d58425cb8734f3283f65a283c482b29',
    OFFICE_CODE: 'B10',
    SCHOOL_CODE: '7010170'
};

async function init() {
    let targetDate = new Date();
    // 저녁 7시 이후면 다음날부터 찾기
    if (targetDate.getHours() >= 19) {
        targetDate.setDate(targetDate.getDate() + 1);
    }

    let menuFound = false;

    // 7일간 점심 메뉴를 찾을 때까지 루프
    for (let i = 0; i < 7; i++) {
        const yyyymmdd = targetDate.toISOString().slice(0, 10).replace(/-/g, "");
        
        try {
            const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${CONFIG.API_KEY}&Type=json&ATPT_OFIC_CODE=${CONFIG.OFFICE_CODE}&SD_SCHUL_CODE=${CONFIG.SCHOOL_CODE}&MLSV_YMD=${yyyymmdd}&MMEAL_SC_NM=중식`;
            
            const response = await fetch(url);
            const data = await response.json();

            if (data.mealServiceDietInfo) {
                const rawMenu = data.mealServiceDietInfo[1].row[0].DDISH_NM;
                const cleanMenu = rawMenu.replace(/\([^)]*\)/g, '').replace(/<br\/>/g, '\n').trim();
                
                renderPage(yyyymmdd, cleanMenu);
                menuFound = true;
                break; // 찾았으면 탈출
            }
        } catch (e) {
            console.error("API 호출 실패:", e);
        }
        
        // 데이터 없으면 다음 날짜로 이동
        targetDate.setDate(targetDate.getDate() + 1);
    }

    if (!menuFound) {
        renderPage("", "당분간 점심 급식 정보가 없네.\n방학이거나 나이스 점검 중일지도!");
    }
}

function renderPage(dateStr, menu) {
    if (dateStr) {
        const y = dateStr.substring(0, 4);
        const m = dateStr.substring(4, 6);
        const d = dateStr.substring(6, 8);
        document.getElementById('date-display').innerText = `${y}년 ${m}월 ${d}일`;
    }
    const display = document.getElementById('menu-text');
    display.classList.remove('loading');
    display.innerText = menu;
}

init();
