import * as THREE from 'three'
import { GLTFLoader } from 'GLTFLoader'
import { Octree } from "Octree"
import { Capsule } from "Capsule"

import { running } from './main_UI.js'

// Character class
// 
class Character {
    // Character class constructor
    constructor(loader, modelUrl, { x = 0, y = 0, z = 0 }) {
        // Default HP set to 100
        var hp = 100;
        this.hp = hp;

        // Loading the 3D model
        loader.load(modelUrl, (gltf) => {
            // Accessing the model from the loaded GLTF scene
            this._model = gltf.scene;

            // Positioning and orienting the model
            this._model.children[0].position.set(0, 0, 0);
            this._model.children[0].lookAt(0, 0, -1);

            // Setting up shadow casting for meshes in the model
            this._model.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                }
            });

            // Animation setup
            const animationClips = gltf.animations; // Array of animation clips
            const mixer = new THREE.AnimationMixer(this._model);
            const animationsMap = {};

            // Creating a map of animation clips for easy access
            animationClips.forEach(clip => {
                const name = clip.name;
                animationsMap[name] = mixer.clipAction(clip);
            });

            // Assigning animation-related properties to the character
            this._mixer = mixer;
            this._animationMap = animationsMap;
            this._currentAnimationAction = this._animationMap["stopped"];
            this._currentAnimationAction.play();

            // Retrieving dimensions of the model's bounding box
            const box = new THREE.Box3().setFromObject(this._model);
            this._model.position.y = (box.min.y - box.max.y) / 2;
            const height = box.max.y - box.min.y;
            const diameter = box.max.z - box.min.z;

            // Storing dimensions for collision detection
            this._boxHeight = height;
            this._diameter = diameter;

            // Creating a capsule for collision detection
            this._model._capsule = new Capsule(
                new THREE.Vector3(x, y + diameter / 2, z),
                new THREE.Vector3(x, y + height - diameter / 2, z),
                diameter / 2
            );

            // Creating a box helper for visualization (optional)
            const boxHelper = new THREE.BoxHelper(this._model);
            this._boxHelper = boxHelper;

            // Movement and control properties
            this._speed = 0;
            this._maxSpeed = 0;
            this._acceleration = 0;
            this._bOnTheGround = false;
            this._fallingAcceleration = 0;
            this._fallingSpeed = 0;
            this._previousDirectionOffset = 0;
            this._elapsedTime = 0;
            this._walkDirection = new THREE.Vector3(1, 0, 0);
            this._isAddedToScene = false;

            // Setting up keyboard controls
            this._setupControls();
        });
    }

    // Method to add the character model to the scene
    setupScene(scene) {
        scene.add(this._model);
        // Uncomment the line below if you want to add a box helper for visualization
        // scene.add(this._boxHelper);

        this._isAddedToScene = true;

        return scene;
    }

    // Method to set up keyboard controls for the character
    _setupControls() {
        this._pressedKeys = {};

        // Event listener for keydown to track pressed keys
        document.addEventListener("keydown", (event) => {
            this._pressedKeys[event.key.toLowerCase()] = true;
            this._processAnimation(); // Trigger animation based on key input
        });

        // Event listener for keyup to track released keys
        document.addEventListener("keyup", (event) => {
            this._pressedKeys[event.key.toLowerCase()] = false;
            this._processAnimation(); // Trigger animation based on key input
        });
    }


    // Method to calculate the offset for the character's movement direction based on pressed keys
    _directionOffset() {
        const pressedKeys = this._pressedKeys;
        let directionOffset = 0; // Default: forward (w key)

        if (pressedKeys['w']) {
            if (pressedKeys['a']) {
                directionOffset = Math.PI / 4; // Forward-left (45 degrees)
            } else if (pressedKeys['d']) {
                directionOffset = -Math.PI / 4; // Forward-right (-45 degrees)
            }
        } else if (pressedKeys['s']) {
            if (pressedKeys['a']) {
                directionOffset = Math.PI / 4 + Math.PI / 2; // Backward-left (135 degrees)
            } else if (pressedKeys['d']) {
                directionOffset = -Math.PI / 4 - Math.PI / 2; // Backward-right (-135 degrees)
            } else {
                directionOffset = Math.PI; // Backward (180 degrees)
            }
        } else if (pressedKeys['a']) {
            directionOffset = Math.PI / 2; // Left (90 degrees)
        } else if (pressedKeys['d']) {
            directionOffset = -Math.PI / 2; // Right (-90 degrees)
        } else {
            directionOffset = this._previousDirectionOffset; // Maintain previous direction if no key is pressed
        }

        this._previousDirectionOffset = directionOffset;

        return directionOffset;
    }

    // Method to handle character animations based on user key input
    _processAnimation() {
        const previousAnimationAction = this._currentAnimationAction;

        // Determine animation based on pressed keys
        if (this._pressedKeys["w"] || this._pressedKeys["a"] || this._pressedKeys["s"] || this._pressedKeys["d"]) {
            if (this._pressedKeys["shift"]) {
                // Run animation
                this._currentAnimationAction = this._animationMap["walk"];
                this._maxSpeed = 150;
                this._acceleration = 3;
            } else {
                // Walk animation
                this._currentAnimationAction = this._animationMap["walk"];
                this._maxSpeed = 80;
                this._acceleration = 3;
            }
        } else {
            // Stopped animation when no movement keys are pressed
            this._currentAnimationAction = this._animationMap["stopped"];
            this._speed = 0;
            this._maxSpeed = 0;
            this._acceleration = 0;
        }

        // Transition between previous and current animations
        if (previousAnimationAction !== this._currentAnimationAction) {
            previousAnimationAction.fadeOut(0.5);
            this._currentAnimationAction.reset().fadeIn(0.5).play();
        }
    }


    // Method to update camera position based on the character's movement
    fixCameraToModel(camera) {
        // Calculate offset vector between previous camera position and current character position
        const offset = new THREE.Vector3();
        offset.subVectors(camera.position, this._previousPosition);

        // Calculate new camera position based on current character position and offset vector
        const newPosition = new THREE.Vector3();
        newPosition.addVectors(this._model.position, offset);

        // Update camera position
        camera.position.x = newPosition.x;
        camera.position.z = newPosition.z;
        camera.position.y = newPosition.y;

        return camera;
    }

    // Method to update controls target based on the character's position
    fixControlToModel(controls) {
        controls.target.set(
            this._model.position.x,
            this._model.position.y,
            this._model.position.z,
        );

        return controls;
    }

    // Method to check collision with the octree (world components)
    collisionWithOctree(octree) {
        const result = octree.capsuleIntersect(this._model._capsule);

        if (result) { // Collision occurred
            // Translate the capsule to resolve the collision
            this._model._capsule.translate(result.normal.multiplyScalar(result.depth));
            this._bOnTheGround = true;
        } else { // No collision
            this._bOnTheGround = false;
        }
    }

    // Method to check collision with coffee objects
    collisionWithCoffee(coffeeList) {
        var collisionIndex = -1;

        for (let i = 0; i < coffeeList.length; i++) {
            if (this._model._capsule.intersectsBox(coffeeList[i]._collisionBox)) {
                console.log("Collision with coffee");
                collisionIndex = i;
            }
        }

        return collisionIndex;
    }

    // Method to check collision with goal objects
    collisionWithGoal(goalList) {
        var isCollision = -1;

        for (let i = 0; i < goalList.length; i++) {
            if (this._model._capsule.intersectsBox(goalList[i]._collisionBox)) {
                console.log("Collision with goal!");
                isCollision = i;
            }
        }

        return isCollision;
    }

    // Method to set the position of the character
    setPosition(x, y, z) {
        this._model._capsule = new Capsule(
            new THREE.Vector3(x, y + this._diameter / 2, z),
            new THREE.Vector3(x, y + this._boxHeight - this._diameter / 2, z),
            this._diameter / 2
        );
    }

    // Method to convert character information to a JSON object
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
    // Method to update the character's state
    update(deltaTime, camera) {
        if (this._boxHelper) {
            this._boxHelper.update();
        }

        // Check if the character is running
        if (running) {
            this._elapsedTime += deltaTime;
            if (this._elapsedTime > 0.5) {
                if (this.hp <= 0) {
                    this.hp = 0;
                } else {
                    this.hp -= 1;
                    this._elapsedTime = 0;
                }
                console.log(this.hp);
            }
        }

        // Update the character's animation mixer
        if (this._mixer) {
            this._mixer.update(deltaTime);

            // Calculate the rotation quaternion based on the camera direction
            const angleCameraDirectionAxisY = Math.atan2(
                (camera.position.x - this._model.position.x),
                (camera.position.z - this._model.position.z)
            );

            const rotateQuaternion = new THREE.Quaternion();
            rotateQuaternion.setFromAxisAngle(
                new THREE.Vector3(0, 1, 0),
                angleCameraDirectionAxisY + this._directionOffset()
            );

            // Rotate the character towards the camera direction
            this._model.quaternion.rotateTowards(rotateQuaternion, THREE.MathUtils.degToRad(5));

            // Set the walking direction based on the camera direction and key input
            this._walkDirection = new THREE.Vector3();
            camera.getWorldDirection(this._walkDirection);
            this._walkDirection.y = this._bOnTheGround ? 0 : -1;
            this._walkDirection.normalize();
            this._walkDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this._directionOffset());

            // Update the character's speed and falling motion
            if (this._speed < this._maxSpeed) {
                this._speed += this._acceleration;
            } else {
                this._speed -= this._acceleration * 2;
            }

            if (!this._bOnTheGround) {
                this._fallingAcceleration += 1;
                this._fallingSpeed += this._fallingAcceleration;
            } else {
                this._fallingAcceleration = 0;
                this._fallingSpeed = 0;
            }

            // Calculate velocity based on speed and direction
            var velocity = new THREE.Vector3(0, this._walkDirection.y * this._fallingSpeed, 0);
            if (running) {
                velocity = new THREE.Vector3(
                    this._walkDirection.x * this._speed * (this.hp / 100),
                    this._walkDirection.y * this._fallingSpeed,
                    this._walkDirection.z * this._speed * (this.hp / 100)
                );
            }

            // Translate the character based on velocity
            const deltaPosition = velocity.clone().multiplyScalar(deltaTime);
            this._model._capsule.translate(deltaPosition);

            // Update the character's position and orientation
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