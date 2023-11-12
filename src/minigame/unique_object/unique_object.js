var rand_color
var rand_color_1

var renderer, scene, camera, clock;

window.onload = function init() {

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio((window.devicePixelRatio) ? window.devicePixelRatio : 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0.0);
  document.getElementById('canvas').appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xA6CDFB, 1, 1000);
  console.log('camera');
  console.log(window.innerWidth);
  console.log(window.innerHeight);


  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 3;
  camera.position.x = 0;
  camera.position.y = 100;
  scene.add(camera);

  var ambientLight = new THREE.AmbientLight(0xf1eae4);
  scene.add(ambientLight);

  var directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  clock = new THREE.Clock();

  window.addEventListener('resize', onWindowResize, false);

  const fov = 75;
  const aspect = 2;  // the canvas default
  const near = 1;
  const far = 1000;

  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 3;

  {
    const color = 0xFFFFFF;
    const intensity = 0.8;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
  }


  const geometry = new THREE.IcosahedronBufferGeometry();

  function makeInstance(geometry, color, x, y) {
    const material = new THREE.MeshPhongMaterial({ color });

    const icosahedron = new THREE.Mesh(geometry, material);

    const scaleValue = 0.3; 
    icosahedron.scale.set(scaleValue, scaleValue, scaleValue);
    scene.add(icosahedron);

    icosahedron.position.x = x;
    icosahedron.position.y = y;

    return icosahedron;
  }

  // make random color
  randomColor();

  // rand_color : normal color
  // rand_color_1 : special color (unique)
  const random_array = { rand_color, rand_color_1 };
  console.log(random_array);

  answer_cube = Math.floor(Math.random() * 8);
  console.log(answer_cube);

  // icosahedron (x,y)
  const x = [-1.0, 0.0, 1.0, -1.0, 0.0, 1.0, -1.0, 0.0, 1.0];
  const y = [0.9, 0.9, 0.9, 0.0, 0.0, 0.0, -0.9, -0.9, -0.9,];
  const randObjects = [];

  for (var i = 0; i < 9; i++) {
    if (i == answer_cube) {
      randObjects.push(makeInstance(geometry, rand_color_1, x[i], y[i]));
    }
    else {
      randObjects.push(makeInstance(geometry, rand_color, x[i], y[i]));
    }
    console.log(randObjects.length);

  }

  // icosahedron rotation
  function render(time) {
    time *= 0.001;  

    randObjects.forEach((icosahedron, ndx) => {
      const speed = 0.3 + ndx * .1;
      const rot = time * speed;
      icosahedron.rotation.x = rot;
      icosahedron.rotation.y = rot;
    });

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  // random color (unique color is -0.2 per r,g,b)
  function randomColor() {
    var r = Math.random();
    var g = Math.random();
    var b = Math.random();
    r1 = r - 0.08;
    g1 = g - 0.08;
    b1 = b - 0.08;
    rand_color = new THREE.Color(r, g, b);
    rand_color_1 = new THREE.Color(r1, g1, b1);

  };



  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  let onMouseClick = function (e) {
    let gap1 = e.clientX - e.offsetX
    let gap2 = e.clientY - e.offsetY
    mouse.x = ((e.clientX - gap1) / (window.innerWidth * 0.375)) * 2 - 1;
    mouse.y = -((e.clientY - gap2) / (window.innerHeight * 0.375)) * 2 + 1;

    var x = mouse.x;
    var y = mouse.y;
    console.log(x);
    console.log(y);

    var user_answer;

    if (0.85 <= x && x <= 1.25) {
      if (-0.91 <= y && y <= -0.25) {
        user_answer = 0;
      }
      if (-1.97 <= y && y <= -1.31) {
        user_answer = 3;
      }
      if (-3.14 <= y && y <= -2.35) {
        user_answer = 6;
      }
    }
    else if (1.45 <= x && x <= 1.82) {
      if (-0.91 <= y && y <= -0.25) {
        user_answer = 1;
      }
      if (-1.97 <= y && y <= -1.31) {
        user_answer = 4;
      }
      if (-3.14 <= y && y <= -2.35) {
        user_answer = 7;
      }
    }
    else if (2.05 <= x && x <= 2.45) {
      if (-0.91 <= y && y <= -0.25) {
        user_answer = 2;
      }
      if (-1.97 <= y && y <= -1.31) {
        user_answer = 5;
      }
      if (-3.14 <= y && y <= -2.35) {
        user_answer = 8;
      }
    }

    console.log(user_answer);

    if (user_answer == answer_cube) {
      window.location.href = "../result/success.html";
    }
    else {
      window.location.href = "../result/failure.html";
    }

    rayCast.setFromCamera(mouse, camera);
  }


  requestAnimationFrame(render);
  renderer.render(scene, camera);

  rayCast = new THREE.Raycaster();

  mouse = new THREE.Vector2();

  mouse.x = mouse.y = -1;

  document.getElementById('canvas').appendChild(renderer.domElement);

  document.getElementById('canvas').addEventListener("click", onMouseClick, false);


}
