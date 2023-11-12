// Initialize variables for Three.js rendering
var renderer, scene, camera, composer, planet;

// Variables for binary and decimal numbers
var num_2 = "";
var num_2_2 = "";
var num_10 = -1;
var input;
var result;
var flag = 0;
var stars = [];

// Function to generate a random 4-bit binary number
function makeBinaryNum() {
    var i = 4;
    while (i > 0) {
        const num = Math.round(Math.random());
        num_2 = num_2 + num.toString();
        i--;
    }
    num_2_2 = num_2;
}

// Function to convert binary to decimal
function changeBinaryToDecimal() {
    if (num_2 == "0000") {
        num_10 = parseInt(0);
    } else {
        num_10 = parseInt(num_2, 2);
    }
}

// Function to check the user's answer
function checkAnswer(answer) {
    if (num_10 == answer) {
        window.location.href = "../result/success.html";
    } else {
        window.location.href = "../result/failure.html";
    }
}

// Execute functions to set up the game
makeBinaryNum();
changeBinaryToDecimal();

// Event listener for button click to check the user's answer
window.onload = function () {
    var btn = document.getElementsByClassName("btn")[0];

    btn.addEventListener("click", function () {
        var answer = document.getElementById("answer").value;
        answer = parseInt(answer);
        checkAnswer(answer);
    });
}
