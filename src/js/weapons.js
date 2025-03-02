/**
 * Weapons system for the game
 */

class Weapon {
    constructor(type, damage, fireRate, projectileSpeed, range) {
        this.type = type;
        this.damage = damage;
        this.fireRate = fireRate; // shots per second
        this.projectileSpeed = projectileSpeed;
        this.range = range;
        this.lastFired = 0;
        this.model = null;
        this.projectiles = [];
    }
    
    canFire(currentTime) {
        return currentTime - this.lastFired > 1000 / this.fireRate;
    }
    
    fire(position, direction, currentTime, scene, models) {
        if (!this.canFire(currentTime)) return null;
        
        this.lastFired = currentTime;
        
        // Create projectile
        const projectile = models.createProjectile(this.type);
        projectile.position.copy(position);
        
        // Add properties to the projectile
        projectile.userData = {
            type: this.type,
            damage: this.damage,
            speed: this.projectileSpeed,
            direction: direction.clone().normalize(),
            distance: 0,
            maxDistance: this.range,
            createdAt: currentTime
        };
        
        // Add to scene and track
        scene.add(projectile);
        this.projectiles.push(projectile);
        
        // Add muzzle flash effect
        this.createMuzzleFlash(position, scene);
        
        return projectile;
    }
    
    createMuzzleFlash(position, scene) {
        // Create a point light for muzzle flash
        const light = new THREE.PointLight(0xffaa00, 3, 3);
        light.position.copy(position);
        scene.add(light);
        
        // Remove the light after a short time
        setTimeout(() => {
            scene.remove(light);
        }, 50);
    }
    
    update(deltaTime, scene) {
        // Update all projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const userData = projectile.userData;
            
            // Move projectile
            const moveAmount = userData.speed * deltaTime;
            projectile.position.add(
                userData.direction.clone().multiplyScalar(moveAmount)
            );
            
            // Update distance traveled
            userData.distance += moveAmount;
            
            // Remove if it's gone too far
            if (userData.distance > userData.maxDistance) {
                scene.remove(projectile);
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    getProjectiles() {
        return this.projectiles;
    }
    
    clearProjectiles(scene) {
        for (const projectile of this.projectiles) {
            scene.remove(projectile);
        }
        this.projectiles = [];
    }
}

class WeaponFactory {
    static createWeapon(type) {
        switch (type) {
            case 'rifle':
                return new Weapon('rifle', 10, 1, 15, 30);
            case 'machine-gun':
                return new Weapon('machine-gun', 5, 8, 20, 25);
            case 'bow':
                return new Weapon('bow', 15, 0.5, 10, 40);
            default:
                return new Weapon('rifle', 10, 1, 15, 30);
        }
    }
}

class PowerUp {
    constructor(type, position, scene, models) {
        this.type = type;
        this.position = position;
        this.scene = scene;
        this.models = models;
        this.mesh = null;
        this.createMesh();
    }
    
    createMesh() {
        // Create a base for the power-up
        const baseGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x3498db });
        this.mesh = new THREE.Mesh(baseGeometry, baseMaterial);
        this.mesh.position.copy(this.position);
        this.mesh.position.y = 0.05;
        
        // Add the weapon model on top
        const weaponModel = this.models.createWeaponModel(this.type);
        weaponModel.position.y = 0.3;
        weaponModel.scale.set(1.5, 1.5, 1.5);
        this.mesh.add(weaponModel);
        
        // Add a rotating light effect
        const light = new THREE.PointLight(0x3498db, 1, 3);
        light.position.set(0, 0.5, 0);
        this.mesh.add(light);
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Add animation
        this.animate();
    }
    
    animate() {
        // Make it hover and rotate
        const startY = this.mesh.position.y;
        let time = 0;
        
        const animate = () => {
            time += 0.01;
            this.mesh.position.y = startY + Math.sin(time * 2) * 0.1;
            this.mesh.rotation.y += 0.01;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    collect() {
        // Remove from scene
        this.scene.remove(this.mesh);
        return this.type;
    }
    
    isColliding(position, radius) {
        return distance(position, this.mesh.position) < radius + 0.5;
    }
} 