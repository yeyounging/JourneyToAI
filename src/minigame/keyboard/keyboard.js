// Three.js rendering variables
var renderer, scene, camera;
var stars = [];

// Arrays for the quiz generation and user input
var quiz = [];
var quizArrow = [];
var answer = [];
var keyArray = [37, 38, 39, 40]; // Key codes for arrow keys (left, up, right, down)
var arrow = ["⇦", "⇧", "⇨", "⇩"]; // Corresponding arrow symbols

// Randomly generate a sequence of arrow keys for the quiz
for (var i = 0; i < 6; i++) {
  var j = Math.floor(Math.random() * 4);
  quiz.push(keyArray[j]);
  quizArrow.push(arrow[j]);
}

// Event listener for keydown to capture user input
$(document).keydown(function (e) {
  if (keyArray.includes(e.which)) { // Check if the pressed key is an arrow key
    handleKeyDown(e.which);
  }
});

// Event listener for keyup to reset the pressed state
$(document).keyup(function (e) {
  if (keyArray.includes(e.which)) { // Check if the released key is an arrow key
    handleKeyUp(e.which);
  }
});

// Function to handle keydown events and track user input
function handleKeyDown(key) {
  var arrowClass, arrowText;

  // Display pressed state and set translation for animation
  switch (key) {
    case 37:
      arrowClass = '.left';
      arrowText = 'LEFT';
      translateArrow('.left');
      break;
    case 38:
      arrowClass = '.up';
      arrowText = 'UP';
      translateArrow('.left, .down, .right');
      break;
    case 39:
      arrowClass = '.right';
      arrowText = 'RIGHT';
      translateArrow('.right');
      break;
    case 40:
      arrowClass = '.down';
      arrowText = 'DOWN';
      translateArrow('.down');
      break;
  }

  // Store the user's input in the answer array
  answer.push(key);

  // Check if the user has entered all the required keys and call the quizResult function
  if (answer.length == 6) {
    quizResult();
  } else {
    console.log(answer);
  }

  // Function to animate the arrow by applying a translation
  function translateArrow(selector) {
    $(selector).addClass('pressed');
    $(arrowClass + 'text').text(arrowText);
    $(selector).css('transform', 'translate(0, 2px)');
  }
}

// Function to handle keyup events and reset the pressed state
function handleKeyUp(key) {
  // Remove pressed state and reset text and translation
  switch (key) {
    case 37:
      resetArrow('.left');
      break;
    case 38:
      resetArrow('.left, .down, .right');
      break;
    case 39:
      resetArrow('.right');
      break;
    case 40:
      resetArrow('.down');
      break;
  }

  // Function to reset the arrow to its initial state
  function resetArrow(selector) {
    $(selector).removeClass('pressed');
    $(arrowClass + 'text').text('');
    $(selector).css('transform', 'translate(0, 0)');
  }
}

// Function to compare the user's input with the generated quiz
function quizResult() {
  for (var i = 0; i < answer.length; i++) {
    if (answer[i] != quiz[i]) {
      window.location.href = '../../minigame/result/failure.html';
      break;
    } else {
      if (i == 5) {
        window.location.href = '../../minigame/result/success.html';
      }
    }
  }
}

// Initialize the game on window load
window.onload = function () {
  init();
}

// Function to initialize Three.js rendering
function init() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio((window.devicePixelRatio) ? window.devicePixelRatio : 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0.0);
  document.getElementById('canvas').appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xA6CDFB, 1, 1000);

  camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 400;
  camera.position.x = 0;
  camera.position.y = 100;
  scene.add(camera);

  var ambientLight = new THREE.AmbientLight(0xBD9779);
  scene.add(ambientLight);

  var directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  window.addEventListener('resize', onWindowResize, false);
}

// Function to handle window resize events
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
