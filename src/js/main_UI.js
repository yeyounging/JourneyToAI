let timer;
let running = false;
let mili = 0;
let seconds = 0;
let minutes = 0;
let totalmili = 0;
let resultString;
let lapTimes;


function startTimer() {
    if (!running) {
        running = true;
        timer = setInterval(updateTimer, 10); 
    }
}

function updateTimer() {
    mili++;
    totalmili++;
    if (mili === 100) {
        mili = 0;
        seconds++;
        if(seconds === 60){
            seconds = 0;
            minutes++;
        }
    }
    updateDisplay();
}

function stopTimer() {
    running = false;
    clearInterval(timer);
}

//메인페이지 UI용
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

function getLocalStorage(){
    //로컬 스토리지에서 랩타임 배열 가져오고 없으면 새로 만들기
    var lapTimesString = localStorage.getItem('lapTimes');
    if (!lapTimesString) {
        var initialLapTimes = []; // 초기 배열
        localStorage.setItem('lapTimes', JSON.stringify(initialLapTimes));
    }

    lapTimes = lapTimesString ? JSON.parse(lapTimesString) : [];
}

function laptimeFormatting(){
    var formattedLapTimes = lapTimes.map(function(lapTime) {
        return {
            time: formatTime(lapTime.time),
            name: lapTime.name
        };
    });
    resultString = formattedLapTimes.map(function(lapTime) {
        return `Name: ${lapTime.name}, Lap Time: ${lapTime.time}`;
    }).join('\n');

    //정렬된 랩타임 다시 저장
    localStorage.setItem('lapTimes', JSON.stringify(lapTimes));
}

function showRestartButton(){
    var reStartButton = document.getElementById('reStartButton');
    reStartButton.style.display = 'block';
}

function displayRank() {
    var displayElement = document.getElementById('localStorageContent');
    getLocalStorage();
    laptimeFormatting();
    displayElement.textContent = resultString || 'No Records';
}

function gameStart(){
    mili = 0;
    seconds = 0;
    minutes = 0;
    totalmili = 0;
    var startB = document.getElementById('startButton');
    var reStartB = document.getElementById('reStartButton');
    startB.addEventListener('click', startTimer());
    startB.style.display = 'none';
    reStartB.style.display = 'none'
    displayRank();
}

function endGame(){
    var userName = prompt('Input user name:');
    var newLapTime = totalmili;

    getLocalStorage();

    //유저이름 제대로 들어갔으면 UI에 출력
    if (userName !== null) {
        //새 랩타임과 이름 추가
        lapTimes.push({ time: newLapTime, name: userName });

        //램타임 정렬
        lapTimes.sort(function(a, b) {return a.time - b.time;});

        //랩타임 5개만 남기기
        lapTimes = lapTimes.slice(0, 5);

        laptimeFormatting();
        alert(resultString);
        displayRank();
        showRestartButton();
        stopTimer();
      }
}
