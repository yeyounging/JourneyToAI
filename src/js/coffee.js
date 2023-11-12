import * as THREE from 'three';
import { GLTFLoader } from 'GLTFLoader';
import { Capsule } from 'Capsule';

class Coffee {
    constructor(loader, modelUrl, minigame, { x = 0, y = 0, z = 0 }, callback) {
        loader.load(modelUrl, (gltf) => {
            this._model = gltf.scene;
            this._model.children[0].position.set(0, 0, 0);
            this._model.position.set(x, y, z);

            this._minigame = minigame;

            this._model.scale.set(50, 50, 50);

            this._model.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                }
            });

            const box = new THREE.Box3().setFromObject(this._model);

            // For Collision
            this._collisionBox = box;

            this._isAddedToScene = false;

            callback();
        });
    }

    setupScene(scene) {
        scene.add(this._model);

        this._isAddedToScene = true;

        return scene;
    }

    setPosition(x, y, z) {
        this._model.position.set(x, y, z);
        const diameter = (this._collisionBox.max.z - this._collisionBox.min.z);
        const height = this._collisionBox.max.y - this._collisionBox.min.y;
        this._model._capsule = new Capsule(
            new THREE.Vector3(x, y + diameter / 2, z),
            new THREE.Vector3(x, y + height - diameter / 2, z),
            diameter / 2
        );
    }

    update() {
        this._collisionBox.update();
    }

    // Convert object information to JSON for game save and load
    // Parse as a JSON object, so use JSON.stringify to use it as a string
    toJson() {
        const jsonObject = {
            x: this._model.position.x,
            y: this._model.position.y,
            z: this._model.position.z,
            minigame: this._minigame,
        };

        return jsonObject;
    }
}

export { Coffee };
