import * as THREE from 'three';
import { GLTFLoader } from 'GLTFLoader';
import { Octree } from 'Octree';
import { Capsule } from 'Capsule';

class GoalPoint {
    constructor(loader, modelUrl, { x = 0, y = 0, z = 0 }, callback) {
        // Load the goal point model
        loader.load(modelUrl, (gltf) => {
            this._model = gltf.scene;
            this._model.children[0].position.set(0, 0, 0);
            this._model.position.set(x, y, z);
            this._model.scale.set(10, 10, 10);

            // Set up shadow casting for meshes in the model
            this._model.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                }
            });

            // Set up collision box using Box3
            const box = new THREE.Box3().setFromObject(this._model);
            this._collisionBox = box;

            this._isAddedToScene = false;

            // Callback to signal that the model is loaded
            callback();
        });
    }

    // Add the goal point to the scene
    setupScene(scene) {
        scene.add(this._model);
        this._isAddedToScene = true;
        return scene;
    }

    // Set the position of the goal point
    setPosition(x, y, z) {
        this._model.position.set(x, y, z);

        // Create a capsule for collision detection
        this._model._capsule = new Capsule(
            new THREE.Vector3(x, y + diameter / 2, z),
            new THREE.Vector3(x, y + height - diameter / 2, z),
            diameter / 2
        );
    }

    // Update the collision box
    update() {
        this._collisionBox.update();
    }
}

export { GoalPoint };
