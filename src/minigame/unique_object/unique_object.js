// Variable declarations for random colors
var rand_color;
var rand_color_1;

// Three.js rendering variables
var renderer, scene, camera;

// Function to initialize the game upon window load
window.onload = function init() {

  // Initialize Three.js renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio((window.devicePixelRatio) ? window.devicePixelRatio : 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0.0);
  document.getElementById('canvas').appendChild(renderer.domElement);

  // Set up the Three.js scene
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xA6CDFB, 1, 1000);

  // Set up the camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 3;

  // Add ambient light to the scene
  var ambientLight = new THREE.AmbientLight(0xf1eae4);
  scene.add(ambientLight);

  // Add directional light to the scene
  var directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);


  // Handle window resize events
  window.addEventListener('resize', onWindowResize, false);

  // Set up the camera with perspective parameters
  const fov = 75;
  const aspect = 2;
  const near = 1;
  const far = 1000;

  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 3;

  // Add directional light with specific color and intensity
  {
    const color = 0xFFFFFF;
    const intensity = 0.8;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
  }

  // Create an icosahedron geometry
  const geometry = new THREE.IcosahedronBufferGeometry();

  // Function to create an instance of an icosahedron with specified color and position
  function makeInstance(geometry, color, x, y) {
    const material = new THREE.MeshPhongMaterial({ color });

    const icosahedron = new THREE.Mesh(geometry, material);

    // Scale and position the icosahedron
    const scaleValue = 0.3;
    icosahedron.scale.set(scaleValue, scaleValue, scaleValue);
    scene.add(icosahedron);

    icosahedron.position.x = x;
    icosahedron.position.y = y;

    return icosahedron;
  }

  // Generate random colors
  randomColor();

  // Set up an array to hold the icosahedron objects
  const randObjects = [];

  // Set up the answer cube and its position
  answer_cube = Math.floor(Math.random() * 8);

  // Arrays defining the x and y positions of the icosahedrons
  const x = [-1.0, 0.0, 1.0, -1.0, 0.0, 1.0, -1.0, 0.0, 1.0];
  const y = [0.9, 0.9, 0.9, 0.0, 0.0, 0.0, -0.9, -0.9, -0.9];

  // Create icosahedron instances and store them in the randObjects array
  for (var i = 0; i < 9; i++) {
    if (i == answer_cube) {
      randObjects.push(makeInstance(geometry, rand_color_1, x[i], y[i]));
    } else {
      randObjects.push(makeInstance(geometry, rand_color, x[i], y[i]));
    }
  }

  // Function to handle animation and rotation of icosahedrons
  function render(time) {
    time *= 0.001;

    randObjects.forEach((icosahedron, ndx) => {
      const speed = 0.3 + ndx * 0.1;
      const rot = time * speed;
      icosahedron.rotation.x = rot;
      icosahedron.rotation.y = rot;
    });

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  // Function to generate random colors
  function randomColor() {
    var r = Math.random();
    var g = Math.random();
    var b = Math.random();
    r1 = r - 0.08;
    g1 = g - 0.08;
    b1 = b - 0.08;
    rand_color = new THREE.Color(r, g, b);
    rand_color_1 = new THREE.Color(r1, g1, b1);
  }

  // Function to handle window resize events
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Function to handle mouse click events and check user's answer
  let onMouseClick = function (e) {
    let gap1 = e.clientX - e.offsetX;
    let gap2 = e.clientY - e.offsetY;
    mouse.x = ((e.clientX - gap1) / (window.innerWidth * 0.375)) * 2 - 1;
    mouse.y = -((e.clientY - gap2) / (window.innerHeight * 0.375)) * 2 + 1;

    var x = mouse.x;
    var y = mouse.y;

    var user_answer;

    // Determine the user's answer based on mouse click position
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
    } else if (1.45 <= x && x <= 1.82) {
      if (-0.91 <= y && y <= -0.25) {
        user_answer = 1;
      }
      if (-1.97 <= y && y <= -1.31) {
        user_answer = 4;
      }
      if (-3.14 <= y && y <= -2.35) {
        user_answer = 7;
      }
    } else if (2.05 <= x && x <= 2.45) {
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

    // Check if the user's answer is correct and redirect to result pages accordingly
    if (user_answer == answer_cube) {
      window.location.href = "../result/success.html";
    } else {
      window.location.href = "../result/failure.html";
    }

    rayCast.setFromCamera(mouse, camera);
  };

  // Call the render function for animation
  requestAnimationFrame(render);

  // Initialize raycaster and mouse vector for click events
  rayCast = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  mouse.x = mouse.y = -1;

  // Add the renderer element to the HTML document
  document.getElementById('canvas').appendChild(renderer.domElement);

  // Add click event listener to the canvas
  document.getElementById('canvas').addEventListener("click", onMouseClick, false);
}
