import * as THREE from 'three'
import { GLTFLoader } from 'GLTFLoader'
import { Octree } from "Octree"
import { Capsule } from "Capsule"

class GoalPoint {
    constructor(loader, modelUrl, { x = 0, y = 0, z = 0 }, callback) {
        loader.load(modelUrl, (gltf) => {
            this._model = gltf.scene;
            this._model.children[0].position.set(0, 0, 0);
            this._model.position.set(x, y, z);

            this._model.scale.set(10, 10, 10);

            this._model.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                }
            });

            const box = (new THREE.Box3).setFromObject(this._model);

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
        this._model._capsule = new Capsule(
            new THREE.Vector3(x, y + diameter / 2, z),
            new THREE.Vector3(x, y + height - diameter / 2, z),
            diameter / 2
        );
    }


    update() {
        this._collisionBox.update();
    }
}

export { GoalPoint }