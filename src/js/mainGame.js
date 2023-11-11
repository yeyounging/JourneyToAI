import * as THREE from 'three'                  //Three.js
import { OrbitControls } from 'OrbitControls'   //For camera control
import { GLTFLoader } from 'GLTFLoader'         //For loading 3D model
import Stats from 'stats'                       // For FPS
import { Octree } from "Octree"                 //For collision detection (terrain)
import { Capsule } from "Capsule"               //For collision detection (character)

import { Character } from './character.js'      //Character class
import { Coffee } from './coffee.js'            //Coffee class
import { GoalPoint } from './goalPoint.js'
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

        var coffeeList = [];
        this._coffeeList = coffeeList;

        var goalList = [];
        this._goalList = goalList;

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
    _setupOctree(model, completeAction) {
        this._worldOctree = new Octree();
        this._worldOctree.fromGraphNode(model, completeAction);
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
        // 생성자의 중괄호 안에 x, y, z좌표를 입력하여 캐릭터의 시작 위치를 변경할 수 있다.
        this._character = new Character(loader, "../../assets/models/character.glb", { x: 515, y: 50, z: 1000 });

        var goal1 = new GoalPoint(loader, "../../assets/models/goal.glb", { x: -1277, y: -135, z: -1153 }, () => {
            this._goalList.push(goal1);
        });
        var goal2 = new GoalPoint(loader, "../../assets/models/goal.glb", { x: -968, y: 79, z: -927 }, () => {
            this._goalList.push(goal2);
        });

        // 무당이
        var coffee1 = new Coffee(loader, "../../assets/models/coffee.glb", "minigame type", { x: 461, y: -130, z: 999.5 }, () => {
            this._coffeeList.push(coffee1);
        });

        // 비타방향
        var coffee2 = new Coffee(loader, "../../assets/models/coffee.glb", "minigame type", { x: 595, y: -74, z: 760 }, () => {
            this._coffeeList.push(coffee2);
        });

        // 예체대 방향
        var coffee3 = new Coffee(loader, "../../assets/models/coffee.glb", "minigame type", { x: 203, y: -119, z: 884 }, () => {
            this._coffeeList.push(coffee3);
        });

        //오르막길
        var coffee4 = new Coffee(loader, "../../assets/models/coffee.glb", "minigame type", { x: 175, y: -75, z: 651 }, () => {
            this._coffeeList.push(coffee4);
        });

        //중도
        var coffee5 = new Coffee(loader, "../../assets/models/coffee.glb", "minigame type", { x: -275, y: 79, z: -191 }, () => {
            this._coffeeList.push(coffee5);
        });


        // =========== Map ===========
        this._mapLoaded = false;
        loader.load("../../assets/models/map.glb", (gltf) => {
            console.log("map loaded");
            const model = gltf.scene;
            model.scale.set(10, 10, 10);
            model.position.set(0, 0, 0);

            this._scene.add(model);

            model.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this._mapLoaded = true;
        });

        this._CrashBoxLoaded = false;
        loader.load("../../assets/models/CrashBox.glb", (gltf) => {
            console.log("CrashBox loaded");
            const model = gltf.scene;
            model.scale.set(10, 10, 10);
            model.position.set(0, 0, 0);

            // this._scene.add(model);

            // model.traverse(child => {
            //     if (child instanceof THREE.Mesh) {
            //         child.castShadow = true;
            //         child.receiveShadow = true;
            //     }
            // });

            this._setupOctree(model, () => {
                this._CrashBoxLoaded = true;
                console.log("octree complete");
            });
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

        camera.position.set(0, 50, 100);
        this._camera = camera;
    }

    // =========== Light ===========
    _setupLight() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 4);
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

    // ========= For save game ========
    // 저장은 각 오브젝트의 toJson()을 호출하여 json으로 변환한 후
    // 알아서 저장해 ㅋㅋ
    // ================================

    // ========= For load game =========

    // jsonObject를 받아서 커피 오브젝트를 생성하고 coffeeList에 추가한다.
    // 반환된 coffee 오브젝트는 혹시 몰라서 리턴한거임 안써도 됨
    coffeeFromJson(jsonObject) {
        var loader = new GLTFLoader();
        var coffee = new Coffee(loader, "../../assets/models/coffee.glb", jsonObject.minigame, { x: jsonObject.x, y: jsonObject.y, z: jsonObject.z }, () => {
            this._coffeeList.push(coffee);
        });

        return coffee;
    }

    // jsonObject를 받아서 캐릭터 오브젝트를 생성하고 리턴한다.
    characterFromJson(jsonObject) {
        var loader = new GLTFLoader();
        var character = new Character(loader, "../../assets/models/gachon.glb", { x: jsonObject.x, y: jsonObject.y, z: jsonObject.z });
        character.hp = jsonObject.hp;

        return character;
    }

    // =================================

    // =========== Realtime update ===========
    update(time) {
        time *= 0.001; // second unit

        this._controls.update();

        this._fps.update();

        const deltaTime = time - this._previousTime;

        this._previousTime = time;

        // Ready to all components are loaded
        if (this._mapLoaded == false || this._CrashBoxLoaded == false) {
            console.log(this._mapLoaded);
            console.log(this._CrashBoxLoaded);
            return;
        }

        if (this._character._isAddedToScene == false) {
            this._scene = this._character.setupScene(this._scene);
        }

        for (var i = 0; i < this._coffeeList.length; i++) {
            if (this._coffeeList[i]._isAddedToScene == false) {
                this._scene = this._coffeeList[i].setupScene(this._scene);
            }
        }

        for (var i = 0; i < this._goalList.length; i++) {
            if (this._goalList[i]._isAddedToScene == false) {
                this._scene = this._goalList[i].setupScene(this._scene);
            }
        }

        if (this._character._isAddedToScene == true) {
            this._character.collisionWithOctree(this._worldOctree);
            this._character.collisionWithCoffee(this._coffeeList);
            this._character.collisionWithGoal(this._goalList);
            this._character.update(deltaTime, this._camera);
            this._camera = this._character.fixCameraToModel(this._camera);
            this._controls = this._character.fixControlToModel(this._controls);
        }
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