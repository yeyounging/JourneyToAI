let timer;
export let running = false;
let mili = 0;
let seconds = 0;
let minutes = 0;
let totalmili = 0;
let resultString;
let lapTimes;

//타이머 interval 1밀리세컨드로 설정 후 게임이 중지된 시점에서 작동
function startTimer() {
    if (!running) {
        running = true;
        timer = setInterval(updateTimer, 10);
    }
}

//밀리세컨드 단위 시간을 분:초:밀리초 포맷으로 정리
function updateTimer() {
    mili++;
    totalmili++;
    if (mili === 100) {
        mili = 0;
        seconds++;
        if (seconds === 60) {
            seconds = 0;
            minutes++;
        }
    }
    updateDisplay();
}

//게임중 타이머가 멈추거나 다시 작동할 경우 시간 설정
function updateTimerInGame(){
    seconds = Math.floor(mili/100);
    mili = mili % 100;
    minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;

    updateDisplay();
}

//타이머 중지 + 밀리초 0으로 설정
function stopTimer() {
    running = false;
    clearInterval(timer);
}

//메인페이지 UI용 타이머 디스플레이
function updateDisplay() {
    const timerDisplay = document.getElementById('timerDisplay');
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(mili).padStart(2, '0')}`;
}

//로컬 스토리지내용 출력시 형변환용
function formatTime(totalmili) {
    var sec = 0;
    var min = 0;

    sec = Math.floor(totalmili / 100);
    totalmili = totalmili % 100;

    min = Math.floor(sec / 60);
    sec = sec % 60

    return min + ' : ' + sec + ' : ' + totalmili;
}

//로컬 스토리지의 데이터 가져오기
function getLocalStorage() {
    //로컬 스토리지에서 랩타임 배열 가져오고 없으면 새로 만들기
    var lapTimesString = localStorage.getItem('lapTimes');
    if (!lapTimesString) {
        var initialLapTimes = []; // 초기 배열
        localStorage.setItem('lapTimes', JSON.stringify(initialLapTimes));
    }

    lapTimes = lapTimesString ? JSON.parse(lapTimesString) : [];
}

//랩타임 포맷 맞춰 로컬 스토리지에 저장하기
function laptimeFormatting() {
    var formattedLapTimes = lapTimes.map(function (lapTime) {
        return {
            time: formatTime(lapTime.time),
            name: lapTime.name
        };
    });
    resultString = formattedLapTimes.map(function (lapTime) {
        return `Name: ${lapTime.name}, Lap Time: ${lapTime.time}`;
    }).join('\n');

    //정렬된 랩타임 다시 저장
    localStorage.setItem('lapTimes', JSON.stringify(lapTimes));
}

//로컬 스토리지에 저장된 내용 기반으로 랭킹 디스플레이
function displayRank() {
    var displayElement = document.getElementById('localStorageContent');
    getLocalStorage();
    laptimeFormatting();
    displayElement.textContent = resultString || 'No Records';
}

//게임 시작시 이벤트
export function gameStart() {
    var startB = document.getElementById('startButton');
    startB.addEventListener('click', startTimer());
    startB.style.display = 'none';
    displayRank();
}

//게임 종료시 이벤트
export function endGame() {
    var userName = prompt('Input user name:');
    var newLapTime = totalmili;

    getLocalStorage();

    //유저이름 제대로 들어갔으면 UI에 출력
    if (userName !== null) {
        //새 랩타임과 이름 추가
        lapTimes.push({ time: newLapTime, name: userName });

        //램타임 정렬
        lapTimes.sort(function (a, b) { return a.time - b.time; });

        //랩타임 5개만 남기기
        lapTimes = lapTimes.slice(0, 5);

        laptimeFormatting();
        alert(resultString);
        displayRank();
        stopTimer();
    }
}

//게임 일시정지시 로컬 스토리지에 타이머 정보 저장
export function storeTimer(){
    var tempLapTimeString = localStorage.getItem('tempTimer');
    if (!tempLapTimeString) {
        var initialLapTimes = 0.0;
        localStorage.setItem('tempTimer', JSON.stringify(initialLapTimes));
    }

    localStorage.setItem('tempTimer', JSON.stringify(totalmili));
}

//게임 재개시 로컬 스토리지에 저장된 타이머 정보 바탕으로 이어서 타이머 작동
export function callTimer(){
    totalmili = localStorage.getItem('tempTimer');
    mili = totalmili;
    updateTimerInGame();
}