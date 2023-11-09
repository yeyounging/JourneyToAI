
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
      // window.location.href = '../yes.html';
      window.alert("Correct!");
      // window.close();

   }else{
      // window.location.href = '../no.html';
      window.alert("Wrong!");
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
  
  init();
  addSphere();
  animate();
}

function init() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio((window.devicePixelRatio) ? window.devicePixelRatio : 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  renderer.setClearColor(0x00000, 0.0);
  document.getElementById('canvas').appendChild(renderer.domElement);

  // add scene and camera
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xA6CDFB, 1, 1000);

  camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 400;
  camera.position.x = 0;
  camera.position.y = 100;
  scene.add(camera);

  // planet
  planet = new THREE.Object3D();
  scene.add(planet);

  planet.position.y = -180;
 
  var geom = new THREE.IcosahedronGeometry(15, 2);

  var mat = createMaterial();
  var mesh = new THREE.Mesh(geom, mat);
  mesh.scale.x = mesh.scale.y = mesh.scale.z = 18;
  planet.add(mesh);

  // add light
  var ambientLight = new THREE.AmbientLight(0xBD9779);
  scene.add(ambientLight);

  var directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  clock = new THREE.Clock();

  // load littleprincess model
  const loader = new THREE.GLTFLoader();
  loader.load('../models/littlePrincess_2.glb', function(glb){
    princess = glb.scene.children[0];
    princess.scale.set(15,15,15);
   princess.position.x = -60;
   princess.position.y = 88;
   princess.position.z = 170;

   mixer = new THREE.AnimationMixer(glb.scene);
   
   var action = mixer.clipAction(glb.animations[0]);
   action.play();
  

    scene.add(glb.scene);
  }, undefined, function (error) {
     console.error(error);
  });

  window.addEventListener('resize', onWindowResize, false);
};

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function createMaterial(){
  var bitTexture = THREE.ImageUtils.loadTexture("green.jpg");
  var bitMaterial = new THREE.MeshBasicMaterial();
  bitMaterial.map = bitTexture;

  return bitMaterial;
}


function animate() {
  requestAnimationFrame(animate);
  planet.rotation.z += .002;
  planet.rotation.y = 0;
  planet.rotation.x = 0;
  renderer.clear();
  
  var delta = clock.getDelta();
  if(mixer) mixer.update(delta);

  animateStars();
  renderer.render( scene, camera );
};

function addSphere(){

  // The loop will move from z position of -1000 to z position 1000, adding a random particle at each position. 
  for ( var x= -400; x < 400; x+=10 ) {

    // Make a sphere (exactly the same as before). 
    var geometry   = new THREE.SphereGeometry(0.5, 32, 32)
    var material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
    var sphere = new THREE.Mesh(geometry, material)

    // This time we give the sphere random x and y positions between -500 and 500
    sphere.position.z = Math.random() * 1000 - 500;
    sphere.position.y = Math.random() * 1000 - 500;

    // Then set the z position to where it is in the loop (distance of camera)
    sphere.position.x = x;

    // scale it up a bit
    sphere.scale.x = sphere.scale.y = 4;

    //add the sphere to the scene
    scene.add( sphere );

    //finally push it to the stars array 
    stars.push(sphere); 
  }
}

function animateStars() { 
  
  // loop through each star
  for(var i=0; i<stars.length; i++) {

  star = stars[i]; 
    
  // and move it forward dependent on the mouseY position. 
  star.position.x -=  i/30;
    
  // if the particle is too close move it to the back
  if(star.position.x<-400) star.position.x+=800; 
  }
}