const CONFIG = {
    API_KEY: '4d58425cb8734f3283f65a283c482b29', // 여기에 네 API 키 꼭 넣어!
    OFFICE_CODE: 'B10',
    SCHOOL_CODE: '7010077'
};

async function init() {
    const today = new Date();
    // 한국 시간 기준으로 날짜 생성
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    const yyyymmdd = `${year}${month}${date}`;
    
    document.getElementById('date-display').innerText = `${year}년 ${month}월 ${date}일`;

    // 1. 금고(localStorage) 확인
    const cachedMenu = localStorage.getItem('bj_menu');
    const cachedDate = localStorage.getItem('bj_date');

    if (cachedMenu && cachedDate === yyyymmdd) {
        console.log("오늘 급식은 이미 금고에 있네? 바로 보여줌!");
        renderMenu(cachedMenu);
        return;
    }

    // 2. 금고에 없으면(첫 접속자) 나이스 API 호출
    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${CONFIG.API_KEY}&Type=json&ATPT_OFIC_CODE=${CONFIG.OFFICE_CODE}&SD_SCHUL_CODE=${CONFIG.SCHOOL_CODE}&MLSV_YMD=${yyyymmdd}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.mealServiceDietInfo) {
            let rawMenu = data.mealServiceDietInfo[1].row[0].DDISH_NM;
            // 알레르기 번호 제거 및 깔끔하게 정리
            let cleanMenu = rawMenu.replace(/\([^)]*\)/g, '').replace(/<br\/>/g, '\n').trim();
            
            // 금고에 저장
            localStorage.setItem('bj_menu', cleanMenu);
            localStorage.setItem('bj_date', yyyymmdd);
            
            renderMenu(cleanMenu);
        } else {
            renderMenu("오늘은 급식이 없나 봐요.\n(주말 혹은 공휴일)");
        }
    } catch (e) {
        renderMenu("급식을 찾다가 오류가 났네.\n개발자한테 알려줘!");
    }
}

function renderMenu(text) {
    const display = document.getElementById('menu-text');
    display.classList.remove('loading');
    display.innerText = text;
}

init();
