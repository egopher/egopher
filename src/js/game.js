/**
 * Bridge Battle Game
 */

class Game {
    constructor() {
        console.log("Game constructor called");
        
        // Game state
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        this.isMouseDown = false; // Track mouse button state
        
        // Game objects
        this.bridge = null;
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.trees = [];
        this.upgrades = [];
        this.clones = []; // Added to track player clones
        
        // Game settings
        this.enemyKills = 0; // Track enemy kills
        this.playerHealth = 100; // Initialize player health
        this.currentWeapon = 'basic'; // Default weapon
        this.gameSpeed = 1.5; // Increased overall game speed
        this.enemySpawnRate = 800; // Increased spawn rate (ms)
        this.upgradeSpawnRate = 2000; // Decreased from 5000 to 2000 ms for more frequent upgrades
        this.lastSpawnTime = 0;
        this.lastUpgradeTime = 0;
        this.playerMovementEnabled = true;
        this.maxClones = 4; // Maximum number of clones allowed
        
        // Difficulty progression
        this.gameStartTime = Date.now();
        this.currentWave = 1;
        this.waveChangeTime = 30000; // 30 seconds per wave
        this.lastWaveChangeTime = this.gameStartTime;
        this.maxWave = 10; // Cap difficulty at wave 10
        this.bossWaves = [5, 10]; // Waves that spawn boss enemies
        
        // Player movement
        this.keyStates = {
            left: false,  // A key
            right: false  // D key
        };
        this.playerSpeed = 17; // Faster player movement
        
        // Store bound event handlers for later removal
        this.boundKeyDown = null;
        this.boundKeyUp = null;
        this.boundMouseClick = null;
        this.boundMouseDown = null; // Add mousedown handler
        this.boundMouseUp = null; // Add mouseup handler
        this.boundWindowResize = null;
        
        // Weapons config
        this.weaponsConfig = {
            basic: {
                model: null,
                projectileColor: 0xffff00,
                projectileSpeed: 40,
                damage: 1,
                fireRate: 200,
                trailColor: 0xffaa00,
                glowColor: 0xffff88
            },
            laser: {
                model: null,
                projectileColor: 0x00ffff,
                projectileSpeed: 60,
                damage: 0.7,
                fireRate: 100,
                trailColor: 0x00ffaa,
                glowColor: 0x88ffff
            },
            rocket: {
                model: null,
                projectileColor: 0xff0000,
                projectileSpeed: 30,
                damage: 5,
                fireRate: 1000,
                trailColor: 0xff4400,
                glowColor: 0xff8888
            }
        };
        
        // Initialize the scene
        this.initScene();
        this.setupEventListeners();
        
        // Start game loop
        this.lastFrame = Date.now();
        this.animate();
        
        // Initial enemy spawn - more enemies at start
        for (let i = 0; i < 5; i++) {
            this.spawnEnemy();
        }
        
        // Create UI elements
        this.createKillCounter();
        this.createHealthBar(); // Add health bar
        this.createWaveIndicator(); // Add wave indicator
        
        // Clean up any external UI elements
        this.cleanupExternalUI();
        
        // Set up a periodic UI cleanup to handle elements that might be added dynamically
        setInterval(() => this.cleanupExternalUI(), 1000);
        
        console.log("Game initialization complete");
    }
    
    initScene() {
        console.log("Initializing game scene");
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.FogExp2(0xCCEEFF, 0.01);
        
        // Create camera - more top-down view for bridge game
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 14, 15); // Moved camera closer and lower
        this.camera.lookAt(0, 0, -10); // Looking at middle of the bridge
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
        
        // Add lighting
        this.addLighting();
        
        // Create bridge and upgrade lane
        this.createBridge();
        
        // Create player
        this.createPlayer();
        
        // Create snowy forest environment
        this.createEnvironment();
        
        // Create weapon models
        this.createWeaponModels();
        
        console.log("Game scene initialized");
    }
    
    addLighting() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Add directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        
        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        
        this.scene.add(directionalLight);
        
        // Add a bit of blue light from below to simulate snow reflection
        const blueLight = new THREE.HemisphereLight(0x4488bb, 0x002244, 0.5);
        this.scene.add(blueLight);
    }
    
    createBridge() {
        // Create a bridge with walls
        const bridgeWidth = 19.2; // Increased from 16 to 19.2 (20% larger)
        const bridgeLength = 60;
        
        // Bridge base (floor)
        const bridgeGeometry = new THREE.BoxGeometry(bridgeWidth, 0.5, bridgeLength);
        const bridgeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xCCCCCC,
            roughness: 0.7,
            metalness: 0.2
        });
        
        this.bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        this.bridge.position.set(0, -0.25, -20); // Center of the scene, slightly below origin
        this.bridge.receiveShadow = true;
        this.scene.add(this.bridge);
        
        // Bridge walls
        const wallHeight = 1;
        const wallGeometry = new THREE.BoxGeometry(0.5, wallHeight, bridgeLength);
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            roughness: 0.8,
            metalness: 0.3
        });
        
        // Left wall
        const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
        leftWall.position.set(-bridgeWidth/2, wallHeight/2, -20);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);
        
        // Right wall
        const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
        rightWall.position.set(bridgeWidth/2, wallHeight/2, -20);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);
    }
    
    createWeaponModels() {
        // Basic weapon model (yellow pistol)
        const basicWeapon = new THREE.Group();
        
        const basicBarrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8),
            new THREE.MeshStandardMaterial({ 
                color: 0xffdd00,
                emissive: 0xffaa00,
                emissiveIntensity: 0.5
            })
        );
        basicBarrel.rotation.x = Math.PI / 2;
        basicBarrel.position.set(0, 0, -0.2);
        basicWeapon.add(basicBarrel);
        
        const basicHandle = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.3, 0.1),
            new THREE.MeshStandardMaterial({ color: 0xdd9900 })
        );
        basicHandle.position.set(0, -0.2, 0);
        basicWeapon.add(basicHandle);
        
        this.weaponsConfig.basic.model = basicWeapon;
        
        // Laser weapon model (blue futuristic gun)
        const laserWeapon = new THREE.Group();
        
        const laserBarrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.08, 0.8, 8),
            new THREE.MeshStandardMaterial({ 
                color: 0x00ddff,
                emissive: 0x0099ff,
                emissiveIntensity: 0.7
            })
        );
        laserBarrel.rotation.x = Math.PI / 2;
        laserBarrel.position.set(0, 0, -0.3);
        laserWeapon.add(laserBarrel);
        
        const laserBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.15, 0.4),
            new THREE.MeshStandardMaterial({ 
                color: 0x0088cc,
                emissive: 0x0066aa,
                emissiveIntensity: 0.3
            })
        );
        laserBody.position.set(0, 0, 0.1);
        laserWeapon.add(laserBody);
        
        const laserHandle = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.3, 0.1),
            new THREE.MeshStandardMaterial({ color: 0x006699 })
        );
        laserHandle.position.set(0, -0.2, 0.1);
        laserWeapon.add(laserHandle);
        
        this.weaponsConfig.laser.model = laserWeapon;
        
        // Rocket launcher model (red heavy weapon)
        const rocketWeapon = new THREE.Group();
        
        const rocketBarrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 1, 8),
            new THREE.MeshStandardMaterial({ 
                color: 0xcc0000,
                emissive: 0x990000,
                emissiveIntensity: 0.3
            })
        );
        rocketBarrel.rotation.x = Math.PI / 2;
        rocketBarrel.position.set(0, 0, -0.3);
        rocketWeapon.add(rocketBarrel);
        
        const rocketSight = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.1, 0.1),
            new THREE.MeshStandardMaterial({ 
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 1
            })
        );
        rocketSight.position.set(0, 0.15, 0);
        rocketWeapon.add(rocketSight);
        
        const rocketHandle = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.3, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x660000 })
        );
        rocketHandle.position.set(0, -0.25, 0.2);
        rocketWeapon.add(rocketHandle);
        
        this.weaponsConfig.rocket.model = rocketWeapon;
    }
    
    createPlayer() {
        console.log("Creating player character");
        
        // Create a penguin character
        const playerGroup = new THREE.Group();
        
        // Body - using sphere for penguin's round body
        const bodyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        bodyGeometry.scale(1, 1.3, 0.8); // Make oval shaped like a penguin body
        
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222, // Dark black for penguin back
            roughness: 0.7,
            metalness: 0.1
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5; // Position above bridge
        body.castShadow = true;
        playerGroup.add(body);
        
        // White belly (front part)
        const bellyGeometry = new THREE.SphereGeometry(0.48, 16, 16, 0, Math.PI, 0, Math.PI);
        const bellyMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF, // White belly
            roughness: 0.8,
            metalness: 0.1
        });
        
        const belly = new THREE.Mesh(bellyGeometry, bellyMaterial);
        belly.rotation.y = 0; // Face backward (was Math.PI to face forward)
        belly.position.set(0, 0.5, -0.05); // Moved to back (was 0.05 to be in front)
        playerGroup.add(belly);
        
        // Head (round black with white face)
        const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222, // Black like the body
            roughness: 0.7,
            metalness: 0.1
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 1.15, 0); // Position above body
        head.castShadow = true;
        playerGroup.add(head);
        
        // White face patch
        const faceGeometry = new THREE.SphereGeometry(0.32, 16, 16, 0, Math.PI, 0, Math.PI);
        const faceMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        face.rotation.y = 0; // Face backward (was Math.PI to face forward)
        face.position.set(0, 1.15, -0.05); // Moved to back (was 0.05 to be in front)
        playerGroup.add(face);
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.06, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            roughness: 0.3,
            metalness: 0.5
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.12, 1.22, -0.28); // Moved to back (was 0.28 to be in front)
        playerGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.12, 1.22, -0.28); // Moved to back (was 0.28 to be in front)
        playerGroup.add(rightEye);
        
        // Beak
        const beakGeometry = new THREE.ConeGeometry(0.07, 0.25, 8);
        const beakMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFA500, // Orange beak
            roughness: 0.5,
            metalness: 0.3,
            emissive: 0x994400,
            emissiveIntensity: 0.2
        });
        
        const beak = new THREE.Mesh(beakGeometry, beakMaterial);
        beak.rotation.x = -Math.PI / 2; // Point backward (was Math.PI / 2 to point forward)
        beak.position.set(0, 1.15, -0.35); // Moved to back (was 0.35 to be in front)
        playerGroup.add(beak);
        
        // Flippers (instead of arms)
        const flipperGeometry = new THREE.BoxGeometry(0.12, 0.5, 0.2);
        
        const flipperMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222, // Black like the body
            roughness: 0.7,
            metalness: 0.1
        });
        
        const leftFlipper = new THREE.Mesh(flipperGeometry, flipperMaterial);
        leftFlipper.position.set(-0.5, 0.5, 0);
        leftFlipper.rotation.z = -Math.PI / 8;
        leftFlipper.rotation.y = Math.PI / 6; // Reversed angle (was -Math.PI / 6)
        leftFlipper.castShadow = true;
        playerGroup.add(leftFlipper);
        
        const rightFlipper = new THREE.Mesh(flipperGeometry, flipperMaterial);
        rightFlipper.position.set(0.5, 0.5, 0);
        rightFlipper.rotation.z = Math.PI / 8;
        rightFlipper.rotation.y = -Math.PI / 6; // Reversed angle (was Math.PI / 6)
        rightFlipper.castShadow = true;
        playerGroup.add(rightFlipper);
        
        // Feet
        const footGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.3);
        const footMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFA500, // Orange feet
            roughness: 0.5,
            metalness: 0.3,
            emissive: 0x994400,
            emissiveIntensity: 0.2
        });
        
        const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
        leftFoot.position.set(-0.15, -0.4, -0.1); // Moved to back (was 0.1 to be in front)
        leftFoot.rotation.x = -Math.PI / 12; // Reversed angle (was Math.PI / 12)
        playerGroup.add(leftFoot);
        
        const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
        rightFoot.position.set(0.15, -0.4, -0.1); // Moved to back (was 0.1 to be in front)
        rightFoot.rotation.x = -Math.PI / 12; // Reversed angle (was Math.PI / 12)
        playerGroup.add(rightFoot);
        
        // Add green circle under player
        const circleGeometry = new THREE.CircleGeometry(0.8, 32);
        const circleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.9
        });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.rotation.x = -Math.PI / 2; // Make it horizontal
        circle.position.y = -0.5;
        playerGroup.add(circle);
        
        // Set player position
        playerGroup.position.set(0, 1.5, 5);
        
        this.player = playerGroup;
        this.scene.add(this.player);
        
        console.log("Penguin player character created at position:", this.player.position);
    }
    
    createEnvironment() {
        // Create snowy ground
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 1,
            metalness: 0
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add trees (simplified)
        this.addTrees();
    }
    
    addTrees() {
        // Create a group of trees for better performance
        const treeGroup = new THREE.Group();
        
        // Create a reusable tree model
        const createTree = (x, z) => {
            const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.4, 1.5, 8);
            const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = 0.75;
            trunk.castShadow = true;
            
            const topGeometry = new THREE.ConeGeometry(1.5, 3, 8);
            const topMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x005500,
                roughness: 0.8
            });
            const top = new THREE.Mesh(topGeometry, topMaterial);
            top.position.y = 3;
            top.castShadow = true;
            
            const tree = new THREE.Group();
            tree.add(trunk);
            tree.add(top);
            
            // Add snow on top
            const snowGeometry = new THREE.ConeGeometry(1.6, 0.5, 8);
            const snowMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xffffff,
                roughness: 1
            });
            const snow = new THREE.Mesh(snowGeometry, snowMaterial);
            snow.position.y = 4.5;
            snow.castShadow = true;
            tree.add(snow);
            
            tree.position.set(x, 0, z);
            return tree;
        };
        
        // Add random trees to both sides of the bridge
        for (let i = 0; i < 100; i++) {
            let x, z;
            // Place trees on either side of the bridge but not on it
            if (Math.random() > 0.5) {
                x = Math.random() * 50 + 10; // Right side
            } else {
                x = Math.random() * -50 - 10; // Left side
            }
            z = Math.random() * 100 - 70; // Along the length of the bridge
            
            const tree = createTree(x, z);
            treeGroup.add(tree);
        }
        
        this.scene.add(treeGroup);
    }
    
    spawnEnemy(isBoss = false) {
        console.log("Spawning enemy");
        
        // Create enemy group
        const enemyGroup = new THREE.Group();
        
        // Difficulty scaling factors
        const waveScaling = Math.min(this.currentWave / 2, 5); // Scale up to 5x for max difficulty
        const healthScaling = Math.min(1 + (this.currentWave - 1) * 0.3, 3); // Up to 3x health
        const speedScaling = Math.min(1 + (this.currentWave - 1) * 0.1, 1.5); // Up to 1.5x speed
        
        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(
            isBoss ? 0.8 : 0.5, 
            isBoss ? 1.5 : 1, 
            4, 8
        );
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: isBoss ? 0xff1111 : 0xe74c3c, // Brighter red for boss
            roughness: 0.7,
            metalness: 0.3,
            emissive: isBoss ? 0xcc0000 : 0x992d22,
            emissiveIntensity: isBoss ? 0.8 : 0.5 // Increased glow for boss
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        body.castShadow = true;
        enemyGroup.add(body);
        
        // Head (hat)
        const hatGeometry = new THREE.CylinderGeometry(
            isBoss ? 0.3 : 0.2, 
            isBoss ? 0.6 : 0.4, 
            isBoss ? 0.6 : 0.4, 
            8
        );
        const hatMaterial = new THREE.MeshStandardMaterial({ 
            color: isBoss ? 0xff0000 : 0xff0000,
            emissive: isBoss ? 0xff0000 : 0xaa0000,
            emissiveIntensity: isBoss ? 0.9 : 0.6
        });
        const hat = new THREE.Mesh(hatGeometry, hatMaterial);
        hat.position.set(0, isBoss ? 1.5 : 1.2, 0);
        hat.castShadow = true;
        enemyGroup.add(hat);
        
        // Add boss-specific features
        if (isBoss) {
            // Add spikes to boss
            for (let i = 0; i < 8; i++) {
                const spikeGeometry = new THREE.ConeGeometry(0.2, 0.5, 4);
                const spikeMaterial = new THREE.MeshStandardMaterial({
                    color: 0xdd0000,
                    emissive: 0xaa0000,
                    emissiveIntensity: 0.7
                });
                
                const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
                const angle = (i / 8) * Math.PI * 2;
                spike.position.set(
                    Math.cos(angle) * 0.9,
                    0.8,
                    Math.sin(angle) * 0.9
                );
                spike.rotation.x = Math.PI / 2;
                spike.rotation.z = angle;
                enemyGroup.add(spike);
            }
            
            // Add glowing eyes
            const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const eyeMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 1
            });
            
            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.3, 1.5, 0.5);
            enemyGroup.add(leftEye);
            
            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.3, 1.5, 0.5);
            enemyGroup.add(rightEye);
            
            // Add glow effect
            const glowGeometry = new THREE.SphereGeometry(1.5, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xff3333,
                transparent: true,
                opacity: 0.2
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.y = 0.7;
            enemyGroup.add(glow);
        }
        
        // Arms
        const armGeometry = new THREE.CapsuleGeometry(
            isBoss ? 0.3 : 0.2, 
            isBoss ? 0.9 : 0.6, 
            4, 8
        );
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: isBoss ? 0xff2222 : 0xe74c3c,
            emissive: isBoss ? 0xcc0000 : 0xaa0000,
            emissiveIntensity: isBoss ? 0.6 : 0.3
        });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(isBoss ? -0.8 : -0.5, 0.5, 0);
        leftArm.rotation.z = -Math.PI / 4;
        leftArm.castShadow = true;
        enemyGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(isBoss ? 0.8 : 0.5, 0.5, 0);
        rightArm.rotation.z = Math.PI / 4;
        rightArm.castShadow = true;
        enemyGroup.add(rightArm);
        
        // Randomize position across the bridge width
        const xPos = (Math.random() - 0.5) * 15.6; // Increased from 13 to 15.6 for wider bridge
        enemyGroup.position.set(xPos, isBoss ? 2 : 1, -50); // Far end of the bridge
        
        // Scale boss size
        if (isBoss) {
            enemyGroup.scale.set(1.5, 1.5, 1.5);
        }
        
        // Store enemy properties with scaling based on wave
        enemyGroup.userData = {
            speed: (0.24 + Math.random() * 0.12) * speedScaling, // Scale speed with wave
            health: isBoss ? (3 * healthScaling) : Math.ceil(1 * healthScaling), // Scale health with wave
            type: 'enemy',
            isBoss: isBoss,
            damage: isBoss ? 15 : 5 // Bosses do more damage
        };
        
        this.scene.add(enemyGroup);
        this.enemies.push(enemyGroup);
        
        // Update enemy counter
        this.updateEnemyCounter();
        
        console.log(`${isBoss ? "Boss" : "Enemy"} spawned at position:`, enemyGroup.position);
    }
    
    spawnUpgrade() {
        const upgradeTypes = ['laser', 'rocket', 'basic', 'healthkit', 'clone']; // Added clone upgrade
        const upgradeType = upgradeTypes[Math.floor(Math.random() * upgradeTypes.length)];
        
        // Create upgrade group
        const upgradeGroup = new THREE.Group();
        
        // Create base platform
        const baseGeometry = new THREE.BoxGeometry(1.5, 0.2, 1.5);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: upgradeType === 'healthkit' ? 0xff4444 : 
                   upgradeType === 'clone' ? 0x44ffff : 0x44aaff,
            emissive: upgradeType === 'healthkit' ? 0xcc2222 : 
                      upgradeType === 'clone' ? 0x00cccc : 0x0066cc,
            emissiveIntensity: 0.3
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.1;
        base.castShadow = true;
        base.receiveShadow = true;
        upgradeGroup.add(base);
        
        // Add floating effect with glow
        const glowGeometry = new THREE.SphereGeometry(1, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: upgradeType === 'healthkit' ? 0xff6666 : 
                   upgradeType === 'clone' ? 0x66ffff : 0x66ccff,
            transparent: true,
            opacity: 0.4
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 0.5;
        upgradeGroup.add(glow);
        
        // Add model based on upgrade type
        if (upgradeType === 'healthkit') {
            // Create health kit model
            const healthkitModel = this.createHealthkitModel();
            healthkitModel.position.y = 0.7;
            upgradeGroup.add(healthkitModel);
            
            // Add floating animation
            const animationStartY = 0.7;
            healthkitModel.userData.floatAnimation = {
                startY: animationStartY,
                phase: Math.random() * Math.PI * 2,
                speed: 2 + Math.random()
            };
        } else if (upgradeType === 'clone') {
            // Create clone model
            const cloneModel = this.createCloneModel();
            cloneModel.position.y = 0.7;
            upgradeGroup.add(cloneModel);
            
            // Add floating animation
            const animationStartY = 0.7;
            cloneModel.userData.floatAnimation = {
                startY: animationStartY,
                phase: Math.random() * Math.PI * 2,
                speed: 2 + Math.random()
            };
        } else {
            // Add weapon model for non-healthkit upgrades
            const weaponModel = this.weaponsConfig[upgradeType].model.clone();
            weaponModel.position.y = 0.7;
            weaponModel.scale.set(1.5, 1.5, 1.5);
            upgradeGroup.add(weaponModel);
            
            // Add floating animation
            const animationStartY = 0.7;
            weaponModel.userData.floatAnimation = {
                startY: animationStartY,
                phase: Math.random() * Math.PI * 2,
                speed: 2 + Math.random()
            };
        }
        
        // Set position on upgrade lane
        // Position on main bridge like enemies, but with random position
        const xPos = (Math.random() - 0.5) * 15.6; // Same positioning logic as enemies
        upgradeGroup.position.set(xPos, 1, -50); // Far end of the bridge
        
        // Store upgrade type
        upgradeGroup.userData = {
            type: 'upgrade',
            upgradeType: upgradeType,
            speed: (0.15 + Math.random() * 0.05) * 2.1 // 110% faster than enemies
        };
        
        this.scene.add(upgradeGroup);
        this.upgrades.push(upgradeGroup);
        
        console.log(`Spawned ${upgradeType} upgrade at position:`, upgradeGroup.position);
    }
    
    createHealthkitModel() {
        // Create a health kit model (red cross)
        const healthkitGroup = new THREE.Group();
        
        // Base (white box)
        const baseGeometry = new THREE.BoxGeometry(0.7, 0.3, 0.7);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.4,
            metalness: 0.3
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        healthkitGroup.add(base);
        
        // Red cross - horizontal part
        const hBarGeometry = new THREE.BoxGeometry(0.6, 0.15, 0.2);
        const crossMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xcc0000,
            emissiveIntensity: 0.5
        });
        const hBar = new THREE.Mesh(hBarGeometry, crossMaterial);
        hBar.position.y = 0.15;
        healthkitGroup.add(hBar);
        
        // Red cross - vertical part
        const vBarGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.6);
        const vBar = new THREE.Mesh(vBarGeometry, crossMaterial);
        vBar.position.y = 0.15;
        healthkitGroup.add(vBar);
        
        // Add glow
        const glowGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 0.4
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 0.15;
        healthkitGroup.add(glow);
        
        return healthkitGroup;
    }
    
    createKillCounter() {
        // Create kill counter display
        const counterDiv = document.createElement('div');
        counterDiv.id = 'kill-counter';
        counterDiv.style.position = 'absolute';
        counterDiv.style.top = '10px';
        counterDiv.style.left = '50%'; // Center horizontally
        counterDiv.style.transform = 'translateX(-50%)'; // Ensure true centering
        counterDiv.style.padding = '10px';
        counterDiv.style.backgroundColor = 'rgba(0, 100, 255, 0.7)';
        counterDiv.style.color = 'white';
        counterDiv.style.fontFamily = 'Arial, sans-serif';
        counterDiv.style.fontSize = '24px';
        counterDiv.style.fontWeight = 'bold';
        counterDiv.style.borderRadius = '5px';
        counterDiv.style.zIndex = '100';
        document.body.appendChild(counterDiv);
        
        this.updateKillCounter();
    }
    
    updateKillCounter() {
        const counterDiv = document.getElementById('kill-counter');
        if (counterDiv) {
            counterDiv.textContent = `Kills: ${this.enemyKills}`;
        }
    }
    
    getWeaponColor(weaponType) {
        switch(weaponType) {
            case 'basic': return '#ffdd00';
            case 'laser': return '#00ddff';
            case 'rocket': return '#ff3300';
            default: return 'white';
        }
    }
    
    fireProjectile() {
        const weaponConfig = this.weaponsConfig[this.currentWeapon];
        
        let projectileGeometry;
        
        // Enhanced projectile geometry based on weapon type
        if (this.currentWeapon === 'rocket') {
            // Rocket - Detailed missile shape
            const rocketGroup = new THREE.Group();
            
            // Rocket body
            const bodyGeo = new THREE.CylinderGeometry(0.15, 0.25, 0.7, 8);
            const bodyMat = new THREE.MeshBasicMaterial({ 
                color: 0xff3300,
                emissive: 0xff0000
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            rocketGroup.add(body);
            
            // Rocket nose
            const noseGeo = new THREE.ConeGeometry(0.15, 0.3, 8);
            const noseMat = new THREE.MeshBasicMaterial({ 
                color: 0xff6600
            });
            const nose = new THREE.Mesh(noseGeo, noseMat);
            nose.position.y = 0.5;
            rocketGroup.add(nose);
            
            // Rocket fins
            const finGeo = new THREE.BoxGeometry(0.05, 0.2, 0.2);
            const finMat = new THREE.MeshBasicMaterial({ 
                color: 0xffaa00
            });
            
            for (let i = 0; i < 4; i++) {
                const fin = new THREE.Mesh(finGeo, finMat);
                const angle = (i / 4) * Math.PI * 2;
                fin.position.set(
                    Math.cos(angle) * 0.2,
                    -0.35,
                    Math.sin(angle) * 0.2
                );
                fin.rotation.z = angle;
                rocketGroup.add(fin);
            }
            
            projectileGeometry = rocketGroup;
        } else if (this.currentWeapon === 'laser') {
            // Laser - Energy bolt with core
            projectileGeometry = new THREE.Group();
            
            // Outer glow
            const outerGeo = new THREE.SphereGeometry(0.3, 12, 12);
            outerGeo.scale(1, 1, 2); // Elongate
            const outerMat = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.6
            });
            const outer = new THREE.Mesh(outerGeo, outerMat);
            projectileGeometry.add(outer);
            
            // Inner core
            const coreGeo = new THREE.SphereGeometry(0.15, 8, 8);
            coreGeo.scale(1, 1, 2.5); // More elongated
            const coreMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                emissive: 0x00ffff,
                emissiveIntensity: 2
            });
            const core = new THREE.Mesh(coreGeo, coreMat);
            projectileGeometry.add(core);
            
            // Energy rings
            for (let i = 0; i < 3; i++) {
                const ringGeo = new THREE.TorusGeometry(0.2, 0.03, 8, 16);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 0.8 - (i * 0.2)
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.position.z = -0.3 - (i * 0.2);
                ring.rotation.y = Math.PI / 2;
                projectileGeometry.add(ring);
            }
        } else {
            // Basic - Enhanced energy ball
            projectileGeometry = new THREE.Group();
            
            // Core sphere
            const coreGeo = new THREE.SphereGeometry(0.2, 12, 12);
            const coreMat = new THREE.MeshBasicMaterial({
                color: 0xffffaa,
                emissive: 0xffff00,
                emissiveIntensity: 2
            });
            const core = new THREE.Mesh(coreGeo, coreMat);
            projectileGeometry.add(core);
            
            // Outer shell
            const shellGeo = new THREE.SphereGeometry(0.3, 12, 12);
            const shellMat = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.6
            });
            const shell = new THREE.Mesh(shellGeo, shellMat);
            projectileGeometry.add(shell);
            
            // Orbiting particles
            for (let i = 0; i < 8; i++) {
                const particleGeo = new THREE.SphereGeometry(0.06, 6, 6);
                const particleMat = new THREE.MeshBasicMaterial({
                    color: 0xffdd00
                });
                const particle = new THREE.Mesh(particleGeo, particleMat);
                
                const angle = (i / 8) * Math.PI * 2;
                const radius = 0.3;
                particle.position.set(
                    Math.cos(angle) * radius,
                    Math.sin(angle) * radius,
                    0
                );
                
                // Add animation data
                particle.userData = {
                    orbitSpeed: 3 + Math.random(),
                    orbitRadius: radius,
                    orbitAngle: angle
                };
                
                // Set up animation
                const animateParticle = () => {
                    if (projectileGeometry.parent) {
                        particle.userData.orbitAngle += 0.05 * particle.userData.orbitSpeed;
                        particle.position.x = Math.cos(particle.userData.orbitAngle) * particle.userData.orbitRadius;
                        particle.position.y = Math.sin(particle.userData.orbitAngle) * particle.userData.orbitRadius;
                        requestAnimationFrame(animateParticle);
                    }
                };
                animateParticle();
                
                projectileGeometry.add(particle);
            }
        }
        
        // Create projectile mesh/group
        let projectile;
        if (projectileGeometry instanceof THREE.Group) {
            projectile = projectileGeometry;
            
            // Orient rocket
            if (this.currentWeapon === 'rocket') {
                projectile.rotation.x = Math.PI / 2;
            }
        } else {
            const projectileMaterial = new THREE.MeshBasicMaterial({ 
                color: weaponConfig.projectileColor,
                emissive: weaponConfig.projectileColor,
                emissiveIntensity: 2.0
            });
            
            projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
            
            // Orient rocket projectiles
            if (this.currentWeapon === 'rocket') {
                projectile.rotation.x = Math.PI / 2;
            }
        }
        
        // Start position at player
        projectile.position.copy(this.player.position);
        projectile.position.y = this.player.position.y; // Match player height
        
        // Store projectile properties
        projectile.userData = {
            velocity: new THREE.Vector3(0, 0, -weaponConfig.projectileSpeed),
            damage: weaponConfig.damage,
            life: 800, // Lifetime
            weaponType: this.currentWeapon
        };
        
        this.scene.add(projectile);
        this.projectiles.push(projectile);
        
        // Add enhanced trail effect
        let trailGroup = new THREE.Group();
        projectile.add(trailGroup);
        
        if (this.currentWeapon === 'laser') {
            // Laser beam trail
            const trailGeo = new THREE.CylinderGeometry(0.1, 0.05, 4, 8);
            const trailMat = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.5
            });
            const trail = new THREE.Mesh(trailGeo, trailMat);
            trail.rotation.x = Math.PI / 2;
            trail.position.z = 2;
            trailGroup.add(trail);
            
            // Energy particles that fly off
            const emitEnergyParticles = () => {
                if (!this.projectiles.includes(projectile)) return;
                
                const particleGeo = new THREE.SphereGeometry(0.05, 4, 4);
                const particleMat = new THREE.MeshBasicMaterial({
                    color: 0x88ffff,
                    transparent: true,
                    opacity: 0.8
                });
                
                for (let i = 0; i < 2; i++) {
                    const particle = new THREE.Mesh(particleGeo, particleMat);
                    particle.position.copy(projectile.position);
                    particle.position.x += (Math.random() - 0.5) * 0.3;
                    particle.position.y += (Math.random() - 0.5) * 0.3;
                    particle.position.z += (Math.random() - 0.5) * 0.3 + 0.5;
                    
                    const velocity = new THREE.Vector3(
                        (Math.random() - 0.5) * 0.2,
                        (Math.random() - 0.5) * 0.2,
                        (Math.random() - 0.5) * 0.2
                    );
                    
                    this.scene.add(particle);
                    
                    const startTime = Date.now();
                    const animateParticle = () => {
                        const elapsed = Date.now() - startTime;
                        if (elapsed < 300) {
                            particle.position.add(velocity);
                            particle.material.opacity = 0.8 * (1 - elapsed / 300);
                            requestAnimationFrame(animateParticle);
                        } else {
                            this.scene.remove(particle);
                        }
                    };
                    animateParticle();
                }
                
                setTimeout(() => emitEnergyParticles(), 50);
            };
            
            emitEnergyParticles();
            
        } else if (this.currentWeapon === 'rocket') {
            // Improved rocket exhaust
            const exhaustGeo = new THREE.ConeGeometry(0.4, 3, 12);
            const exhaustMat = new THREE.MeshBasicMaterial({
                color: 0xff6600,
                transparent: true,
                opacity: 0.7
            });
            const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
            exhaust.rotation.x = Math.PI; // Point backward
            exhaust.position.z = 1.2;
            trailGroup.add(exhaust);
            
            // Inner exhaust core
            const coreGeo = new THREE.ConeGeometry(0.2, 2, 12);
            const coreMat = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.9
            });
            const core = new THREE.Mesh(coreGeo, coreMat);
            core.rotation.x = Math.PI; // Point backward
            core.position.z = 1.0;
            trailGroup.add(core);
            
            // Smoke particles
            const createSmokeParticle = () => {
                if (!this.projectiles.includes(projectile)) return;
                
                const size = 0.2 + Math.random() * 0.15;
                const smokeGeo = new THREE.SphereGeometry(size, 6, 6);
                const smokeMat = new THREE.MeshBasicMaterial({
                    color: 0x888888,
                    transparent: true,
                    opacity: 0.3 + Math.random() * 0.2
                });
                
                const smoke = new THREE.Mesh(smokeGeo, smokeMat);
                smoke.position.copy(projectile.position);
                smoke.position.z += 1.5 + Math.random() * 0.5;
                smoke.position.x += (Math.random() - 0.5) * 0.4;
                smoke.position.y += (Math.random() - 0.5) * 0.4;
                
                this.scene.add(smoke);
                
                const startTime = Date.now();
                const duration = 500 + Math.random() * 300;
                
                const animateSmoke = () => {
                    const elapsed = Date.now() - startTime;
                    if (elapsed < duration) {
                        const progress = elapsed / duration;
                        smoke.scale.set(1 + progress*2, 1 + progress*2, 1 + progress*2);
                        smoke.material.opacity = 0.3 * (1 - progress);
                        requestAnimationFrame(animateSmoke);
                    } else {
                        this.scene.remove(smoke);
                    }
                };
                
                animateSmoke();
                
                setTimeout(() => createSmokeParticle(), 40 + Math.random() * 20);
            };
            
            createSmokeParticle();
        } else {
            // Enhanced trail for basic weapon
            const trailGeo = new THREE.CylinderGeometry(0.15, 0.25, 2, 8);
            const trailMat = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.6
            });
            const trail = new THREE.Mesh(trailGeo, trailMat);
            trail.rotation.x = Math.PI / 2;
            trail.position.z = 1;
            trailGroup.add(trail);
            
            // Sparks that fly off
            const emitSparks = () => {
                if (!this.projectiles.includes(projectile)) return;
                
                const sparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
                const sparkMat = new THREE.MeshBasicMaterial({
                    color: 0xffff00,
                    emissive: 0xffff00,
                    emissiveIntensity: 2
                });
                
                const spark = new THREE.Mesh(sparkGeo, sparkMat);
                spark.position.copy(projectile.position);
                spark.position.x += (Math.random() - 0.5) * 0.3;
                spark.position.y += (Math.random() - 0.5) * 0.3;
                spark.position.z += 0.5 + Math.random() * 0.5;
                
                this.scene.add(spark);
                
                const startTime = Date.now();
                const animateSpark = () => {
                    const elapsed = Date.now() - startTime;
                    if (elapsed < 200) {
                        spark.rotation.x += 0.2;
                        spark.rotation.y += 0.2;
                        requestAnimationFrame(animateSpark);
                    } else {
                        this.scene.remove(spark);
                    }
                };
                
                animateSpark();
                
                setTimeout(() => emitSparks(), 80);
            };
            
            emitSparks();
        }
        
        // Make clones fire too
        this.fireFromClones();
    }
    
    // New method to make clones fire
    fireFromClones() {
        // Small delay for each clone to create a cooler effect
        this.clones.forEach((clone, index) => {
            setTimeout(() => {
                if (!this.scene.getObjectById(clone.id)) return; // Skip if clone was removed
                
                const weaponConfig = this.weaponsConfig[this.currentWeapon];
                
                // Create the exact same projectile as the player would create
                // by reusing the fireProjectile logic, but with modified position
                
                let projectileGeometry;
                
                // Enhanced projectile geometry based on weapon type - SAME AS PLAYER
                if (this.currentWeapon === 'rocket') {
                    // Rocket - Detailed missile shape
                    const rocketGroup = new THREE.Group();
                    
                    // Rocket body
                    const bodyGeo = new THREE.CylinderGeometry(0.15, 0.25, 0.7, 8);
                    const bodyMat = new THREE.MeshBasicMaterial({ 
                        color: 0xff3300,
                        emissive: 0xff0000
                    });
                    const body = new THREE.Mesh(bodyGeo, bodyMat);
                    rocketGroup.add(body);
                    
                    // Rocket nose
                    const noseGeo = new THREE.ConeGeometry(0.15, 0.3, 8);
                    const noseMat = new THREE.MeshBasicMaterial({ 
                        color: 0xff6600
                    });
                    const nose = new THREE.Mesh(noseGeo, noseMat);
                    nose.position.y = 0.5;
                    rocketGroup.add(nose);
                    
                    // Rocket fins
                    const finGeo = new THREE.BoxGeometry(0.05, 0.2, 0.2);
                    const finMat = new THREE.MeshBasicMaterial({ 
                        color: 0xffaa00
                    });
                    
                    for (let i = 0; i < 4; i++) {
                        const fin = new THREE.Mesh(finGeo, finMat);
                        const angle = (i / 4) * Math.PI * 2;
                        fin.position.set(
                            Math.cos(angle) * 0.2,
                            -0.35,
                            Math.sin(angle) * 0.2
                        );
                        fin.rotation.z = angle;
                        rocketGroup.add(fin);
                    }
                    
                    projectileGeometry = rocketGroup;
                } else if (this.currentWeapon === 'laser') {
                    // Laser - Energy bolt with core
                    projectileGeometry = new THREE.Group();
                    
                    // Outer glow
                    const outerGeo = new THREE.SphereGeometry(0.3, 12, 12);
                    outerGeo.scale(1, 1, 2); // Elongate
                    const outerMat = new THREE.MeshBasicMaterial({
                        color: 0x00ffff,
                        transparent: true,
                        opacity: 0.6
                    });
                    const outer = new THREE.Mesh(outerGeo, outerMat);
                    projectileGeometry.add(outer);
                    
                    // Inner core
                    const coreGeo = new THREE.SphereGeometry(0.15, 8, 8);
                    coreGeo.scale(1, 1, 2.5); // More elongated
                    const coreMat = new THREE.MeshBasicMaterial({
                        color: 0xffffff,
                        emissive: 0x00ffff,
                        emissiveIntensity: 2
                    });
                    const core = new THREE.Mesh(coreGeo, coreMat);
                    projectileGeometry.add(core);
                    
                    // Energy rings
                    for (let i = 0; i < 3; i++) {
                        const ringGeo = new THREE.TorusGeometry(0.2, 0.03, 8, 16);
                        const ringMat = new THREE.MeshBasicMaterial({
                            color: 0x00ffff,
                            transparent: true,
                            opacity: 0.8 - (i * 0.2)
                        });
                        const ring = new THREE.Mesh(ringGeo, ringMat);
                        ring.position.z = -0.3 - (i * 0.2);
                        ring.rotation.y = Math.PI / 2;
                        projectileGeometry.add(ring);
                    }
                } else {
                    // Basic - Enhanced energy ball
                    projectileGeometry = new THREE.Group();
                    
                    // Core sphere
                    const coreGeo = new THREE.SphereGeometry(0.2, 12, 12);
                    const coreMat = new THREE.MeshBasicMaterial({
                        color: 0xffffaa,
                        emissive: 0xffff00,
                        emissiveIntensity: 2
                    });
                    const core = new THREE.Mesh(coreGeo, coreMat);
                    projectileGeometry.add(core);
                    
                    // Outer shell
                    const shellGeo = new THREE.SphereGeometry(0.3, 12, 12);
                    const shellMat = new THREE.MeshBasicMaterial({
                        color: 0xffff00,
                        transparent: true,
                        opacity: 0.6
                    });
                    const shell = new THREE.Mesh(shellGeo, shellMat);
                    projectileGeometry.add(shell);
                    
                    // Orbiting particles
                    for (let i = 0; i < 8; i++) {
                        const particleGeo = new THREE.SphereGeometry(0.06, 6, 6);
                        const particleMat = new THREE.MeshBasicMaterial({
                            color: 0xffdd00
                        });
                        const particle = new THREE.Mesh(particleGeo, particleMat);
                        
                        const angle = (i / 8) * Math.PI * 2;
                        const radius = 0.3;
                        particle.position.set(
                            Math.cos(angle) * radius,
                            Math.sin(angle) * radius,
                            0
                        );
                        
                        // Add animation data
                        particle.userData = {
                            orbitSpeed: 3 + Math.random(),
                            orbitRadius: radius,
                            orbitAngle: angle
                        };
                        
                        // Set up animation
                        const animateParticle = () => {
                            if (projectileGeometry.parent) {
                                particle.userData.orbitAngle += 0.05 * particle.userData.orbitSpeed;
                                particle.position.x = Math.cos(particle.userData.orbitAngle) * particle.userData.orbitRadius;
                                particle.position.y = Math.sin(particle.userData.orbitAngle) * particle.userData.orbitRadius;
                                requestAnimationFrame(animateParticle);
                            }
                        };
                        animateParticle();
                        
                        projectileGeometry.add(particle);
                    }
                }
                
                // Create projectile mesh/group
                let projectile;
                if (projectileGeometry instanceof THREE.Group) {
                    projectile = projectileGeometry;
                    
                    // Orient rocket
                    if (this.currentWeapon === 'rocket') {
                        projectile.rotation.x = Math.PI / 2;
                    }
                } else {
                    const projectileMaterial = new THREE.MeshBasicMaterial({ 
                        color: weaponConfig.projectileColor,
                        emissive: weaponConfig.projectileColor,
                        emissiveIntensity: 2.0
                    });
                    
                    projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
                    
                    // Orient rocket projectiles
                    if (this.currentWeapon === 'rocket') {
                        projectile.rotation.x = Math.PI / 2;
                    }
                }
                
                // Start position at clone instead of player
                projectile.position.copy(clone.position);
                projectile.position.y = clone.position.y + 0.3; // Adjust for clone height
                
                // Store projectile properties
                projectile.userData = {
                    velocity: new THREE.Vector3(0, 0, -weaponConfig.projectileSpeed),
                    damage: weaponConfig.damage,
                    life: 800, // Lifetime
                    weaponType: this.currentWeapon
                };
                
                this.scene.add(projectile);
                this.projectiles.push(projectile);
                
                // Add enhanced trail effect
                let trailGroup = new THREE.Group();
                projectile.add(trailGroup);
                
                if (this.currentWeapon === 'laser') {
                    // Laser beam trail
                    const trailGeo = new THREE.CylinderGeometry(0.1, 0.05, 4, 8);
                    const trailMat = new THREE.MeshBasicMaterial({
                        color: 0x00ffff,
                        transparent: true,
                        opacity: 0.5
                    });
                    const trail = new THREE.Mesh(trailGeo, trailMat);
                    trail.rotation.x = Math.PI / 2;
                    trail.position.z = 2;
                    trailGroup.add(trail);
                    
                    // Energy particles that fly off
                    const emitEnergyParticles = () => {
                        if (!this.projectiles.includes(projectile)) return;
                        
                        const particleGeo = new THREE.SphereGeometry(0.05, 4, 4);
                        const particleMat = new THREE.MeshBasicMaterial({
                            color: 0x88ffff,
                            transparent: true,
                            opacity: 0.8
                        });
                        
                        for (let i = 0; i < 2; i++) {
                            const particle = new THREE.Mesh(particleGeo, particleMat);
                            
                            // Random position near the trail
                            const offset = 0.15;
                            particle.position.set(
                                (Math.random() - 0.5) * offset,
                                (Math.random() - 0.5) * offset,
                                projectile.position.z + 0.5 + Math.random()
                            );
                            
                            particle.userData = {
                                velocity: new THREE.Vector3(
                                    (Math.random() - 0.5) * 5,
                                    (Math.random() - 0.5) * 5,
                                    (Math.random() - 0.5) * 5
                                ),
                                life: 30
                            };
                            
                            this.scene.add(particle);
                            
                            // Animate and fade out
                            const animateParticle = () => {
                                if (particle.userData.life <= 0) {
                                    this.scene.remove(particle);
                                    return;
                                }
                                
                                particle.position.x += particle.userData.velocity.x * 0.01;
                                particle.position.y += particle.userData.velocity.y * 0.01;
                                particle.position.z += particle.userData.velocity.z * 0.01;
                                
                                particle.userData.life--;
                                particle.material.opacity = particle.userData.life / 30;
                                
                                requestAnimationFrame(animateParticle);
                            };
                            
                            animateParticle();
                        }
                        
                        // Continue emitting particles
                        if (this.projectiles.includes(projectile)) {
                            setTimeout(() => emitEnergyParticles(), 50);
                        }
                    };
                    
                    emitEnergyParticles();
                } else if (this.currentWeapon === 'rocket') {
                    // Rocket trail - smoke and fire
                    const createSmokeParticle = () => {
                        if (!this.projectiles.includes(projectile)) return;
                        
                        const smokeGeo = new THREE.SphereGeometry(0.2, 6, 6);
                        const smokeMat = new THREE.MeshBasicMaterial({
                            color: 0x555555,
                            transparent: true,
                            opacity: 0.4
                        });
                        
                        const smoke = new THREE.Mesh(smokeGeo, smokeMat);
                        smoke.position.copy(projectile.position);
                        smoke.position.z += 0.5; // Behind the rocket
                        
                        smoke.userData = {
                            life: 30,
                            expandRate: 0.03
                        };
                        
                        this.scene.add(smoke);
                        
                        // Animate smoke
                        const animateSmoke = () => {
                            if (smoke.userData.life <= 0) {
                                this.scene.remove(smoke);
                                return;
                            }
                            
                            smoke.scale.x += smoke.userData.expandRate;
                            smoke.scale.y += smoke.userData.expandRate;
                            smoke.scale.z += smoke.userData.expandRate;
                            
                            smoke.userData.life--;
                            smoke.material.opacity = (smoke.userData.life / 30) * 0.4;
                            
                            requestAnimationFrame(animateSmoke);
                        };
                        
                        animateSmoke();
                        
                        // Continue creating smoke
                        if (this.projectiles.includes(projectile)) {
                            setTimeout(() => createSmokeParticle(), 50);
                        }
                    };
                    
                    createSmokeParticle();
                    
                    // Add sparks
                    const emitSparks = () => {
                        if (!this.projectiles.includes(projectile)) return;
                        
                        const sparkGeo = new THREE.SphereGeometry(0.05, 4, 4);
                        const sparkMat = new THREE.MeshBasicMaterial({
                            color: 0xffaa00
                        });
                        
                        for (let i = 0; i < 3; i++) {
                            const spark = new THREE.Mesh(sparkGeo, sparkMat);
                            spark.position.copy(projectile.position);
                            spark.position.z += 0.5; // Behind rocket
                            
                            // Random direction
                            const angle = Math.random() * Math.PI * 2;
                            const speed = 0.1 + Math.random() * 0.1;
                            
                            spark.userData = {
                                velocity: new THREE.Vector3(
                                    Math.cos(angle) * speed,
                                    Math.sin(angle) * speed,
                                    0.1 * (Math.random() - 0.5)
                                ),
                                life: 20
                            };
                            
                            this.scene.add(spark);
                            
                            // Animate spark
                            const animateSpark = () => {
                                if (spark.userData.life <= 0) {
                                    this.scene.remove(spark);
                                    return;
                                }
                                
                                spark.position.x += spark.userData.velocity.x;
                                spark.position.y += spark.userData.velocity.y;
                                spark.position.z += spark.userData.velocity.z;
                                
                                spark.userData.life--;
                                
                                requestAnimationFrame(animateSpark);
                            };
                            
                            animateSpark();
                        }
                        
                        // Continue emitting sparks
                        if (this.projectiles.includes(projectile)) {
                            setTimeout(() => emitSparks(), 50);
                        }
                    };
                    
                    emitSparks();
                }

            }, index * 50); // 50ms delay between each clone's firing
        });
    }
    
    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Move projectile
            projectile.position.add(
                projectile.userData.velocity.clone().multiplyScalar(deltaTime * this.gameSpeed)
            );
            
            // Remove if out of bounds
            if (projectile.position.z < -60) {
                this.scene.remove(projectile);
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Reduce lifetime
            projectile.userData.life -= deltaTime * 1000;
            if (projectile.userData.life <= 0) {
                this.scene.remove(projectile);
                this.projectiles.splice(i, 1);
                continue;
            }
            
            let projectileRemoved = false;
            
            // Check collisions with enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const distance = projectile.position.distanceTo(enemy.position);
                
                // Different hit radius based on weapon type
                const hitRadius = projectile.userData.weaponType === 'rocket' ? 2 : 1;
                
                if (distance < hitRadius) { // Hit radius
                    // If it's a rocket, handle explosion differently
                    if (projectile.userData.weaponType === 'rocket') {
                        // Create explosion effect
                        this.createHitEffect(projectile.position, 'rocket');
                        
                        // Create an explosion that damages all enemies within radius
                        this.createRocketExplosion(projectile.position, projectile.userData.damage);
                        
                        // Remove rocket projectile
                        this.scene.remove(projectile);
                        this.projectiles.splice(i, 1);
                        projectileRemoved = true;
                        break;
                    } else {
                        // Handle other projectiles normally
                        this.createHitEffect(projectile.position, projectile.userData.weaponType);
                        
                        // Damage enemy
                        enemy.userData.health -= projectile.userData.damage;
                        
                        // Remove projectile (except laser which can pierce through)
                        if (projectile.userData.weaponType !== 'laser') {
                            this.scene.remove(projectile);
                            this.projectiles.splice(i, 1);
                            projectileRemoved = true;
                        }
                        
                        // Remove enemy if dead
                        if (enemy.userData.health <= 0) {
                            this.scene.remove(enemy);
                            this.enemies.splice(j, 1);
                            
                            // Increment kill counter
                            this.enemyKills++;
                            this.updateKillCounter();
                        }
                        
                        // Break loop if projectile was removed (except laser)
                        if (projectileRemoved) {
                            break;
                        }
                    }
                }
            }
            
            if (projectileRemoved) {
                continue;
            }
        }
    }
    
    // New method to handle rocket explosions with area damage
    createRocketExplosion(position, baseDamage) {
        // Define explosion radius - larger than the hit radius
        const explosionRadius = 6; // Increased from 5 to 6
        
        // Create a larger visual explosion
        const explosionGeometry = new THREE.SphereGeometry(explosionRadius, 32, 32);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff5500,
            transparent: true,
            opacity: 0.3
        });
        
        const explosionSphere = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosionSphere.position.copy(position);
        this.scene.add(explosionSphere);
        
        // Add a secondary pulse effect
        const pulseGeometry = new THREE.SphereGeometry(explosionRadius * 0.7, 32, 32);
        const pulseMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.5
        });
        
        const pulseSphere = new THREE.Mesh(pulseGeometry, pulseMaterial);
        pulseSphere.position.copy(position);
        this.scene.add(pulseSphere);
        
        // Animate and remove the visual indicator
        const startTime = Date.now();
        const duration = 500; // Increased from 300 to 500
        
        const animateExplosion = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Main explosion sphere
                explosionSphere.material.opacity = 0.3 * (1 - progress);
                explosionSphere.scale.set(1 + progress * 0.5, 1 + progress * 0.5, 1 + progress * 0.5);
                
                // Pulse sphere
                pulseSphere.material.opacity = 0.5 * (1 - progress);
                pulseSphere.scale.set(0.7 + progress * 1.0, 0.7 + progress * 1.0, 0.7 + progress * 1.0);
                
                requestAnimationFrame(animateExplosion);
            } else {
                this.scene.remove(explosionSphere);
                this.scene.remove(pulseSphere);
            }
        };
        
        animateExplosion();
        
        // Apply damage to all enemies within the explosion radius
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const distance = position.distanceTo(enemy.position);
            
            if (distance <= explosionRadius) {
                // Calculate damage based on distance from center (more damage closer to center)
                const damageMultiplier = 1 - (distance / explosionRadius) * 0.3; // At max range, still does 70% damage (changed from 50%)
                const damage = baseDamage * damageMultiplier;
                
                // Apply damage to enemy
                enemy.userData.health -= damage;
                
                // Apply force to enemies (push them away from explosion)
                if (distance > 0.1) { // Avoid division by zero
                    const pushDirection = new THREE.Vector3()
                        .subVectors(enemy.position, position)
                        .normalize();
                    
                    const pushForce = (1 - distance / explosionRadius) * 2; // More force closer to center
                    enemy.position.add(pushDirection.multiplyScalar(pushForce));
                }
                
                // Create small hit effect on each enemy caught in the blast
                if (distance > 0.5) { // Don't create extra effects too close to explosion center
                    this.createHitEffect(enemy.position, 'basic');
                }
                
                // Remove enemy if dead
                if (enemy.userData.health <= 0) {
                    this.scene.remove(enemy);
                    this.enemies.splice(i, 1);
                    
                    // Increment kill counter
                    this.enemyKills++;
                    this.updateKillCounter();
                }
            }
        }
        
        // Create screen shake effect
        this.createScreenShake(0.5, 600);
    }
    
    updateEnemies(deltaTime) {
        // Debug info
        console.log(`Updating ${this.enemies.length} enemies with deltaTime: ${deltaTime}`);
        
        // Move existing enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Move enemy toward player - 3x faster than before
            const moveAmount = enemy.userData.speed * deltaTime * this.gameSpeed * 12; // 3x faster
            enemy.position.z += moveAmount;
            
            console.log(`Enemy ${i} moved by ${moveAmount} to position:`, enemy.position);
            
            // Check if enemy reached the end
            if (enemy.position.z > 7) { // Changed to match new player position
                // Reduce player health when enemy reaches the end
                const damage = enemy.userData.damage || 5; // Get damage from enemy or default to 5
                this.playerHealth = Math.max(0, this.playerHealth - damage);
                this.updateHealthBar();
                
                // Create damage effect
                this.createDamageEffect();
                
                // Remove enemy
                this.scene.remove(enemy);
                this.enemies.splice(i, 1);
                
                // Check if player is dead
                if (this.playerHealth <= 0) {
                    this.gameOver();
                }
            }
        }
        
        // Check for wave progression
        const currentTime = Date.now();
        if (currentTime - this.lastWaveChangeTime > this.waveChangeTime && this.currentWave < this.maxWave) {
            this.currentWave++;
            this.lastWaveChangeTime = currentTime;
            this.updateWaveIndicator();
            this.updateWaveTimer(); // Update timer immediately after wave change
            
            // Announce new wave with a banner
            this.announceNewWave();
            
            // Spawn boss on boss waves
            if (this.bossWaves.includes(this.currentWave)) {
                // Spawn boss after a short delay
                setTimeout(() => {
                    this.announceBoss();
                    setTimeout(() => this.spawnEnemy(true), 2000);
                }, 1000);
            } else {
                // Spawn a large wave for non-boss waves
                const waveSize = Math.floor(3 + this.currentWave);
                for (let i = 0; i < waveSize; i++) {
                    setTimeout(() => this.spawnEnemy(), i * 400);
                }
            }
            
            // Scale difficulty based on wave
            this.enemySpawnRate = Math.max(800 - (this.currentWave - 1) * 60, 400); // Faster spawns, min 400ms
        }
        
        // Spawn new enemies based on time, with occasional wave spawns
        if (currentTime - this.lastSpawnTime > this.enemySpawnRate) {
            // Random chance for a wave of enemies (3-5)
            if (Math.random() < 0.3) {
                const waveSize = Math.floor(Math.random() * 3) + 3;
                for (let i = 0; i < waveSize; i++) {
                    setTimeout(() => this.spawnEnemy(), i * 200);
                }
                console.log(`Spawned a wave of ${waveSize} enemies`);
            } else {
                this.spawnEnemy();
            }
            this.lastSpawnTime = currentTime;
        }
    }
    
    updateUpgrades(deltaTime) {
        for (let i = this.upgrades.length - 1; i >= 0; i--) {
            const upgrade = this.upgrades[i];
            
            // Move upgrade forward
            const moveAmount = upgrade.userData.speed * deltaTime * this.gameSpeed * 12;
            upgrade.position.z += moveAmount;
            
            // Animate floating weapon or healthkit
            if (upgrade.children.length > 2) {
                const model = upgrade.children[2];
                const anim = model.userData.floatAnimation;
                
                if (anim) {
                    const newY = anim.startY + Math.sin(anim.phase + this.clock.getElapsedTime() * anim.speed) * 0.2;
                    model.position.y = newY;
                    
                    // Also rotate slowly
                    model.rotation.y += deltaTime * 1.5;
                }
            }
            
            // Check if player collected the upgrade
            const distance = upgrade.position.distanceTo(this.player.position);
            if (distance < 3) {
                // Apply upgrade based on type
                if (upgrade.userData.upgradeType === 'healthkit') {
                    // Restore health by 10% of max (10 points)
                    this.playerHealth = Math.min(100, this.playerHealth + 10);
                    this.updateHealthBar();
                    this.createHealthkitCollectEffect(upgrade.position);
                } else if (upgrade.userData.upgradeType === 'clone') {
                    // Spawn a player clone
                    this.spawnPlayerClone();
                    this.createUpgradeCollectEffect(upgrade.position);
                } else {
                    // Weapon upgrade
                    this.currentWeapon = upgrade.userData.upgradeType;
                    this.createUpgradeCollectEffect(upgrade.position);
                }
                
                // Remove upgrade
                this.scene.remove(upgrade);
                this.upgrades.splice(i, 1);
                continue;
            }
            
            // Remove if past player
            if (upgrade.position.z > 7) {
                this.scene.remove(upgrade);
                this.upgrades.splice(i, 1);
            }
        }
        
        // Spawn new upgrades
        const currentTime = Date.now();
        if (currentTime - this.lastUpgradeTime > this.upgradeSpawnRate) {
            // Increased chance from 15% to 50% to make upgrades more common
            if (Math.random() < 0.5) {
                this.spawnUpgrade();
            }
            this.lastUpgradeTime = currentTime;
        }
    }
    
    createHitEffect(position, weaponType) {
        // Different explosion effects based on weapon type
        let explosionColor, glowColor, particleColors, size, duration;
        
        switch(weaponType) {
            case 'laser':
                explosionColor = 0x00ffff;
                glowColor = 0x00aaff;
                particleColors = [0x00ffff, 0x0088ff];
                size = 0.7;
                duration = 150;
                break;
            case 'rocket':
                explosionColor = 0xff3300;
                glowColor = 0xff5500;
                particleColors = [0xff3300, 0xffaa00, 0xffff00]; // Added yellow for more fire-like effect
                size = 3.0; // Increased from 2.0 to 3.0
                duration = 400; // Increased from 300 to 400
                break;
            default:
                explosionColor = 0xffaa00;
                glowColor = 0xff5500;
                particleColors = [0xffff00, 0xff5500];
                size = 0.8;
                duration = 180;
        }
        
        // Create explosion effect
        const explosionGeometry = new THREE.SphereGeometry(size, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({ 
            color: explosionColor,
            transparent: true,
            opacity: 1.0
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        this.scene.add(explosion);
        
        // Add secondary glow
        const glowGeometry = new THREE.SphereGeometry(size * 1.8, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: glowColor,
            transparent: true,
            opacity: 0.7
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        explosion.add(glow);
        
        // Add particles
        const particleCount = weaponType === 'rocket' ? 30 : 10; // Increased from 20 to 30 for rocket
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeom = new THREE.SphereGeometry(
                weaponType === 'rocket' ? 0.2 + Math.random() * 0.15 : 0.15, // Varied size for rocket
                8, 8
            );
            const particleMat = new THREE.MeshBasicMaterial({
                color: particleColors[Math.floor(Math.random() * particleColors.length)],
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(particleGeom, particleMat);
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * (weaponType === 'rocket' ? 2.5 : 0.8); // Increased from 1.5 to 2.5
            particle.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                Math.sin(angle * 2) * radius
            );
            
            const speed = weaponType === 'rocket' ? 0.12 : 0.05; // Increased from 0.08 to 0.12
            particle.userData = {
                velocity: particle.position.clone().normalize().multiplyScalar(speed)
            };
            
            particles.add(particle);
        }
        
        explosion.add(particles);
        
        // Animate explosion
        const startTime = Date.now();
        
        const animateExplosion = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            const scale = 1 + progress * (weaponType === 'rocket' ? 8 : 4); // Increased from 6 to 8
            const opacity = 1 - progress;
            
            explosion.scale.set(scale, scale, scale);
            explosionMaterial.opacity = opacity;
            glowMaterial.opacity = opacity * 0.7;
            
            // Animate particles
            particles.children.forEach(particle => {
                particle.position.add(particle.userData.velocity);
                particle.material.opacity = opacity;
            });
            
            if (elapsed < duration) {
                requestAnimationFrame(animateExplosion);
            } else {
                this.scene.remove(explosion);
            }
        };
        
        animateExplosion();
        
        // Add screen shake for rocket explosions
        if (weaponType === 'rocket') {
            this.createScreenShake(0.3, 400); // Add screen shake for rocket explosions
        }
    }
    
    createUpgradeCollectEffect(position) {
        // Create collection effect
        const radius = 2;
        const ringsCount = 3;
        const rings = new THREE.Group();
        
        for (let i = 0; i < ringsCount; i++) {
            const ringGeometry = new THREE.RingGeometry(radius * 0.7, radius, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0x66ccff,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.copy(position);
            ring.rotation.x = Math.PI / 2;
            ring.scale.set(0.1, 0.1, 0.1);
            ring.userData = {
                delay: i * 150,
                startTime: Date.now()
            };
            
            rings.add(ring);
        }
        
        this.scene.add(rings);
        
        // Animate rings
        const duration = 800;
        
        const animateRings = () => {
            let allComplete = true;
            
            rings.children.forEach(ring => {
                const elapsed = Date.now() - ring.userData.startTime - ring.userData.delay;
                
                if (elapsed > 0 && elapsed < duration) {
                    allComplete = false;
                    const progress = elapsed / duration;
                    const scale = progress * 2;
                    const opacity = 1 - progress;
                    
                    ring.scale.set(scale, scale, scale);
                    ring.material.opacity = opacity;
                }
                else if (elapsed <= 0) {
                    allComplete = false;
                }
            });
            
            if (!allComplete) {
                requestAnimationFrame(animateRings);
            } else {
                this.scene.remove(rings);
            }
        };
        
        animateRings();
    }
    
    createHealthkitCollectEffect(position) {
        // Create health collection effect (green rings)
        const radius = 2;
        const ringsCount = 3;
        const rings = new THREE.Group();
        
        for (let i = 0; i < ringsCount; i++) {
            const ringGeometry = new THREE.RingGeometry(radius * 0.7, radius, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0x22cc44, // Green color for health
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.copy(position);
            ring.rotation.x = Math.PI / 2;
            ring.scale.set(0.1, 0.1, 0.1);
            ring.userData = {
                delay: i * 150,
                startTime: Date.now()
            };
            
            rings.add(ring);
        }
        
        this.scene.add(rings);
        
        // Animate rings
        const duration = 800;
        
        const animateRings = () => {
            let allComplete = true;
            
            rings.children.forEach(ring => {
                const elapsed = Date.now() - ring.userData.startTime - ring.userData.delay;
                
                if (elapsed > 0 && elapsed < duration) {
                    allComplete = false;
                    const progress = elapsed / duration;
                    const scale = progress * 2;
                    const opacity = 1 - progress;
                    
                    ring.scale.set(scale, scale, scale);
                    ring.material.opacity = opacity;
                }
                else if (elapsed <= 0) {
                    allComplete = false;
                }
            });
            
            if (!allComplete) {
                requestAnimationFrame(animateRings);
            } else {
                this.scene.remove(rings);
            }
        };
        
        animateRings();
        
        // Add healing number popup
        const healValue = document.createElement('div');
        healValue.textContent = '+10';
        healValue.style.position = 'absolute';
        healValue.style.color = '#22ff22';
        healValue.style.fontFamily = 'Arial, sans-serif';
        healValue.style.fontSize = '24px';
        healValue.style.fontWeight = 'bold';
        healValue.style.textShadow = '0 0 5px #000';
        
        // Convert 3D position to screen coordinates
        const vector = new THREE.Vector3();
        vector.copy(position);
        vector.project(this.camera);
        
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = -(vector.y * 0.5 - 0.5) * window.innerHeight;
        
        healValue.style.left = `${x}px`;
        healValue.style.top = `${y}px`;
        document.body.appendChild(healValue);
        
        // Animate the heal value
        let startTime = Date.now();
        const animateHealValue = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < 1000) {
                // Move up and fade out
                healValue.style.top = `${y - elapsed/40}px`;
                healValue.style.opacity = (1 - elapsed/1000).toString();
                requestAnimationFrame(animateHealValue);
            } else {
                document.body.removeChild(healValue);
            }
        };
        
        animateHealValue();
    }
    
    createHealthBar() {
        // Create container for health bar
        const healthContainer = document.createElement('div');
        healthContainer.id = 'health-container';
        healthContainer.style.position = 'absolute';
        healthContainer.style.top = '10px';
        healthContainer.style.right = '10px';
        healthContainer.style.width = '200px';
        healthContainer.style.height = '25px';
        healthContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        healthContainer.style.borderRadius = '5px';
        healthContainer.style.padding = '3px';
        healthContainer.style.zIndex = '100';
        
        // Create the actual health bar
        const healthBar = document.createElement('div');
        healthBar.id = 'health-bar';
        healthBar.style.width = '100%';
        healthBar.style.height = '100%';
        healthBar.style.backgroundColor = '#22cc22';
        healthBar.style.borderRadius = '3px';
        healthBar.style.transition = 'width 0.3s';
        
        // Create text label
        const healthText = document.createElement('div');
        healthText.textContent = 'Health: 100%';
        healthText.style.color = 'white';
        healthText.style.fontFamily = 'Arial, sans-serif';
        healthText.style.fontSize = '12px';
        healthText.style.fontWeight = 'bold';
        healthText.style.textAlign = 'right';
        healthText.style.padding = '3px';
        
        healthBar.appendChild(healthText);
        
        healthContainer.appendChild(healthBar);
        document.body.appendChild(healthContainer);
    }
    
    updateHealthBar() {
        const healthBar = document.getElementById('health-bar');
        if (healthBar) {
            const healthPercentage = Math.round((this.playerHealth / 100) * 100);
            healthBar.style.width = `${healthPercentage}%`;
            healthBar.children[0].textContent = `Health: ${healthPercentage}%`;
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Calculate delta time
        const now = Date.now();
        const deltaTime = Math.min((now - this.lastFrame) / 1000, 0.1); // seconds, with cap to prevent huge jumps
        this.lastFrame = now;
        
        // Handle continuous firing when mouse is held down
        if (this.isMouseDown && this.playerMovementEnabled) {
            // Get weapon config
            const weaponConfig = this.weaponsConfig[this.currentWeapon];
            
            // Only fire if enough time has passed (based on fire rate)
            if (!this.lastFireTime || now - this.lastFireTime > weaponConfig.fireRate) {
                this.fireProjectile();
                this.lastFireTime = now;
            }
        }
        
        // Update game logic
        this.updatePlayerPosition(deltaTime);
        this.updateProjectiles(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateUpgrades(deltaTime);
        this.updateClones(deltaTime); // Add clone updates
        this.updateWaveTimer(); // Update the wave timer
        
        // Update controls if available
        if (this.controls) {
            this.controls.update();
        }
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    
    updatePlayerPosition(deltaTime) {
        if (!this.playerMovementEnabled || !this.player) return;
        
        // Apply movement based on key states
        if (this.keyStates.left) {
            this.player.position.x -= this.playerSpeed * deltaTime;
        }
        if (this.keyStates.right) {
            this.player.position.x += this.playerSpeed * deltaTime;
        }
        
        // Global movement boundaries that encompass both bridges
        // Main bridge is at x=0 with width 19.2
        // Allow movement only within the main bridge
        const leftmostBoundary = -9.6; // Left edge of main bridge
        const rightmostBoundary = 9.6;  // Right edge of main bridge
        
        // Simple boundary check - clamp to min/max values
        if (this.player.position.x < leftmostBoundary) {
            this.player.position.x = leftmostBoundary;
        }
        if (this.player.position.x > rightmostBoundary) {
            this.player.position.x = rightmostBoundary;
        }
    }
    
    updateEnemyCounter() {
        const counterDiv = document.getElementById('enemy-counter');
        if (counterDiv) {
            counterDiv.textContent = `Enemies: ${this.enemies.length}`;
        }
    }
    
    setupEventListeners() {
        console.log("Setting up event listeners");
        
        // Store bound event handlers for later removal
        this.boundKeyDown = (event) => {
            if (event.key.toLowerCase() === 'a') {
                this.keyStates.left = true;
            } else if (event.key.toLowerCase() === 'd') {
                this.keyStates.right = true;
            }
        };
        
        this.boundKeyUp = (event) => {
            if (event.key.toLowerCase() === 'a') {
                this.keyStates.left = false;
            } else if (event.key.toLowerCase() === 'd') {
                this.keyStates.right = false;
            }
        };
        
        this.boundMouseClick = () => {
            // Get weapon config
            const weaponConfig = this.weaponsConfig[this.currentWeapon];
            
            // Only fire if enough time has passed (based on fire rate)
            const now = Date.now();
            if (!this.lastFireTime || now - this.lastFireTime > weaponConfig.fireRate) {
                this.fireProjectile();
                this.lastFireTime = now;
            }
        };
        
        this.boundMouseDown = () => {
            // Set mouse button state
            this.isMouseDown = true;
        };
        
        this.boundMouseUp = () => {
            // Set mouse button state
            this.isMouseDown = false;
        };
        
        this.boundWindowResize = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };
        
        // Attach event listeners
        document.addEventListener('keydown', this.boundKeyDown);
        document.addEventListener('keyup', this.boundKeyUp);
        document.addEventListener('click', this.boundMouseClick);
        document.addEventListener('mousedown', this.boundMouseDown);
        document.addEventListener('mouseup', this.boundMouseUp);
        window.addEventListener('resize', this.boundWindowResize);
    }
    
    // New method to remove event listeners
    removeEventListeners() {
        if (this.boundKeyDown) {
            document.removeEventListener('keydown', this.boundKeyDown);
        }
        if (this.boundKeyUp) {
            document.removeEventListener('keyup', this.boundKeyUp);
        }
        if (this.boundMouseClick) {
            document.removeEventListener('click', this.boundMouseClick);
        }
        if (this.boundMouseDown) {
            document.removeEventListener('mousedown', this.boundMouseDown);
        }
        if (this.boundMouseUp) {
            document.removeEventListener('mouseup', this.boundMouseUp);
        }
        if (this.boundWindowResize) {
            window.removeEventListener('resize', this.boundWindowResize);
        }
    }
    
    // Add damage effect when enemy reaches the end
    createDamageEffect() {
        // Flash the screen red to indicate damage
        const damageOverlay = document.createElement('div');
        damageOverlay.style.position = 'absolute';
        damageOverlay.style.top = '0';
        damageOverlay.style.left = '0';
        damageOverlay.style.width = '100%';
        damageOverlay.style.height = '100%';
        damageOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        damageOverlay.style.pointerEvents = 'none';
        damageOverlay.style.zIndex = '200';
        document.body.appendChild(damageOverlay);
        
        // Remove the overlay after a short time
        setTimeout(() => {
            document.body.removeChild(damageOverlay);
        }, 200);
    }
    
    // Game over function
    gameOver() {
        // Stop the game
        this.playerMovementEnabled = false;
        
        // Create game over overlay
        const gameOverDiv = document.createElement('div');
        gameOverDiv.id = 'game-over';
        gameOverDiv.style.position = 'absolute';
        gameOverDiv.style.top = '50%';
        gameOverDiv.style.left = '50%';
        gameOverDiv.style.transform = 'translate(-50%, -50%)';
        gameOverDiv.style.padding = '30px';
        gameOverDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        gameOverDiv.style.color = 'white';
        gameOverDiv.style.fontFamily = 'Arial, sans-serif';
        gameOverDiv.style.fontSize = '32px';
        gameOverDiv.style.fontWeight = 'bold';
        gameOverDiv.style.borderRadius = '10px';
        gameOverDiv.style.zIndex = '1000';
        gameOverDiv.style.textAlign = 'center';
        
        // Display game over text with kill count and wave reached
        gameOverDiv.innerHTML = `
            <div>GAME OVER</div>
            <div style="font-size: 24px; margin-top: 10px;">Final Score: ${this.enemyKills} Kills</div>
            <div style="font-size: 20px; margin-top: 5px; color: #aa55ff;">Wave Reached: ${this.currentWave}</div>
            <div style="font-size: 18px; margin-top: 5px; color: #00aaff;">Clones Deployed: ${this.clones.length}</div>
        `;
        
        // Create restart button
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Play Again';
        restartButton.style.marginTop = '20px';
        restartButton.style.padding = '10px 20px';
        restartButton.style.fontSize = '20px';
        restartButton.style.backgroundColor = '#4CAF50';
        restartButton.style.color = 'white';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '5px';
        restartButton.style.cursor = 'pointer';
        
        // Add hover effect
        restartButton.onmouseover = function() {
            this.style.backgroundColor = '#45a049';
        };
        restartButton.onmouseout = function() {
            this.style.backgroundColor = '#4CAF50';
        };
        
        // Add click event to restart the game
        restartButton.onclick = () => {
            // Refresh the page instead of creating a new game instance
            window.location.reload();
        };
        
        gameOverDiv.appendChild(restartButton);
        document.body.appendChild(gameOverDiv);
        
        console.log("Game Over! Final score:", this.enemyKills, "Wave reached:", this.currentWave);
    }
    
    // Method to remove weapon selection buttons and other external UI elements
    cleanupExternalUI() {
        // 1. Remove weapon selection buttons (Rifle, Machine Gun, Bow)
        const allButtons = document.querySelectorAll('button, div[role="button"], a.button, .btn, [class*="button"]');
        allButtons.forEach(button => {
            const buttonText = button.textContent.trim().toLowerCase();
            if (buttonText === 'rifle' || buttonText === 'machine gun' || buttonText === 'bow') {
                button.remove();
            }
        });
        
        // 2. Remove any [1] label on the left
        const allLabels = document.querySelectorAll('div, span, label');
        allLabels.forEach(label => {
            const labelText = label.textContent.trim();
            if (labelText === '1' || labelText === '[1]') {
                label.remove();
            }
        });
        
        // 3. Remove "LAST WAR SURVIVAL" text box
        const allTextElements = document.querySelectorAll('div, h1, h2, h3, span, p');
        allTextElements.forEach(element => {
            const text = element.textContent.trim().toUpperCase();
            if (text.includes('LAST WAR SURVIVAL')) {
                element.remove();
            }
        });
        
        // 4. Special case for the [1] element in the screenshot - find by position
        const cornerElements = document.querySelectorAll('*');
        cornerElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            // Check if the element is in the top-left corner and is small
            if (rect.left < 70 && rect.top < 120 && rect.width < 70 && rect.height < 70) {
                const text = element.textContent.trim();
                // If it contains just a number or looks like a small label
                if (/^\d+$/.test(text) || text === '[1]') {
                    element.remove();
                }
            }
        });
    }
    
    // Create a wave indicator to show current difficulty
    createWaveIndicator() {
        const waveDiv = document.createElement('div');
        waveDiv.id = 'wave-indicator';
        waveDiv.style.position = 'absolute';
        waveDiv.style.top = '50px'; // Below the kill counter
        waveDiv.style.left = '50%';
        waveDiv.style.transform = 'translateX(-50%)';
        waveDiv.style.padding = '8px 15px';
        waveDiv.style.backgroundColor = 'rgba(150, 0, 200, 0.7)';
        waveDiv.style.color = 'white';
        waveDiv.style.fontFamily = 'Arial, sans-serif';
        waveDiv.style.fontSize = '18px';
        waveDiv.style.fontWeight = 'bold';
        waveDiv.style.borderRadius = '5px';
        waveDiv.style.zIndex = '100';
        waveDiv.style.transition = 'all 0.3s ease';
        document.body.appendChild(waveDiv);
        
        // Create wave countdown timer
        const timerDiv = document.createElement('div');
        timerDiv.id = 'wave-timer';
        timerDiv.style.position = 'absolute';
        timerDiv.style.top = '90px'; // Below the wave indicator
        timerDiv.style.left = '50%';
        timerDiv.style.transform = 'translateX(-50%)';
        timerDiv.style.padding = '5px 10px';
        timerDiv.style.backgroundColor = 'rgba(50, 50, 50, 0.7)';
        timerDiv.style.color = 'white';
        timerDiv.style.fontFamily = 'Arial, sans-serif';
        timerDiv.style.fontSize = '14px';
        timerDiv.style.fontWeight = 'bold';
        timerDiv.style.borderRadius = '3px';
        timerDiv.style.zIndex = '100';
        document.body.appendChild(timerDiv);
        
        this.updateWaveIndicator();
        this.updateWaveTimer();
    }
    
    updateWaveIndicator() {
        const waveDiv = document.getElementById('wave-indicator');
        if (waveDiv) {
            waveDiv.textContent = `Wave: ${this.currentWave}`;
            
            // Animate the wave indicator on update
            waveDiv.style.transform = 'translateX(-50%) scale(1.3)';
            waveDiv.style.backgroundColor = 'rgba(200, 50, 250, 0.9)';
            
            // Reset after animation
            setTimeout(() => {
                waveDiv.style.transform = 'translateX(-50%) scale(1)';
                waveDiv.style.backgroundColor = 'rgba(150, 0, 200, 0.7)';
            }, 300);
        }
    }
    
    // New method to update the wave countdown timer
    updateWaveTimer() {
        const timerDiv = document.getElementById('wave-timer');
        if (timerDiv) {
            const currentTime = Date.now();
            const elapsedTime = currentTime - this.lastWaveChangeTime;
            const remainingTime = Math.max(0, this.waveChangeTime - elapsedTime);
            const secondsRemaining = Math.ceil(remainingTime / 1000);
            
            // Update timer text
            timerDiv.textContent = `Next Wave: ${secondsRemaining}s`;
            
            // Change appearance as time gets low
            if (secondsRemaining <= 5) {
                timerDiv.style.backgroundColor = 'rgba(200, 50, 50, 0.8)';
                timerDiv.style.color = '#ffffff';
                
                // Pulse effect for last 5 seconds
                const pulseScale = 1 + (Math.sin(Date.now() / 100) + 1) * 0.1;
                timerDiv.style.transform = `translateX(-50%) scale(${pulseScale})`;
            } else if (secondsRemaining <= 10) {
                timerDiv.style.backgroundColor = 'rgba(200, 150, 50, 0.8)';
                timerDiv.style.color = '#ffffff';
                timerDiv.style.transform = 'translateX(-50%) scale(1)';
            } else {
                timerDiv.style.backgroundColor = 'rgba(50, 50, 50, 0.7)';
                timerDiv.style.color = 'white';
                timerDiv.style.transform = 'translateX(-50%) scale(1)';
            }
        }
    }
    
    // Create a banner to announce a new wave
    announceNewWave() {
        const bannerDiv = document.createElement('div');
        bannerDiv.style.position = 'absolute';
        bannerDiv.style.top = '40%';
        bannerDiv.style.left = '50%';
        bannerDiv.style.transform = 'translate(-50%, -50%) scale(0)';
        bannerDiv.style.padding = '20px 40px';
        bannerDiv.style.backgroundColor = 'rgba(100, 0, 150, 0.8)';
        bannerDiv.style.color = 'white';
        bannerDiv.style.fontFamily = 'Arial, sans-serif';
        bannerDiv.style.fontSize = '32px';
        bannerDiv.style.fontWeight = 'bold';
        bannerDiv.style.borderRadius = '10px';
        bannerDiv.style.zIndex = '200';
        bannerDiv.style.textAlign = 'center';
        bannerDiv.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        bannerDiv.style.boxShadow = '0 0 20px rgba(200, 100, 250, 0.5)';
        bannerDiv.textContent = `WAVE ${this.currentWave}`;
        
        document.body.appendChild(bannerDiv);
        
        // Animate in
        setTimeout(() => {
            bannerDiv.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
        
        // Animate out
        setTimeout(() => {
            bannerDiv.style.transform = 'translate(-50%, -50%) scale(0)';
            setTimeout(() => {
                document.body.removeChild(bannerDiv);
            }, 500);
        }, 2000);
    }
    
    // Create a banner to announce a boss
    announceBoss() {
        const bannerDiv = document.createElement('div');
        bannerDiv.style.position = 'absolute';
        bannerDiv.style.top = '40%';
        bannerDiv.style.left = '50%';
        bannerDiv.style.transform = 'translate(-50%, -50%) scale(0)';
        bannerDiv.style.padding = '30px 50px';
        bannerDiv.style.backgroundColor = 'rgba(200, 0, 0, 0.8)';
        bannerDiv.style.color = 'white';
        bannerDiv.style.fontFamily = 'Arial, sans-serif';
        bannerDiv.style.fontSize = '40px';
        bannerDiv.style.fontWeight = 'bold';
        bannerDiv.style.borderRadius = '10px';
        bannerDiv.style.zIndex = '200';
        bannerDiv.style.textAlign = 'center';
        bannerDiv.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        bannerDiv.style.boxShadow = '0 0 30px rgba(255, 0, 0, 0.7)';
        bannerDiv.innerHTML = `⚠ BOSS INCOMING ⚠<br><span style="font-size: 24px; opacity: 0.9;">Prepare yourself!</span>`;
        
        document.body.appendChild(bannerDiv);
        
        // Add warning sound effect here if audio is implemented
        
        // Animate in with pulsing
        setTimeout(() => {
            bannerDiv.style.transform = 'translate(-50%, -50%) scale(1)';
            
            // Add pulsing animation
            let scale = 1;
            const pulseInterval = setInterval(() => {
                scale = scale === 1 ? 1.05 : 1;
                bannerDiv.style.transform = `translate(-50%, -50%) scale(${scale})`;
            }, 300);
            
            // Clear interval after banner removal
            setTimeout(() => {
                clearInterval(pulseInterval);
            }, 3000);
        }, 10);
        
        // Animate out
        setTimeout(() => {
            bannerDiv.style.transform = 'translate(-50%, -50%) scale(0)';
            setTimeout(() => {
                document.body.removeChild(bannerDiv);
            }, 600);
        }, 3000);
    }
    
    // New method to create screen shake effect for explosions
    createScreenShake(intensity, duration) {
        const camera = this.camera;
        const originalPosition = camera.position.clone();
        const startTime = Date.now();
        
        const shakeCamera = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Calculate decreasing intensity as effect progresses
                const currentIntensity = intensity * (1 - progress);
                
                // Apply random offset to camera
                camera.position.set(
                    originalPosition.x + (Math.random() - 0.5) * currentIntensity,
                    originalPosition.y + (Math.random() - 0.5) * currentIntensity,
                    originalPosition.z + (Math.random() - 0.5) * currentIntensity
                );
                
                requestAnimationFrame(shakeCamera);
            } else {
                // Reset camera position
                camera.position.copy(originalPosition);
            }
        };
        
        shakeCamera();
    }
    
    // New method for creating clone model
    createCloneModel() {
        const cloneGroup = new THREE.Group();
        
        // Base (holographic platform)
        const baseGeometry = new THREE.CylinderGeometry(0.5, 0.6, 0.1, 12);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7,
            emissive: 0x00aaff,
            emissiveIntensity: 0.8
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        cloneGroup.add(base);
        
        // Clone icon (mini player figure)
        const iconGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const iconMaterial = new THREE.MeshStandardMaterial({
            color: 0x22aaff,
            emissive: 0x0066cc,
            emissiveIntensity: 0.7
        });
        const icon = new THREE.Mesh(iconGeometry, iconMaterial);
        icon.position.y = 0.3;
        cloneGroup.add(icon);
        
        // Orbiting particle effect
        for (let i = 0; i < 3; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.06, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.9
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position in orbit
            const angle = (i / 3) * Math.PI * 2;
            particle.position.set(
                Math.cos(angle) * 0.5,
                0.3,
                Math.sin(angle) * 0.5
            );
            
            // Store animation data
            particle.userData = {
                orbit: {
                    angle: angle,
                    radius: 0.5,
                    speed: 3 + Math.random()
                }
            };
            
            cloneGroup.add(particle);
        }
        
        // Add glow
        const glowGeometry = new THREE.SphereGeometry(0.6, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ddff,
            transparent: true,
            opacity: 0.4
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 0.2;
        cloneGroup.add(glow);
        
        return cloneGroup;
    }
    
    // New method to spawn a player clone
    spawnPlayerClone() {
        if (this.clones.length >= this.maxClones) return; // Limit number of clones
        
        // Create a smaller version of the player model (penguin)
        const cloneGroup = new THREE.Group();
        
        // Body - using sphere for penguin's round body
        const bodyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        bodyGeometry.scale(1, 1.3, 0.8); // Make oval shaped like a penguin body
        
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222, // Dark black for penguin back
            roughness: 0.7,
            metalness: 0.1
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5; // Position above bridge
        body.castShadow = true;
        cloneGroup.add(body);
        
        // White belly (front part)
        const bellyGeometry = new THREE.SphereGeometry(0.48, 16, 16, 0, Math.PI, 0, Math.PI);
        const bellyMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF, // White belly
            roughness: 0.8,
            metalness: 0.1
        });
        
        const belly = new THREE.Mesh(bellyGeometry, bellyMaterial);
        belly.rotation.y = 0; // Face backward
        belly.position.set(0, 0.5, -0.05);
        cloneGroup.add(belly);
        
        // Head (round black with white face)
        const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222, // Black like the body
            roughness: 0.7,
            metalness: 0.1
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 1.15, 0); // Position above body
        head.castShadow = true;
        cloneGroup.add(head);
        
        // White face patch
        const faceGeometry = new THREE.SphereGeometry(0.32, 16, 16, 0, Math.PI, 0, Math.PI);
        const faceMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        face.rotation.y = 0; // Face backward
        face.position.set(0, 1.15, -0.05);
        cloneGroup.add(face);
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.06, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            roughness: 0.3,
            metalness: 0.5
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.12, 1.22, -0.28);
        cloneGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.12, 1.22, -0.28);
        cloneGroup.add(rightEye);
        
        // Beak
        const beakGeometry = new THREE.ConeGeometry(0.07, 0.25, 8);
        const beakMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFA500, // Orange beak
            roughness: 0.5,
            metalness: 0.3,
            emissive: 0x994400,
            emissiveIntensity: 0.2
        });
        
        const beak = new THREE.Mesh(beakGeometry, beakMaterial);
        beak.rotation.x = -Math.PI / 2; // Point backward
        beak.position.set(0, 1.15, -0.35);
        cloneGroup.add(beak);
        
        // Flippers (instead of arms)
        const flipperGeometry = new THREE.BoxGeometry(0.12, 0.5, 0.2);
        
        const flipperMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222, // Black like the body
            roughness: 0.7,
            metalness: 0.1
        });
        
        const leftFlipper = new THREE.Mesh(flipperGeometry, flipperMaterial);
        leftFlipper.position.set(-0.5, 0.5, 0);
        leftFlipper.rotation.z = -Math.PI / 8;
        leftFlipper.rotation.y = Math.PI / 6;
        leftFlipper.castShadow = true;
        cloneGroup.add(leftFlipper);
        
        const rightFlipper = new THREE.Mesh(flipperGeometry, flipperMaterial);
        rightFlipper.position.set(0.5, 0.5, 0);
        rightFlipper.rotation.z = Math.PI / 8;
        rightFlipper.rotation.y = -Math.PI / 6;
        rightFlipper.castShadow = true;
        cloneGroup.add(rightFlipper);
        
        // Feet
        const footGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.3);
        const footMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFA500, // Orange feet
            roughness: 0.5,
            metalness: 0.3,
            emissive: 0x994400,
            emissiveIntensity: 0.2
        });
        
        const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
        leftFoot.position.set(-0.15, -0.4, -0.1);
        leftFoot.rotation.x = -Math.PI / 12;
        cloneGroup.add(leftFoot);
        
        const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
        rightFoot.position.set(0.15, -0.4, -0.1);
        rightFoot.rotation.x = -Math.PI / 12;
        cloneGroup.add(rightFoot);
        
        // Add blue circle under clone
        const circleGeometry = new THREE.CircleGeometry(0.8, 32);
        const circleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00aaff,
            transparent: true,
            opacity: 0.7
        });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.rotation.x = -Math.PI / 2;
        circle.position.y = -0.5;
        cloneGroup.add(circle);
        
        // Determine position - alternate between left and right sides
        const side = this.clones.length % 2 === 0 ? 1 : -1;
        const offset = 1.5 + Math.floor(this.clones.length / 2) * 1.0;
        
        // Set clone position relative to player
        cloneGroup.position.copy(this.player.position);
        cloneGroup.position.x += side * offset;
        cloneGroup.position.y = this.player.position.y - 0.2; // Slightly lower
        
        // Scale down the clone
        cloneGroup.scale.set(0.7, 0.7, 0.7);
        
        // Store reference to the clone for updates
        cloneGroup.userData = {
            type: 'clone',
            side: side,
            offset: offset
        };
        
        this.scene.add(cloneGroup);
        this.clones.push(cloneGroup);
        
        // Create spawn effect
        this.createCloneSpawnEffect(cloneGroup.position);
        
        console.log(`Spawned player clone at position:`, cloneGroup.position);
        
        // Add counter display if this is the first clone
        if (this.clones.length === 1) {
            this.createCloneCounter();
        } else {
            this.updateCloneCounter();
        }
    }
    
    // New method to create spawn effect for clones
    createCloneSpawnEffect(position) {
        // Create spawn effect (blue/cyan energy rings)
        const ringsCount = 5;
        const rings = new THREE.Group();
        
        for (let i = 0; i < ringsCount; i++) {
            const ringGeometry = new THREE.RingGeometry(0.5, 0.6, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.copy(position);
            ring.rotation.x = Math.PI / 2;
            ring.scale.set(0.1, 0.1, 0.1);
            ring.userData = {
                delay: i * 80,
                startTime: Date.now()
            };
            
            rings.add(ring);
        }
        
        this.scene.add(rings);
        
        // Animate rings
        const duration = 600;
        
        const animateRings = () => {
            let allComplete = true;
            
            rings.children.forEach(ring => {
                const elapsed = Date.now() - ring.userData.startTime - ring.userData.delay;
                
                if (elapsed > 0 && elapsed < duration) {
                    allComplete = false;
                    const progress = elapsed / duration;
                    const scale = progress * 3;
                    const opacity = 1 - progress;
                    
                    ring.scale.set(scale, scale, scale);
                    ring.material.opacity = opacity;
                }
                else if (elapsed <= 0) {
                    allComplete = false;
                }
            });
            
            if (!allComplete) {
                requestAnimationFrame(animateRings);
            } else {
                this.scene.remove(rings);
            }
        };
        
        animateRings();
    }
    
    // New method to create a clone counter
    createCloneCounter() {
        const counterDiv = document.createElement('div');
        counterDiv.id = 'clone-counter';
        counterDiv.style.position = 'absolute';
        counterDiv.style.top = '50px';
        counterDiv.style.right = '10px';
        counterDiv.style.padding = '8px 15px';
        counterDiv.style.backgroundColor = 'rgba(0, 150, 255, 0.7)';
        counterDiv.style.color = 'white';
        counterDiv.style.fontFamily = 'Arial, sans-serif';
        counterDiv.style.fontSize = '16px';
        counterDiv.style.fontWeight = 'bold';
        counterDiv.style.borderRadius = '5px';
        counterDiv.style.zIndex = '100';
        document.body.appendChild(counterDiv);
        
        this.updateCloneCounter();
    }
    
    // New method to update the clone counter
    updateCloneCounter() {
        const counterDiv = document.getElementById('clone-counter');
        if (counterDiv) {
            counterDiv.textContent = `Clones: ${this.clones.length}/${this.maxClones}`;
        }
    }
    
    // Update method to handle clones
    updateClones(deltaTime) {
        // Update each clone
        for (let i = this.clones.length - 1; i >= 0; i--) {
            const clone = this.clones[i];
            
            // Update clone position relative to player
            clone.position.copy(this.player.position);
            clone.position.x += clone.userData.side * clone.userData.offset;
            clone.position.y = this.player.position.y - 0.2; // Slightly lower
            
            // Update connection beam
            if (clone.userData.connectionBeam) {
                // Calculate distance to player
                const distance = Math.abs(clone.userData.side * clone.userData.offset);
                
                // Update beam size and position
                clone.userData.connectionBeam.scale.z = distance;
                clone.userData.connectionBeam.position.x = -clone.userData.side * distance/2;
                
                // Pulse effect
                const pulseIntensity = (Math.sin(this.clock.getElapsedTime() * 5) + 1) / 2;
                clone.userData.connectionBeam.material.opacity = 0.2 + pulseIntensity * 0.3;
            }
        }
        
        // Update clone counter if needed
        if (this.clones.length > 0) {
            this.updateCloneCounter();
        }
    }
} 