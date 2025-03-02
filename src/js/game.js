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
        
        // Game objects
        this.bridge = null;
        this.upgradeLane = null;
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.trees = [];
        this.upgrades = [];
        
        // Game settings
        this.enemyKills = 0; // Track enemy kills
        this.playerHealth = 100; // Initialize player health
        this.currentWeapon = 'basic'; // Default weapon
        this.gameSpeed = 1.5; // Increased overall game speed
        this.enemySpawnRate = 800; // Increased spawn rate (ms)
        this.upgradeSpawnRate = 5000; // ms
        this.lastSpawnTime = 0;
        this.lastUpgradeTime = 0;
        this.playerMovementEnabled = true;
        
        // Player movement
        this.keyStates = {
            left: false,  // A key
            right: false  // D key
        };
        this.playerSpeed = 15; // Faster player movement
        
        // Store bound event handlers for later removal
        this.boundKeyDown = null;
        this.boundKeyUp = null;
        this.boundMouseClick = null;
        this.boundWindowResize = null;
        
        // Weapons config
        this.weaponsConfig = {
            basic: {
                model: null,
                projectileColor: 0xffff00,
                projectileSpeed: 40,
                damage: 1,
                fireRate: 300,
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
                damage: 3,
                fireRate: 800,
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
        this.createUpgradeLane();
        
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
        const bridgeWidth = 10;
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
    
    createUpgradeLane() {
        // Create a smaller lane for upgrades next to the main bridge
        const laneWidth = 4;
        const laneLength = 60;
        
        // Lane base (floor)
        const laneGeometry = new THREE.BoxGeometry(laneWidth, 0.5, laneLength);
        const laneMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xBBDDFF, // Light blue for contrast
            roughness: 0.7,
            metalness: 0.3
        });
        
        this.upgradeLane = new THREE.Mesh(laneGeometry, laneMaterial);
        this.upgradeLane.position.set(-8, -0.25, -20); // Positioned to the left of main bridge
        this.upgradeLane.receiveShadow = true;
        this.scene.add(this.upgradeLane);
        
        // Lane walls
        const wallHeight = 1;
        const wallGeometry = new THREE.BoxGeometry(0.5, wallHeight, laneLength);
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x6699CC,
            roughness: 0.8,
            metalness: 0.3
        });
        
        // Left wall
        const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
        leftWall.position.set(-8 - laneWidth/2, wallHeight/2, -20);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);
        
        // Right wall
        const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
        rightWall.position.set(-8 + laneWidth/2, wallHeight/2, -20);
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
        
        // Create a more visible player character
        const playerGroup = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3498db, // Blue color
            roughness: 0.7,
            metalness: 0.3,
            emissive: 0x1a4c72,
            emissiveIntensity: 0.6 // Increased emissive intensity further
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5; // Position above bridge
        body.castShadow = true;
        playerGroup.add(body);
        
        // Head (helmet)
        const helmetGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const helmetMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0077ff,
            emissive: 0x003366,
            emissiveIntensity: 0.8 // Increased emissive intensity further
        });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.set(0, 1.2, 0);
        helmet.castShadow = true;
        playerGroup.add(helmet);
        
        // Arms
        const armGeometry = new THREE.CapsuleGeometry(0.2, 0.6, 4, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3498db,
            emissive: 0x1a4c72,
            emissiveIntensity: 0.6
        });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.5, 0.5, 0);
        leftArm.rotation.z = -Math.PI / 4;
        leftArm.castShadow = true;
        playerGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.5, 0.5, 0);
        rightArm.rotation.z = Math.PI / 4;
        rightArm.castShadow = true;
        playerGroup.add(rightArm);
        
        // Add green circle under player
        const circleGeometry = new THREE.CircleGeometry(1, 32);
        const circleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.9 // Increased opacity even more
        });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.rotation.x = -Math.PI / 2; // Make it horizontal
        circle.position.y = -0.5;
        playerGroup.add(circle);
        
        // Set player position - moved to be visible in the red area
        playerGroup.position.set(0, 1.5, 5); // Position in front of the camera
        // Set scale to 1 to make player same size as enemies
        
        this.player = playerGroup;
        this.scene.add(this.player);
        
        console.log("Player character created at position:", this.player.position);
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
    
    spawnEnemy() {
        console.log("Spawning enemy");
        
        // Create enemy group
        const enemyGroup = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xe74c3c, // Red color
            roughness: 0.7,
            metalness: 0.3,
            emissive: 0x992d22,
            emissiveIntensity: 0.5 // Increased glow
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        body.castShadow = true;
        enemyGroup.add(body);
        
        // Head (hat)
        const hatGeometry = new THREE.CylinderGeometry(0.2, 0.4, 0.4, 8);
        const hatMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            emissive: 0xaa0000,
            emissiveIntensity: 0.6
        });
        const hat = new THREE.Mesh(hatGeometry, hatMaterial);
        hat.position.set(0, 1.2, 0);
        hat.castShadow = true;
        enemyGroup.add(hat);
        
        // Arms
        const armGeometry = new THREE.CapsuleGeometry(0.2, 0.6, 4, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xe74c3c,
            emissive: 0xaa0000,
            emissiveIntensity: 0.3
        });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.5, 0.5, 0);
        leftArm.rotation.z = -Math.PI / 4;
        leftArm.castShadow = true;
        enemyGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.5, 0.5, 0);
        rightArm.rotation.z = Math.PI / 4;
        rightArm.castShadow = true;
        enemyGroup.add(rightArm);
        
        // Randomize position across the bridge width
        const xPos = (Math.random() - 0.5) * 8; // Spread across bridge width
        enemyGroup.position.set(xPos, 1, -50); // Far end of the bridge
        
        // Store enemy properties - 3x faster
        enemyGroup.userData = {
            speed: 0.24 + Math.random() * 0.12, // 3x faster enemies
            health: 1,
            type: 'enemy'
        };
        
        this.scene.add(enemyGroup);
        this.enemies.push(enemyGroup);
        
        // Update enemy counter
        this.updateEnemyCounter();
        
        console.log("Enemy spawned at position:", enemyGroup.position);
    }
    
    spawnUpgrade() {
        const upgradeTypes = ['laser', 'rocket', 'basic', 'healthkit']; // Add healthkit to possible upgrades
        const upgradeType = upgradeTypes[Math.floor(Math.random() * upgradeTypes.length)];
        
        // Create upgrade group
        const upgradeGroup = new THREE.Group();
        
        // Create base platform
        const baseGeometry = new THREE.BoxGeometry(1.5, 0.2, 1.5);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: upgradeType === 'healthkit' ? 0xff4444 : 0x44aaff,
            emissive: upgradeType === 'healthkit' ? 0xcc2222 : 0x0066cc,
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
            color: upgradeType === 'healthkit' ? 0xff6666 : 0x66ccff,
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
        const xPos = -8; // Center of upgrade lane
        upgradeGroup.position.set(xPos, 1, -50); // Far end of the lane
        
        // Store upgrade type
        upgradeGroup.userData = {
            type: 'upgrade',
            upgradeType: upgradeType,
            speed: 0.15 + Math.random() * 0.05
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
        
        // Create projectile based on weapon type
        const projectileGeometry = this.currentWeapon === 'rocket' 
            ? new THREE.CylinderGeometry(0.15, 0.3, 0.8, 8)
            : new THREE.SphereGeometry(0.3, 12, 12);
            
        const projectileMaterial = new THREE.MeshBasicMaterial({ 
            color: weaponConfig.projectileColor,
            emissive: weaponConfig.projectileColor,
            emissiveIntensity: 2.0
        });
        
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        
        // Orient rocket projectiles
        if (this.currentWeapon === 'rocket') {
            projectile.rotation.x = Math.PI / 2;
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
        
        // Add glow effect appropriate for the weapon
        const glowGeometry = new THREE.SphereGeometry(0.7, 12, 12);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: weaponConfig.glowColor,
            transparent: true,
            opacity: 0.9
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        projectile.add(glow);
        
        // Add trail effect
        let trailGeometry;
        
        if (this.currentWeapon === 'laser') {
            // Thin, long laser beam
            trailGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 8);
        } else if (this.currentWeapon === 'rocket') {
            // Rocket exhaust
            trailGeometry = new THREE.ConeGeometry(0.3, 2, 8);
        } else {
            // Default trail
            trailGeometry = new THREE.CylinderGeometry(0.1, 0.2, 2.5, 8);
        }
        
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: weaponConfig.trailColor,
            transparent: true,
            opacity: 0.7
        });
        
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.rotation.x = Math.PI / 2; // Orient along path
        trail.position.z = 1.2; // Position behind the projectile
        projectile.add(trail);
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
            
            // Check collisions with enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const distance = projectile.position.distanceTo(enemy.position);
                
                // Different hit radius based on weapon type
                const hitRadius = projectile.userData.weaponType === 'rocket' ? 2 : 1;
                
                if (distance < hitRadius) { // Hit radius
                    // Create hit effect
                    this.createHitEffect(projectile.position, projectile.userData.weaponType);
                    
                    // Damage enemy
                    enemy.userData.health -= projectile.userData.damage;
                    
                    // Remove projectile (except laser which can pierce through)
                    if (projectile.userData.weaponType !== 'laser') {
                        this.scene.remove(projectile);
                        this.projectiles.splice(i, 1);
                    }
                    
                    // Remove enemy if dead
                    if (enemy.userData.health <= 0) {
                        this.scene.remove(enemy);
                        this.enemies.splice(j, 1);
                        
                        // Increment kill counter
                        this.enemyKills++;
                        this.updateKillCounter();
                    }
                    
                    // Break loop if projectile was removed
                    if (projectile.userData.weaponType !== 'laser') {
                        break;
                    }
                }
            }
        }
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
                this.playerHealth = Math.max(0, this.playerHealth - 5); // Change to 5 damage and prevent negative values
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
        
        // Spawn new enemies based on time, with occasional wave spawns
        const currentTime = Date.now();
        if (currentTime - this.lastSpawnTime > this.enemySpawnRate) {
            // Random chance for a wave of enemies (3-5)
            if (Math.random() < 0.3) {
                const waveSize = Math.floor(Math.random() * 3) + 3;
                for (let i = 0; i < waveSize; i++) {
                    this.spawnEnemy();
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
            this.spawnUpgrade();
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
                particleColors = [0xff3300, 0xffaa00];
                size = 2.0;
                duration = 300;
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
        const particleCount = weaponType === 'rocket' ? 20 : 10;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeom = new THREE.SphereGeometry(0.15, 8, 8);
            const particleMat = new THREE.MeshBasicMaterial({
                color: particleColors[Math.floor(Math.random() * particleColors.length)],
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(particleGeom, particleMat);
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * (weaponType === 'rocket' ? 1.5 : 0.8);
            particle.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                Math.sin(angle * 2) * radius
            );
            
            const speed = weaponType === 'rocket' ? 0.08 : 0.05;
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
            const scale = 1 + progress * (weaponType === 'rocket' ? 6 : 4);
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
        
        // Update game logic
        this.updatePlayerPosition(deltaTime);
        this.updateProjectiles(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateUpgrades(deltaTime);
        
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
        // Main bridge is at x=0 with width 10
        // Upgrade lane is at x=-8 with width 4
        // Allow movement across the entire range
        const leftmostBoundary = -10; // Left edge of upgrade lane
        const rightmostBoundary = 5;  // Right edge of main bridge
        
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
        
        this.boundWindowResize = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };
        
        // Attach event listeners
        document.addEventListener('keydown', this.boundKeyDown);
        document.addEventListener('keyup', this.boundKeyUp);
        document.addEventListener('click', this.boundMouseClick);
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
        
        // Display game over text with kill count
        gameOverDiv.innerHTML = `
            <div>GAME OVER</div>
            <div style="font-size: 24px; margin-top: 10px;">Final Score: ${this.enemyKills} Kills</div>
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
            // Remove game over screen
            document.body.removeChild(gameOverDiv);
            
            // Remove all existing UI elements
            const uiElements = ['kill-counter', 'health-container', 'enemy-counter'];
            uiElements.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.remove();
                }
            });
            
            // Remove event listeners to prevent duplicates
            this.removeEventListeners();
            
            // Remove renderer
            if (this.renderer) {
                document.body.removeChild(this.renderer.domElement);
            }
            
            // Create a new game
            window.game = new Game();
        };
        
        gameOverDiv.appendChild(restartButton);
        document.body.appendChild(gameOverDiv);
        
        console.log("Game Over! Final score:", this.enemyKills);
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
} 