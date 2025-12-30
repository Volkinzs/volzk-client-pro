// Three.js Skin Preview Renderer
const THREE = require('three');
const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');
const path = require('path');

class SkinPreview {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.model = null;
        this.mixer = null;
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.rotation = { x: 0, y: 0 };

        this.init();
    }

    init() {
        const width = this.container.clientWidth || 150;
        const height = this.container.clientHeight || 200;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // Camera
        this.camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
        this.camera.position.set(0, 1, 3);
        this.camera.lookAt(0, 0.5, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(2, 3, 2);
        this.scene.add(directionalLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
        backLight.position.set(-2, 1, -2);
        this.scene.add(backLight);

        // Load model
        this.loadModel();

        // Mouse controls
        this.setupControls();

        // Animation loop
        this.animate();
    }

    loadModel(texturePath = null) {
        const loader = new GLTFLoader();
        const modelPath = path.join(__dirname, '../assets/models/Characters.glb');

        loader.load(
            modelPath,
            (gltf) => {
                if (this.model) {
                    this.scene.remove(this.model);
                }

                this.model = gltf.scene;
                this.model.scale.set(0.8, 0.8, 0.8);
                this.model.position.set(0, -0.5, 0);

                // Apply texture if provided
                if (texturePath) {
                    this.applyTexture(texturePath);
                }

                this.scene.add(this.model);
            },
            undefined,
            (error) => {
                console.error('Error loading model:', error);
            }
        );
    }

    applyTexture(texturePath) {
        if (!this.model) return;

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(texturePath, (texture) => {
            texture.encoding = THREE.sRGBEncoding;
            texture.flipY = false;
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;

            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({
                        map: texture,
                        roughness: 0.8,
                        metalness: 0.1
                    });
                }
            });
        });
    }

    setColor(color) {
        if (!this.model) return;

        this.model.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(color),
                    roughness: 0.8,
                    metalness: 0.1
                });
            }
        });
    }

    setupControls() {
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.model) return;

            const deltaX = e.clientX - this.previousMousePosition.x;
            const deltaY = e.clientY - this.previousMousePosition.y;

            this.rotation.y += deltaX * 0.01;
            this.rotation.x += deltaY * 0.01;
            this.rotation.x = Math.max(-0.5, Math.min(0.5, this.rotation.x));

            this.model.rotation.y = this.rotation.y;
            this.model.rotation.x = this.rotation.x;

            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

module.exports = { SkinPreview };
