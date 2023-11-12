import * as THREE from 'three'                  //Three.js
import { OrbitControls } from 'OrbitControls'   //For camera control
import { GLTFLoader } from 'GLTFLoader'         //For loading 3D model
import Stats from 'stats'                       // For FPS
import { Octree } from "Octree"                 //For collision detection (terrain)
import { Capsule } from "Capsule"               //For collision detection (character)

import { Character } from './character.js'      //Character class
import { Coffee } from './coffee.js'            //Coffee class
import { GoalPoint } from './goalPoint.js'
import { endGame } from './main_UI.js'
import { gameStart } from './main_UI.js'
import { storeTimer } from './main_UI.js'
import { callTimer } from './main_UI.js'

class App {
    // Constructor for the App class
    constructor() {
        // Find the HTML container for the WebGL content
        const divContainer = document.querySelector("#webgl-container");
        this._divContainer = divContainer;

        // Create a WebGL renderer and set its properties
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        divContainer.appendChild(renderer.domElement);

        // Enable shadows and set the shadow map type
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.VSMShadowMap;

        this._renderer = renderer;

        // Create a Three.js scene
        const scene = new THREE.Scene();
        this._scene = scene;

        // Initialize lists for coffee and goal objects
        var coffeeList = [];
        this._coffeeList = coffeeList;

        var goalList = [];
        this._goalList = goalList;

        // Set up camera, lights, model, and controls
        this._setupCamera();
        this._setupLight();
        this._setupModel();
        this._setupControls();

        // Initialize HTML elements and event listeners for game start and restart
        var startButton = document.getElementById('startButton');
        var reStartButton = document.getElementById('reStartButton');
        startButton.onclick = gameStart;
        reStartButton.onclick = this.gameRestart;

        // Set up window resize event listener
        window.onresize = this.resize.bind(this);
        this.resize();

        // Start the render loop
        requestAnimationFrame(this.render.bind(this));
    }


    // Set up the Octree for collision detection using the provided 3D model and callback function upon completion
    _setupOctree(model, completeAction) {
        this._worldOctree = new Octree();
        this._worldOctree.fromGraphNode(model, completeAction);
    }

    // Set up camera controls using OrbitControls, configure settings, and display FPS statistics
    _setupControls() {
        // Create OrbitControls for camera manipulation
        this._controls = new OrbitControls(this._camera, this._divContainer);

        // Set the target point for camera controls
        this._controls.target.set(0, 100, 0);

        // Disable panning in controls
        this._controls.enablePan = false;

        // Enable damping for smooth camera movements
        this._controls.enableDamping = true;

        // Add performance statistics (FPS) display to the HTML container
        const stats = new Stats();
        this._divContainer.appendChild(stats.dom);
        this._fps = stats;
    }


    // =========== Model ===========
    // Load model from assets and add to scene
    _setupModel() {
        // Initialize the GLTF loader for loading 3D models
        const loader = new GLTFLoader();

        // =========== Skybox ===========
        // Define an array of materials for each side of the skybox, loading textures from specified paths
        const skyTextureArray = [
            new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load("../../assets/textures/skybox/ft.jpg"), }),
            new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load("../../assets/textures/skybox/bk.jpg"), }),
            new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load("../../assets/textures/skybox/up.jpg"), }),
            new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load("../../assets/textures/skybox/dn.jpg"), }),
            new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load("../../assets/textures/skybox/rt.jpg"), }),
            new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load("../../assets/textures/skybox/lf.jpg"), })
        ];

        // Set the skybox materials to render on the back side
        for (let i = 0; i < skyTextureArray.length; i++) {
            skyTextureArray[i].side = THREE.BackSide;
        }

        // Create a box geometry for the sky and add it to the scene
        const skyGeometry = new THREE.BoxGeometry(50000, 50000, 50000);
        this._skybox = new THREE.Mesh(skyGeometry, skyTextureArray);
        this._scene.add(this._skybox);
        // =====================

        // =========== Character ===========
        // Check if character information exists in local storage (game in progress)
        if (localStorage.getItem("characterInfo") != null) {
            // Retrieve and parse character data from local storage
            let storedCharacterData = localStorage.getItem('characterInfo');
            let characterDataObject = JSON.parse(storedCharacterData);
            // Create a character instance based on the stored data
            this._character = this.characterFromJson(characterDataObject);
        } else {
            // If no data exists, create a new character with default coordinates
            this._character = new Character(loader, "../../assets/models/character.glb", { x: 590, y: 50, z: 992 });
        }

        // Create goal points and add them to the goal list
        var goal1 = new GoalPoint(loader, "../../assets/models/_endpoint.glb", { x: -1397, y: -135, z: -683 }, () => {
            this._goalList.push(goal1);
        });
        var goal2 = new GoalPoint(loader, "../../assets/models/_endpoint.glb", { x: -968, y: 79, z: -927 }, () => {
            this._goalList.push(goal2);
        });
        // =====================


        // Define an array of game types
        var gameType = ["bitwise", "escape", "keyboard", "t-rex", "unique_object"];

        // Check if coffee information exists in local storage (game in progress)
        if (localStorage.getItem("coffeeInfo") != null) {
            // Retrieve and parse coffee data list from local storage
            let storedCoffeeDataList = localStorage.getItem('coffeeInfo');
            let coffeeDataObjectList = JSON.parse(storedCoffeeDataList);

            // Iterate through the list and create Coffee objects from stored data
            for (var i = 0; i < coffeeDataObjectList.list.length; i++) {
                this.coffeeFromJson(coffeeDataObjectList.list[i]);
            }
        } else {    // No coffee data in local storage (game start)
            // Create Coffee objects with specified game types and positions
            // Each Coffee object is associated with a specific game type and position
            // The callback function adds the created Coffee object to the _coffeeList
            var coffee1 = new Coffee(loader, "../../assets/models/coffee.glb", gameType[0], { x: 461, y: -130, z: 999.5 }, () => {
                this._coffeeList.push(coffee1);
            });

            var coffee2 = new Coffee(loader, "../../assets/models/coffee.glb", gameType[1], { x: 595, y: -74, z: 760 }, () => {
                this._coffeeList.push(coffee2);
            });

            var coffee3 = new Coffee(loader, "../../assets/models/coffee.glb", gameType[2], { x: 203, y: -119, z: 884 }, () => {
                this._coffeeList.push(coffee3);
            });

            var coffee4 = new Coffee(loader, "../../assets/models/coffee.glb", gameType[3], { x: 175, y: -75, z: 651 }, () => {
                this._coffeeList.push(coffee4);
            });

            var coffee5 = new Coffee(loader, "../../assets/models/coffee.glb", gameType[4], { x: -612, y: 42, z: -344 }, () => {
                this._coffeeList.push(coffee5);
            });
        }

        // Check if temporary timer information exists in local storage
        if (localStorage.getItem("tempTimer") != null) {
            // Call the timer function if temporary timer information is present
            callTimer();
        }


        // =========== Map ===========
        // Initialize variables to track loading status of the map and CrashBox
        this._mapLoaded = false;
        this._CrashBoxLoaded = false;

        // Load the map model
        loader.load("../../assets/models/map.glb", (gltf) => {
            console.log("map loaded");
            const model = gltf.scene;
            model.scale.set(10, 10, 10);
            model.position.set(0, 0, 0);

            // Add the map model to the scene
            this._scene.add(model);

            // Set up shadows for the map's meshes
            model.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Set the mapLoaded variable to true, indicating that the map has been loaded
            this._mapLoaded = true;
        });

        // Load the CrashBox model
        loader.load("../../assets/models/CrashBox.glb", (gltf) => {
            console.log("CrashBox loaded");
            const model = gltf.scene;
            model.scale.set(10, 10, 10);
            model.position.set(0, 0, 0);

            // Uncomment the following lines to add the CrashBox model to the scene and enable shadows
            // this._scene.add(model);
            // model.traverse(child => {
            //     if (child instanceof THREE.Mesh) {
            //         child.castShadow = true;
            //         child.receiveShadow = true;
            //     }
            // });

            // Set up the octree for collision detection with the CrashBox model
            this._setupOctree(model, () => {
                // Set the CrashBoxLoaded variable to true, indicating that the octree setup is complete
                this._CrashBoxLoaded = true;
                console.log("octree complete");
            });
        });

        // ================
    }

    // =========== Camera ===========
    // Set up the camera with a perspective projection
    _setupCamera() {
        const camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            1,
            100000
        );

        // Set the camera position
        camera.position.set(0, 50, 100);
        this._camera = camera;
    }

    // =========== Light ===========
    // Set up ambient light and a directional light with shadows
    _setupLight() {
        // Add ambient light to the scene
        const ambientLight = new THREE.AmbientLight(0xffffff, 4);
        this._scene.add(ambientLight);

        // Add a point light to the scene with specified parameters
        this._addPointLight(500, 500, 500, 0xff0000, { intensity: 20 });

        // Add a directional light with shadows to the scene
        const shadowLight = new THREE.DirectionalLight(0xffffff, 0.2);
        shadowLight.position.set(200, 500, 200);
        shadowLight.target.position.set(0, 0, 0);

        this._scene.add(shadowLight);
        this._scene.add(shadowLight.target);

        // Configure shadow properties for the directional light
        shadowLight.castShadow = true;
        shadowLight.shadow.mapSize.width = 1024;
        shadowLight.shadow.mapSize.height = 1024;
        shadowLight.shadow.camera.top = shadowLight.shadow.camera.right = 700;
        shadowLight.shadow.camera.bottom = shadowLight.shadow.camera.left = -700;
        shadowLight.shadow.camera.near = 100;
        shadowLight.shadow.camera.far = 900;
        shadowLight.shadow.radius = 5;
    }

    // Add a point light to the scene with specified position and helper color
    _addPointLight(x, y, z, helperColor, { color = 0xffffff, intensity = 1.5, distance = 2000 }) {
        const pointLight = new THREE.PointLight(color, intensity, distance);
        pointLight.position.set(x, y, z);

        this._scene.add(pointLight);
    }


    // Convert coffee objects to JSON format
    coffeeToJson() {
        var jsonList = [];
        for (var i = 0; i < this._coffeeList.length; i++) {
            jsonList.push(this._coffeeList[i].toJson());
        }

        var jsonObject = {
            'list': jsonList
        }

        return jsonObject;
    }

    // Convert JSON data to coffee objects and add them to the coffeeList
    // The returned coffee object is provided just in case, not required for usage
    coffeeFromJson(jsonObject) {
        var loader = new GLTFLoader();
        var coffee = new Coffee(loader, "../../assets/models/coffee.glb", jsonObject.minigame, { x: jsonObject.x, y: jsonObject.y, z: jsonObject.z }, () => {
            this._coffeeList.push(coffee);
        });

        return coffee;
    }

    // Convert JSON data to character object and return it
    characterFromJson(jsonObject) {
        var loader = new GLTFLoader();
        var character = new Character(loader, "../../assets/models/character.glb", { x: jsonObject.x, y: jsonObject.y, z: jsonObject.z });
        character.hp = jsonObject.hp;

        return character;
    }

    // Perform actions to restart the game
    gameRestart() {
        localStorage.removeItem('tempTimer');
        localStorage.removeItem('characterInfo');
        localStorage.removeItem('coffeeInfo');
        window.location.reload();
    }


    // =================================

    // =========== Realtime update ===========
    update(time) {
        time *= 0.001; // Convert time to seconds

        // Update camera controls
        this._controls.update();

        // Update frames per second
        this._fps.update();

        // Calculate time difference
        const deltaTime = time - this._previousTime;

        // Update previous time
        this._previousTime = time;

        // Check if all components are loaded
        if (this._mapLoaded == false || this._CrashBoxLoaded == false) {
            console.log(this._mapLoaded);
            console.log(this._CrashBoxLoaded);
            return;
        }

        // Check if character is added to the scene
        if (this._character._isAddedToScene == false) {
            this._scene = this._character.setupScene(this._scene);
        }

        // Check and setup scene for each coffee object
        for (var i = 0; i < this._coffeeList.length; i++) {
            if (this._coffeeList[i]._isAddedToScene == false) {
                this._scene = this._coffeeList[i].setupScene(this._scene);
            }
        }

        // Check and setup scene for each goal object
        for (var i = 0; i < this._goalList.length; i++) {
            if (this._goalList[i]._isAddedToScene == false) {
                this._scene = this._goalList[i].setupScene(this._scene);
            }
        }

        // Check if character is added to the scene
        if (this._character._isAddedToScene == true) {
            // Handle collisions with octree and coffee objects
            this._character.collisionWithOctree(this._worldOctree);
            var collisionIndex = this._character.collisionWithCoffee(this._coffeeList);

            // Handle collision with coffee
            if (collisionIndex != -1) {
                let minigameURL = "/src/minigame/" + this._coffeeList[collisionIndex]._minigame + "/" + this._coffeeList[collisionIndex]._minigame + ".html"
                this._scene.remove(this._coffeeList[collisionIndex]._model);
                this._coffeeList.splice(collisionIndex, 1);

                // Save character and coffee data to local storage
                localStorage.setItem('characterInfo', JSON.stringify(this._character.toJson()));
                localStorage.setItem('coffeeInfo', JSON.stringify(this.coffeeToJson()));
                storeTimer();

                // Redirect to minigame URL
                window.location.href = minigameURL;
            }

            // Handle collision with goal
            var isCollisionWithGoal = this._character.collisionWithGoal(this._goalList);
            if (isCollisionWithGoal != -1) {
                this._goalList.splice(isCollisionWithGoal, 1);
                endGame();

                // Restart the game
                this.gameRestart();
            }

            // Update character, camera, and controls
            this._character.update(deltaTime, this._camera);
            this._camera = this._character.fixCameraToModel(this._camera);
            this._controls = this._character.fixControlToModel(this._controls);
        }
    }


    // Render function for updating and rendering the scene
    render(time) {
        // Render the scene using the renderer
        this._renderer.render(this._scene, this._camera);

        // Update the scene
        this.update(time);

        // Request the next frame for continuous rendering
        requestAnimationFrame(this.render.bind(this));
    }

    // Resize function to handle window resizing
    resize() {
        // Get the width and height of the container
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;

        // Update camera aspect ratio and projection matrix
        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();

        // Update renderer size to match the container
        this._renderer.setSize(width, height);
    }
}

// Initialize the application on window load
window.onload = function () {
    new App();
}

