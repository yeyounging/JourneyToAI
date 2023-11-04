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

    // Scene의 카메라 설정
    _setupCamera() {
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
        camera.position.z = 2;
        this._camera = camera;
    }

    // Scene의 빛 설정
    _setupLight() {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        this._scene.add(light);
    }

    // Scene에 모델 추가
    _setupModel() {
        new GLTFLoader().load("../../assets/models/character.glb", (gltf) => {
            const model = gltf.scene;
            this._scene.add(model);
        });
    }

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
    }
}

window.onload = function () {
    new App();
}