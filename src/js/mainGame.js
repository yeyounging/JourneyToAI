import * as THREE from 'three'                  //Three.js
import { OrbitControls } from 'OrbitControls'   //For camera control
import { GLTFLoader } from 'GLTFLoader'         //For loading 3D model
import Stats from 'stats'                       // For FPS
import { Octree } from "Octree"                 //For collision detection (terrain)
import { Capsule } from "Capsule"               //For collision detection (character)

import { Character } from './character.js'      //Character class
class App {
    constructor() {
        const divContainer = document.querySelector("#webgl-container");
        this._divContainer = divContainer;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        divContainer.appendChild(renderer.domElement);

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.VSMShadowMap;

        this._renderer = renderer;

        const scene = new THREE.Scene();
        this._scene = scene;

        // 오브젝트 세팅 부분
        this._setupCamera();
        this._setupLight();
        this._setupModel();
        this._setupControls();

        window.onresize = this.resize.bind(this);
        this.resize();

        requestAnimationFrame(this.render.bind(this));
    }

    // =========== Logical part ===========
    _setupOctree(model) {
        this._worldOctree = new Octree();
        this._worldOctree.fromGraphNode(model);
    }

    _setupControls() {
        this._controls = new OrbitControls(this._camera, this._divContainer);
        this._controls.target.set(0, 100, 0);
        this._controls.enablePan = false;
        this._controls.enableDamping = true;

        const stats = new Stats();
        this._divContainer.appendChild(stats.dom);
        this._fps = stats;
    }

    // =========== Model ===========
    // Load model from assets and add to scene
    _setupModel() {
        const loader = new GLTFLoader();

        // =========== Skybox ===========
        const skyTextureArray = [
            new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load("../../assets/textures/skybox/ft.jpg"), }),
            new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load("../../assets/textures/skybox/bk.jpg"), }),
            new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load("../../assets/textures/skybox/up.jpg"), }),
            new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load("../../assets/textures/skybox/dn.jpg"), }),
            new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load("../../assets/textures/skybox/rt.jpg"), }),
            new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load("../../assets/textures/skybox/lf.jpg"), })
        ]

        for (let i = 0; i < skyTextureArray.length; i++) {
            skyTextureArray[i].side = THREE.BackSide;

        }

        const skyGeometry = new THREE.BoxGeometry(50000, 50000, 50000);

        this._skybox = new THREE.Mesh(skyGeometry, skyTextureArray);
        this._scene.add(this._skybox);
        // =====================

        // =========== Character ===========
        this._character = new Character(loader, "../../assets/models/gachon.glb");


        // =========== Map ===========
        this._mapLoaded = false;
        loader.load("../../assets/models/mapFinal.glb", (gltf) => {
            console.log("map loaded");
            const model = gltf.scene;
            model.scale.set(25, 25, 25);

            this._scene.add(model);

            model.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this._setupOctree(model);
            this._mapLoaded = true;
        });
        // ================


    }

    // =========== Camera ===========
    _setupCamera() {
        const camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            1,
            100000
        );

        camera.position.set(0, 100, 500);
        this._camera = camera;
    }

    // =========== Light ===========
    _setupLight() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 2);
        this._scene.add(ambientLight);

        this._addPointLight(500, 150, 500, 0xff0000, { intensity: 3 });
        this._addPointLight(-500, 150, 500, 0xffff00, { intensity: 3 });
        this._addPointLight(-500, 150, -500, 0x00ff00, { intensity: 3 });
        this._addPointLight(500, 150, -500, 0x0000ff, { intensity: 3 });

        const shadowLight = new THREE.DirectionalLight(0xffffff, 0.2);
        shadowLight.position.set(200, 500, 200);
        shadowLight.target.position.set(0, 0, 0);
        // const directionalLightHelper = new THREE.DirectionalLightHelper(shadowLight, 10);
        // this._scene.add(directionalLightHelper);

        this._scene.add(shadowLight);
        this._scene.add(shadowLight.target);

        shadowLight.castShadow = true;
        shadowLight.shadow.mapSize.width = 1024;
        shadowLight.shadow.mapSize.height = 1024;
        shadowLight.shadow.camera.top = shadowLight.shadow.camera.right = 700;
        shadowLight.shadow.camera.bottom = shadowLight.shadow.camera.left = -700;
        shadowLight.shadow.camera.near = 100;
        shadowLight.shadow.camera.far = 900;
        shadowLight.shadow.radius = 5;
        // const shadowCameraHelper = new THREE.CameraHelper(shadowLight.shadow.camera);
        // this._scene.add(shadowCameraHelper);
    }

    _addPointLight(x, y, z, helperColor, { color = 0xffffff, intensity = 1.5, distance = 2000 }) {
        const pointLight = new THREE.PointLight(color, intensity, distance);
        pointLight.position.set(x, y, z);

        this._scene.add(pointLight);

        // const pointLightHelper = new THREE.PointLightHelper(pointLight, 10, helperColor);
        // this._scene.add(pointLightHelper);
    }

    // =========== Realtime update ===========
    update(time) {
        time *= 0.001; // second unit

        this._controls.update();

        this._fps.update();

        const deltaTime = time - this._previousTime;

        if (this._character._isAddedToScene == false) {
            this._scene = this._character.setupScene(this._scene);
        }

        if (this._character._isAddedToScene == true) {
            this._character.update(deltaTime, this._camera);
            if (this._mapLoaded)
                this._character.collisionWithOctree(this._worldOctree);
            this._camera = this._character.fixCameraToModel(this._camera);
            this._controls = this._character.fixControlToModel(this._controls);
        }


        this._previousTime = time;
    }

    render(time) {
        this._renderer.render(this._scene, this._camera);
        this.update(time);

        requestAnimationFrame(this.render.bind(this));
    }

    resize() {
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;

        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();

        this._renderer.setSize(width, height);
    }
}

window.onload = function () {
    new App();
}