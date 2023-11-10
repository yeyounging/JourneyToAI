
var renderer, scene, camera, composer, planet, mixer, clock;

var num_2="";
var num_2_2 = "";
var num_10 = -1 ;
var input;
var result;
var flag = 0;
var stars =[];

makeBinaryNum();
changeBinaryToDecimal();

function makeBinaryNum(){

  // make binary random number (4bit)
    var i = 4;
    while (i > 0){
        const num = Math.round(Math.random());
        num_2 = num_2 + num.toString();
        i--;
    }
    num_2_2 = num_2;
}

function changeBinaryToDecimal(){
    // change decimal number
    if(num_2 == "0000") {
        num_10= parseInt(0);
    }
    else {
        num_10 = (parseInt(num_2,2));
    }
}

function checkAnswer(answer){
    // check answer
   if (num_10 == answer){
      window.location.href = "../result/success.html";
      // window.close();

   }else{
    window.location.href = "../result/failure.html";
   }
}

window.onload = function() {
  
  var btn = document.getElementsByClassName("btn")[0];
  
  // get input answer number and check
  btn.addEventListener("click", function(){
    var answer = document.getElementById("answer").value;
    answer = parseInt(answer);
    checkAnswer(answer);
  });
}