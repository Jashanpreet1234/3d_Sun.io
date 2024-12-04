// Import necessary modules
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 40; // Move camera back to ensure everything is in view

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set nebula background or a solid color for a space-like background
const loader = new THREE.TextureLoader();
loader.load('nebula.jpg', (texture) => {
    scene.background = texture;
});

// Add lights for general illumination
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// Load the Sun model (sun.glb) with a GLTFLoader
const gltfLoader = new GLTFLoader();
let sun;
gltfLoader.load('sun.glb', (gltf) => {
    sun = gltf.scene;
    sun.scale.set(0.2, 0.2, 0.2); // Adjust the scale to make it an appropriate size
    sun.position.set(0, 0, 0); // Center the sun model in the scene
    scene.add(sun);

    // Apply emissive material to make it look like it's glowing
    sun.traverse((child) => {
        if (child.isMesh) {
            child.material.emissive = new THREE.Color(0xffaa00); // Give it a warm, bright glow
            child.material.emissiveIntensity = 1.5; // Adjust intensity for more glow
        }
    });

    // Lens Flare Effect for the Sun
    const sunLight = new THREE.PointLight(0xffffff, 1.5, 200);
    sunLight.position.copy(sun.position); // Position light at the sun's location
    scene.add(sunLight);

}, undefined, (error) => {
    console.error('Error loading the sun model:', error);
});

// Load the Rocket model with a GLTFLoader
let rocket;
let thrusterLight, flameSprite;
gltfLoader.load('Rocket.glb', (gltf) => {
    rocket = gltf.scene;
    rocket.scale.set(0.25, 0.25, 0.25); // Increase the rocket size slightly
    scene.add(rocket);

    // Add thruster light for pulsing effect
    thrusterLight = new THREE.PointLight(0xffa500, 2, 5);
    thrusterLight.position.set(0, -1, -2);
    rocket.add(thrusterLight);

    // Add flame sprite using a flame texture
    const flameTexture = loader.load('flame.png'); // Replace with your flame texture file
    const flameMaterial = new THREE.SpriteMaterial({
        map: flameTexture,
        color: 0xff5500, // Adjust color to make it appear like fire
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8,
    });
    flameSprite = new THREE.Sprite(flameMaterial);
    flameSprite.scale.set(0.5, 1, 1); // Adjust scale for flame size
    flameSprite.position.set(0, -1.2, -1.5); // Position it at the back of the rocket
    rocket.add(flameSprite);
}, undefined, (error) => {
    console.error('Error loading the rocket model:', error);
});

// Add stars in the background with flickering effect
function addStars() {
    const starGeometry = new THREE.SphereGeometry(0.05, 24, 24);
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 200; i++) {
        const star = new THREE.Mesh(starGeometry, starMaterial);
        const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(200));
        star.position.set(x, y, z);
        star.userData.pulseSpeed = Math.random() * 0.02 + 0.01; // Random pulse speed for each star
        scene.add(star);
    }
}
addStars(); // Call the function to add stars to the scene

// Add dust particles to enhance the space environment
function addDustParticles() {
    const dustGeometry = new THREE.BufferGeometry();
    const dustCount = 1000;
    const dustPositions = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
        dustPositions[i * 3] = THREE.MathUtils.randFloatSpread(200);
        dustPositions[i * 3 + 1] = THREE.MathUtils.randFloatSpread(200);
        dustPositions[i * 3 + 2] = THREE.MathUtils.randFloatSpread(200);
    }

    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

    const dustMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.2,
        transparent: true,
        opacity: 0.5
    });

    const dustParticles = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustParticles);
}
addDustParticles();

// Add OrbitControls for interactive camera manipulation
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Orbit animation for the rocket and sun rotation
const orbitRadius = 15;
function animate() {
    requestAnimationFrame(animate);

    // Rotate the sun slowly around its own axis
    if (sun) {
        sun.rotation.y += 0.001;
    }

    if (rocket) {
        const angle = Date.now() * 0.0005; // Slow down the speed of the rocket
        rocket.position.x = orbitRadius * Math.cos(angle);
        rocket.position.y = orbitRadius * Math.sin(angle);
        rocket.rotation.y += 0.01;

        // Thruster light pulsing effect
        thrusterLight.intensity = 1 + Math.sin(Date.now() * 0.01);

        // Flickering effect for the flame sprite
        if (flameSprite) {
            const scale = 0.4 + Math.random() * 0.2; // Random scale for flickering effect
            flameSprite.scale.set(scale, scale * 2, 1); // Scale flame height independently
            flameSprite.material.opacity = 0.7 + Math.random() * 0.3; // Flickering opacity
        }
    }

    // Twinkle effect for stars
    scene.traverse((object) => {
        if (object.isMesh && object.geometry.type === "SphereGeometry" && object.material.color.getHex() === 0xffffff) {
            const scale = 1 + Math.sin(Date.now() * object.userData.pulseSpeed) * 0.3;
            object.scale.set(scale, scale, scale);
        }
    });

    controls.update();
    renderer.render(scene, camera);
}
animate();

// Adjust renderer size on window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
