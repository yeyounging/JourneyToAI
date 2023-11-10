import * as THREE from 'three'
import { GLTFLoader } from 'GLTFLoader'
import { Octree } from "Octree"
import { Capsule } from "Capsule"

// Character class
// 
class Character {
    constructor(loader, modelUrl, { x = 0, y = 0, z = 0 }) {
        loader.load(modelUrl, (gltf) => {
            this._model = gltf.scene;
            this._model.children[0].position.set(0, 0, 0);
            this._model.children[0].lookAt(0, 0, -1);

            var hp = 100;
            this.hp = hp;

            console.log(this._model)

            this._model.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                }
            });

            // ==   For animation   ==
            const animationClips = gltf.animations; // THREE.AnimationClip[]
            const mixer = new THREE.AnimationMixer(this._model);
            const animationsMap = {};
            animationClips.forEach(clip => {
                const name = clip.name;
                console.log(name);
                animationsMap[name] = mixer.clipAction(clip); // THREE.AnimationAction
            });

            // For animation
            this._mixer = mixer;
            this._animationMap = animationsMap;
            this._currentAnimationAction = this._animationMap["stopped"];
            this._currentAnimationAction.play();
            // ====

            const box = (new THREE.Box3).setFromObject(this._model);
            this._model.position.y = (box.min.y - box.max.y) / 2;
            console.log(box);

            const height = box.max.y - box.min.y;
            this._boxHeight = height;
            const diameter = (box.max.z - box.min.z);
            this._diameter = diameter;
            console.log(diameter)

            // For Collision
            this._model._capsule = new Capsule(
                new THREE.Vector3(x, y + diameter / 2, z),
                new THREE.Vector3(x, y + height - diameter / 2, z),
                diameter / 2
            );

            const boxHelper = new THREE.BoxHelper(this._model);
            this._boxHelper = boxHelper;

            // For movement
            this._speed = 0;
            this._maxSpeed = 0;
            this._acceleration = 0;
            this._bOnTheGround = false;
            this._fallingAcceleration = 0;
            this._fallingSpeed = 0;
            this._previousDirectionOffset = 0;

            this._walkDirection = new THREE.Vector3(1, 0, 0);
            this._isAddedToScene = false;

            this._setupControls();
        });
    }

    setupScene(scene) {
        scene.add(this._model);
        // scene.add(this._boxHelper);

        this._isAddedToScene = true;

        return scene;
    }

    // User key input correspondence
    _setupControls() {
        this._pressedKeys = {};

        document.addEventListener("keydown", (event) => {
            this._pressedKeys[event.key.toLowerCase()] = true;
            this._processAnimation();
        });

        document.addEventListener("keyup", (event) => {
            this._pressedKeys[event.key.toLowerCase()] = false;
            this._processAnimation();
        });
    }

    // User key input correspondence (Move direction)
    _directionOffset() {
        const pressedKeys = this._pressedKeys;
        let directionOffset = 0 // w

        if (pressedKeys['w']) {
            if (pressedKeys['a']) {
                directionOffset = Math.PI / 4 // w+a (45도)
            } else if (pressedKeys['d']) {
                directionOffset = - Math.PI / 4 // w+d (-45도)
            }
        } else if (pressedKeys['s']) {
            if (pressedKeys['a']) {
                directionOffset = Math.PI / 4 + Math.PI / 2 // s+a (135도)
            } else if (pressedKeys['d']) {
                directionOffset = -Math.PI / 4 - Math.PI / 2 // s+d (-135도)
            } else {
                directionOffset = Math.PI // s (180도)
            }
        } else if (pressedKeys['a']) {
            directionOffset = Math.PI / 2 // a (90도)
        } else if (pressedKeys['d']) {
            directionOffset = - Math.PI / 2 // d (-90도)
        } else {
            directionOffset = this._previousDirectionOffset;
        }

        this._previousDirectionOffset = directionOffset;

        return directionOffset;
    }

    // User key input correspondence (Animation)
    _processAnimation() {
        const previousAnimationAction = this._currentAnimationAction;

        if (this._pressedKeys["w"] || this._pressedKeys["a"] || this._pressedKeys["s"] || this._pressedKeys["d"]) {
            if (this._pressedKeys["shift"]) {
                this._currentAnimationAction = this._animationMap["walk"];
                this._maxSpeed = 150;
                this._acceleration = 3;
            } else {
                this._currentAnimationAction = this._animationMap["walk"];
                this._maxSpeed = 80;
                this._acceleration = 3;
            }
        } else {
            this._currentAnimationAction = this._animationMap["stopped"];
            this._speed = 0;
            this._maxSpeed = 0;
            this._acceleration = 0;
        }

        if (previousAnimationAction !== this._currentAnimationAction) {
            previousAnimationAction.fadeOut(0.5);
            this._currentAnimationAction.reset().fadeIn(0.5).play();
        }
    }

    //==== For world components interactive =====
    // 이전 캐릭터 위치 - 카메라 위치 = 오차벡터
    // 현재 캐릭터 위치 + 오차 벡터 = 새로운 카메라 위치
    fixCameraToModel(camera) {
        var offset = new THREE.Vector3();
        offset.subVectors(camera.position, this._previousPosition);
        var newPosition = new THREE.Vector3();
        newPosition.addVectors(this._model.position, offset);

        camera.position.x = newPosition.x;
        camera.position.z = newPosition.z;
        camera.position.y = newPosition.y;

        return camera;
    }

    fixControlToModel(controls) {
        controls.target.set(
            this._model.position.x,
            this._model.position.y,
            this._model.position.z,
        );

        return controls;
    }

    collisionWithOctree(octree) {
        const result = octree.capsuleIntersect(this._model._capsule);
        if (result) { // 충돌한 경우
            this._model._capsule.translate(result.normal.multiplyScalar(result.depth));
            this._bOnTheGround = true;
        } else { // 충돌하지 않은 경우
            this._bOnTheGround = false;
        }
    }

    collisionWithCoffee(coffeeList) {
        for (let i = 0; i < coffeeList.length; i++) {
            if (this._model._capsule.intersectsBox(coffeeList[i]._collisionBox)) {
                console.log("Collision with coffee");
            }
        }
    }

    collisionWithGoal(goalList) {
        for (let i = 0; i < goalList.length; i++) {
            if (this._model._capsule.intersectsBox(goalList[i]._collisionBox)) {
                console.log("Collision with goal!");
            }
        }
    }

    setPosition(x, y, z) {
        this._model._capsule = new Capsule(
            new THREE.Vector3(x, y + this._diameter / 2, z),
            new THREE.Vector3(x, y + this._height - this._diameter / 2, z),
            this._diameter / 2
        );
    }

    toJson() {
        var jsonObject = {
            "x": this._model.position.x,
            "y": this._model.position.y,
            "z": this._model.position.z,
            "hp": this.hp
        };

        return jsonObject;
    }


    // Update
    update(deltaTime, camera) {
        if (this._boxHelper) {
            this._boxHelper.update();
        }
        // console.log(this._model.position)
        // =========== 여기에 특정 시간마다 hp를 깎는 코드를 넣으면 됩니다.


        //=====================================



        if (this._mixer) {
            this._mixer.update(deltaTime);

            const angleCameraDirectionAxisY = Math.atan2(
                (camera.position.x - this._model.position.x),
                (camera.position.z - this._model.position.z)
            );

            const rotateQuarternion = new THREE.Quaternion();
            rotateQuarternion.setFromAxisAngle(
                new THREE.Vector3(0, 1, 0),
                angleCameraDirectionAxisY + this._directionOffset()
            );

            this._model.quaternion.rotateTowards(rotateQuarternion, THREE.MathUtils.degToRad(5));

            //walkDirection.y = 0;
            this._walkDirection = new THREE.Vector3();
            camera.getWorldDirection(this._walkDirection);
            this._walkDirection.y = this._bOnTheGround ? 0 : -1;
            this._walkDirection.normalize();

            this._walkDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this._directionOffset());

            if (this._speed < this._maxSpeed) this._speed += this._acceleration;
            else this._speed -= this._acceleration * 2;

            if (!this._bOnTheGround) {
                this._fallingAcceleration += 1;
                this._fallingSpeed += Math.pow(this._fallingAcceleration, 2);
            } else {
                this._fallingAcceleration = 0;
                this._fallingSpeed = 0;
            }

            const velocity = new THREE.Vector3(
                this._walkDirection.x * this._speed * (this.hp / 100),
                this._walkDirection.y * this._fallingSpeed,
                this._walkDirection.z * this._speed * (this.hp / 100)
            );

            const deltaPosition = velocity.clone().multiplyScalar(deltaTime);

            this._model._capsule.translate(deltaPosition);

            this._previousPosition = this._model.position.clone();
            const capsuleHeight = this._model._capsule.end.y - this._model._capsule.start.y
                + this._model._capsule.radius * 2;
            this._model.position.set(
                this._model._capsule.start.x,
                this._model._capsule.start.y - (this._model._capsule.radius) + capsuleHeight / 2 - 3,
                this._model._capsule.start.z
            );
        }

    }


}

export { Character };