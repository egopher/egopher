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
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.trees = [];
        
        // Game settings
        this.scores = { blue: 178, red: 157 };
        this.selectedWeapon = 'rifle';
        this.gameSpeed = 1;
        this.enemySpawnRate = 2000; // ms
        this.lastSpawnTime = 0;
        this.playerMovementEnabled = true;
        
        // Player movement
        this.keyStates = {
            left: false,  // A key
            right: false  // D key
        };
        this.playerSpeed = 10;
        
        // Initialize the scene
        this.initScene();
        this.setupEventListeners();
        
        // Start game loop
        this.lastFrame = Date.now();
        this.animate();
        
        // Initial enemy spawn
        this.spawnEnemy();
        this.spawnEnemy();
        this.spawnEnemy();
        
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
        
        // Create bridge
        this.createBridge();
        
        // Create player
        this.createPlayer();
        
        // Create snowy forest environment
        this.createEnvironment();
        
        // Update scoreboard
        this.updateScoreDisplay();
        
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
            emissiveIntensity: 0.2
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
            emissiveIntensity: 0.3
        });
        const hat = new THREE.Mesh(hatGeometry, hatMaterial);
        hat.position.set(0, 1.2, 0);
        hat.castShadow = true;
        enemyGroup.add(hat);
        
        // Arms
        const armGeometry = new THREE.CapsuleGeometry(0.2, 0.6, 4, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
        
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
        
        // Store enemy properties
        enemyGroup.userData = {
            speed: 0.05 + Math.random() * 0.03,
            health: 1,
            type: 'enemy'
        };
        
        this.scene.add(enemyGroup);
        this.enemies.push(enemyGroup);
        
        console.log("Enemy spawned at position:", enemyGroup.position);
    }
    
    fireProjectile() {
        const projectileGeometry = new THREE.SphereGeometry(0.3, 12, 12); // Slightly larger projectile
        const projectileMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            emissive: 0xffcc00,
            emissiveIntensity: 1.5
        });
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        
        // Start position at player
        projectile.position.copy(this.player.position);
        projectile.position.y = this.player.position.y; // Match player height
        
        // Store projectile properties
        projectile.userData = {
            velocity: new THREE.Vector3(0, 0, -25), // 10x faster projectiles
            damage: 1,
            life: 1000 // Less lifetime since it travels faster
        };
        
        this.scene.add(projectile);
        this.projectiles.push(projectile);
        
        // Add a more intense glow effect
        const glowGeometry = new THREE.SphereGeometry(0.6, 12, 12);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff88,
            transparent: true,
            opacity: 0.8
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        projectile.add(glow);
        
        // Add trail effect
        const trailGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.6
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.rotation.x = Math.PI / 2; // Orient along path
        trail.position.z = 0.8; // Position behind the projectile
        projectile.add(trail);
    }
    
    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Keyboard controls for player movement (A and D keys)
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'a') {
                this.keyStates.left = true;
            } else if (e.key.toLowerCase() === 'd') {
                this.keyStates.right = true;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key.toLowerCase() === 'a') {
                this.keyStates.left = false;
            } else if (e.key.toLowerCase() === 'd') {
                this.keyStates.right = false;
            }
        });
        
        // Mouse click to fire
        document.addEventListener('click', () => {
            this.fireProjectile();
        });
        
        // Handle weapon selection
        document.querySelectorAll('.power-up').forEach(powerUp => {
            powerUp.addEventListener('click', (e) => {
                const weaponId = e.target.id;
                this.selectWeapon(weaponId);
                
                // Update UI
                document.querySelectorAll('.power-up').forEach(el => {
                    el.classList.remove('active');
                });
                e.target.classList.add('active');
                
                e.stopPropagation(); // Don't fire a projectile when selecting weapon
            });
        });
    }
    
    selectWeapon(weaponId) {
        this.selectedWeapon = weaponId;
        console.log(`Selected weapon: ${weaponId}`);
        
        // Change projectile properties based on weapon
        switch(weaponId) {
            case 'rifle':
                this.projectileConfig = {
                    color: 0xffff00,
                    speed: 25,
                    rate: 300,
                    damage: 1
                };
                break;
            case 'machine-gun':
                this.projectileConfig = {
                    color: 0xff4400,
                    speed: 30,
                    rate: 100,
                    damage: 0.5
                };
                break;
            case 'bow':
                this.projectileConfig = {
                    color: 0x00ffff,
                    speed: 20,
                    rate: 600,
                    damage: 2
                };
                break;
        }
    }
    
    updatePlayerPosition(deltaTime) {
        if (!this.playerMovementEnabled || !this.player) return;
        
        // Bridge boundaries
        const bridgeWidth = 8;
        const boundaryX = bridgeWidth / 2 - 0.5; // Allow player to move almost to the edge
        
        // Apply movement based on key states
        if (this.keyStates.left) {
            this.player.position.x -= this.playerSpeed * deltaTime;
        }
        if (this.keyStates.right) {
            this.player.position.x += this.playerSpeed * deltaTime;
        }
        
        // Clamp position to bridge boundaries
        if (this.player.position.x < -boundaryX) {
            this.player.position.x = -boundaryX;
        }
        if (this.player.position.x > boundaryX) {
            this.player.position.x = boundaryX;
        }
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
                
                if (distance < 1) { // Hit radius
                    // Create hit effect
                    this.createHitEffect(projectile.position);
                    
                    // Damage enemy
                    enemy.userData.health -= projectile.userData.damage;
                    
                    // Remove projectile
                    this.scene.remove(projectile);
                    this.projectiles.splice(i, 1);
                    
                    // Remove enemy if dead
                    if (enemy.userData.health <= 0) {
                        this.scene.remove(enemy);
                        this.enemies.splice(j, 1);
                        
                        // Update score
                        this.scores.blue += 1;
                        this.updateScoreDisplay();
                    }
                    
                    break;
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
            
            // Move enemy toward player - use a higher speed to make movement more noticeable
            const moveAmount = enemy.userData.speed * deltaTime * this.gameSpeed * 10;
            enemy.position.z += moveAmount;
            
            console.log(`Enemy ${i} moved by ${moveAmount} to position:`, enemy.position);
            
            // Remove if past player - adjusted to match new player position
            if (enemy.position.z > 7) { // Changed to match new player position
                this.scene.remove(enemy);
                this.enemies.splice(i, 1);
                
                // Update score - enemy got through
                this.scores.red += 1;
                this.updateScoreDisplay();
                console.log("Enemy reached end of bridge, removed");
            }
        }
        
        // Spawn new enemies based on time
        const currentTime = Date.now();
        if (currentTime - this.lastSpawnTime > this.enemySpawnRate) {
            this.spawnEnemy();
            this.lastSpawnTime = currentTime;
        }
    }
    
    createHitEffect(position) {
        // Create a more dramatic explosion effect
        const explosionGeometry = new THREE.SphereGeometry(0.7, 12, 12);
        const explosionMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffaa00,
            transparent: true,
            opacity: 0.9
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        this.scene.add(explosion);
        
        // Add a secondary glow for more impact
        const glowGeometry = new THREE.SphereGeometry(1.2, 12, 12);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff5500,
            transparent: true,
            opacity: 0.5
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        explosion.add(glow);
        
        // Animate and remove
        const startTime = Date.now();
        const duration = 200; // Faster animation for more intense feel
        
        const animateExplosion = () => {
            const elapsed = Date.now() - startTime;
            const scale = 1 + (elapsed / duration) * 3;
            const opacity = 1 - (elapsed / duration);
            
            explosion.scale.set(scale, scale, scale);
            explosionMaterial.opacity = opacity;
            glowMaterial.opacity = opacity * 0.5;
            
            if (elapsed < duration) {
                requestAnimationFrame(animateExplosion);
            } else {
                this.scene.remove(explosion);
            }
        };
        
        animateExplosion();
    }
    
    updateScoreDisplay() {
        // Empty function - removed score display
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
        
        // Update controls if available
        if (this.controls) {
            this.controls.update();
        }
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
} 