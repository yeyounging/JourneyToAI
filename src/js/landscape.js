import * as THREE from 'three'
import { OrbitControls } from 'OrbitControls'
import { GLTFLoader } from 'GLTFLoader'

class App {
    // 생성자
    constructor() {
        const divContainer = document.querySelector("#webgl-container");
        this._divContainer = divContainer;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        divContainer.appendChild(renderer.domElement);
        this._renderer = renderer;

        const scene = new THREE.Scene();
        this._scene = scene;

        this._setupCamera();
        this._setupLight();
        this._setupModel();
        this._setupControls();

        window.onresize = this.resize.bind(this);
        this.resize();

        requestAnimationFrame(this.render.bind(this));
    }

    _setupControls() {
        this._contols = new OrbitControls(this._camera, this._divContainer);
    }

    // =========== Camera ===========
    // Scene의 카메라 설정
    _setupCamera() {
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;
        const camera = new THREE.PerspectiveCamera(60, width / height, 1, 5000);
        camera.position.set(0, 100, 500);
        this._camera = camera;
    }

    // =========== Light ===========
    // Scene의 빛 설정
    _setupLight() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this._scene.add(ambientLight);

        this._addPointLight(500, 150, 500, 0xffffff);
        this._addPointLight(-500, 150, 500, 0xffffff);
        this._addPointLight(-500, 150, -500, 0xffffff);
        this._addPointLight(500, 150, -500, 0xffffff);

        const shadowLight = new THREE.DirectionalLight(0xffffff, 0.2);
        shadowLight.position.set(200, 500, 200);
        shadowLight.target.position.set(0, 0, 0);
        const directionalLightHelper = new THREE.DirectionalLightHelper(shadowLight, 10);
        this._scene.add(directionalLightHelper);

        this._scene.add(shadowLight);
        this._scene.add(shadowLight.target);
    }

    // Scene에 PointLight 추가
    _addPointLight(x, y, z, color, helperColor = 0xffffff, intensity = 1.5, distance = 2000) {
        const pointLight = new THREE.PointLight(color, 1.5, 2000);
        pointLight.position.set(x, y, z);

        this._scene.add(pointLight);

        const pointLightHelper = new THREE.PointLightHelper(pointLight, 10, helperColor);
        this._scene.add(pointLightHelper);
    }


    // =========== Model ===========
    // Scene에 모델 추가
    _setupModel() {
        const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
        const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x878787 });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        this._scene.add(plane);

        new GLTFLoader().load("../../assets/models/character.glb", (gltf) => {
            const model = gltf.scene;
            this._scene.add(model);
        });
    }

    // =========== For Updates ===========

    // 화면 크기 재조정
    resize() {
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;
        this._renderer.setSize(width, height);
        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();
    }

    // 렌더
    // time : 페이지가 생성되고 경과된 시간
    render(time) {
        this._renderer.render(this._scene, this._camera);
        this.update(time);
        requestAnimationFrame(this.render.bind(this));
    }

    // 실시간 갱신되는 정보나, 애니메이션 적용하는데 사용
    update(time) {
        time *= 0.001; // ms -> s

        this._contols.update();
    }
}

window.onload = function () {
    new App();
}