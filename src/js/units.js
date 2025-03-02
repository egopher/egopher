/**
 * Units system for the game
 */

class Unit {
    constructor(type, team, position, health, speed, models) {
        this.type = type;
        this.team = team;
        this.position = position.clone();
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
        this.models = models;
        this.mesh = null;
        this.target = null;
        this.weapon = null;
        this.radius = 0.3; // For collision detection
        this.isAlive = true;
        this.createMesh();
    }
    
    createMesh() {
        // Create the unit mesh based on team
        const color = this.team === 'blue' ? 0x3498db : 0xe74c3c;
        this.mesh = this.models.createSoldierModel(color);
        this.mesh.position.copy(this.position);
        
        // Add health bar
        this.createHealthBar();
    }
    
    createHealthBar() {
        const healthBarWidth = 0.4;
        const healthBarHeight = 0.05;
        
        // Background
        const bgGeometry = new THREE.PlaneGeometry(healthBarWidth, healthBarHeight);
        const bgMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x333333,
            side: THREE.DoubleSide
        });
        this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
        this.healthBarBg.position.y = 1.0;
        this.mesh.add(this.healthBarBg);
        
        // Foreground (actual health)
        const fgGeometry = new THREE.PlaneGeometry(healthBarWidth, healthBarHeight);
        const fgMaterial = new THREE.MeshBasicMaterial({ 
            color: this.team === 'blue' ? 0x3498db : 0xe74c3c,
            side: THREE.DoubleSide
        });
        this.healthBarFg = new THREE.Mesh(fgGeometry, fgMaterial);
        this.healthBarFg.position.z = 0.01; // Slightly in front of background
        this.healthBarBg.add(this.healthBarFg);
        
        // Make health bar always face the camera
        this.healthBarBg.rotation.x = Math.PI / 2;
    }
    
    updateHealthBar() {
        const healthRatio = this.health / this.maxHealth;
        this.healthBarFg.scale.x = Math.max(0.01, healthRatio);
        this.healthBarFg.position.x = (healthRatio - 1) * 0.2; // Center the scaling
    }
    
    setWeapon(weapon) {
        this.weapon = weapon;
        
        // Add weapon model to the unit if needed
        if (weapon && weapon.model) {
            this.mesh.add(weapon.model);
        }
    }
    
    setTarget(target) {
        this.target = target;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthBar();
        
        if (this.health <= 0 && this.isAlive) {
            this.die();
        }
    }
    
    die() {
        this.isAlive = false;
        
        // Fall over animation
        this.mesh.rotation.x = Math.PI / 2;
        this.mesh.position.y = 0.3;
        
        // Change color to darker
        this.mesh.traverse(child => {
            if (child.isMesh) {
                child.material.color.multiplyScalar(0.5);
            }
        });
    }
    
    update(deltaTime, scene, currentTime) {
        if (!this.isAlive) return;
        
        // Move towards target if exists
        if (this.target && this.target.isAlive) {
            const direction = new THREE.Vector3()
                .subVectors(this.target.position, this.position)
                .normalize();
            
            // Move towards target
            const moveAmount = this.speed * deltaTime;
            this.position.add(direction.clone().multiplyScalar(moveAmount));
            this.mesh.position.copy(this.position);
            
            // Rotate to face target
            this.mesh.lookAt(this.target.position);
            
            // Fire weapon if in range
            if (this.weapon && distance(this.position, this.target.position) < this.weapon.range) {
                this.weapon.fire(
                    this.position.clone().add(new THREE.Vector3(0, 0.5, 0)),
                    direction,
                    currentTime,
                    scene,
                    this.models
                );
            }
        }
        
        // Update weapon projectiles
        if (this.weapon) {
            this.weapon.update(deltaTime, scene);
        }
    }
    
    getPosition() {
        return this.position;
    }
}

class Squad {
    constructor(team, position, count, models, scene) {
        this.team = team;
        this.position = position.clone();
        this.count = count;
        this.models = models;
        this.scene = scene;
        this.units = [];
        this.mesh = null;
        this.target = null;
        this.radius = 1.5; // For squad-level collision
        this.createUnits();
    }
    
    createUnits() {
        // Create the squad mesh
        const color = this.team === 'blue' ? 0x3498db : 0xe74c3c;
        this.mesh = this.models.createSquad(color, this.count, 'grid');
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        
        // Create individual units
        for (let i = 0; i < this.count; i++) {
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                0,
                (Math.random() - 0.5) * 2
            );
            
            const unitPosition = this.position.clone().add(offset);
            const unit = new Unit(
                'soldier',
                this.team,
                unitPosition,
                100,
                2 + Math.random(),
                this.models
            );
            
            // Give each unit a weapon
            const weaponType = Math.random() < 0.7 ? 'rifle' : 'machine-gun';
            unit.setWeapon(WeaponFactory.createWeapon(weaponType));
            
            this.units.push(unit);
            this.scene.add(unit.mesh);
        }
    }
    
    setTarget(target) {
        this.target = target;
        
        // Distribute target units among squad members
        if (target && target.units) {
            for (let i = 0; i < this.units.length; i++) {
                if (i < target.units.length) {
                    this.units[i].setTarget(target.units[i]);
                } else {
                    // If we have more units than the target, assign extras to random target units
                    const randomTargetIndex = Math.floor(Math.random() * target.units.length);
                    this.units[i].setTarget(target.units[randomTargetIndex]);
                }
            }
        }
    }
    
    update(deltaTime, currentTime) {
        // Update all units in the squad
        for (let i = this.units.length - 1; i >= 0; i--) {
            const unit = this.units[i];
            unit.update(deltaTime, this.scene, currentTime);
            
            // Remove dead units after a delay
            if (!unit.isAlive && unit.deathTime && currentTime - unit.deathTime > 5000) {
                this.scene.remove(unit.mesh);
                this.units.splice(i, 1);
            } else if (!unit.isAlive && !unit.deathTime) {
                unit.deathTime = currentTime;
            }
        }
        
        // Update squad position to average of all units
        if (this.units.length > 0) {
            const center = new THREE.Vector3();
            for (const unit of this.units) {
                center.add(unit.position);
            }
            center.divideScalar(this.units.length);
            this.position.copy(center);
        }
        
        // Check if squad is defeated
        if (this.units.length === 0) {
            this.scene.remove(this.mesh);
        }
    }
    
    getAliveCount() {
        return this.units.filter(unit => unit.isAlive).length;
    }
    
    checkProjectileCollisions(projectiles, sourceTeam) {
        let hits = 0;
        
        // Only check collisions with projectiles from the other team
        if (sourceTeam === this.team) return hits;
        
        for (const unit of this.units) {
            if (!unit.isAlive) continue;
            
            for (let i = projectiles.length - 1; i >= 0; i--) {
                const projectile = projectiles[i];
                
                // Check collision
                if (distance(unit.position, projectile.position) < unit.radius + 0.1) {
                    // Apply damage
                    unit.takeDamage(projectile.userData.damage);
                    
                    // Remove projectile
                    this.scene.remove(projectile);
                    projectiles.splice(i, 1);
                    
                    hits++;
                }
            }
        }
        
        return hits;
    }
    
    collectPowerUp(powerUp) {
        // Find the closest alive unit to the power-up
        let closestUnit = null;
        let closestDistance = Infinity;
        
        for (const unit of this.units) {
            if (!unit.isAlive) continue;
            
            const dist = distance(unit.position, powerUp.mesh.position);
            if (dist < closestDistance) {
                closestDistance = dist;
                closestUnit = unit;
            }
        }
        
        // If a unit is close enough, collect the power-up
        if (closestUnit && closestDistance < 1.5) {
            const weaponType = powerUp.collect();
            
            // Give the weapon to the unit
            closestUnit.setWeapon(WeaponFactory.createWeapon(weaponType));
            
            // Also give the same weapon to some nearby units
            const nearbyUnits = this.units
                .filter(unit => unit.isAlive && unit !== closestUnit)
                .sort((a, b) => {
                    return distance(a.position, closestUnit.position) - 
                           distance(b.position, closestUnit.position);
                })
                .slice(0, 3); // Give to 3 more units
            
            for (const unit of nearbyUnits) {
                unit.setWeapon(WeaponFactory.createWeapon(weaponType));
            }
            
            return true;
        }
        
        return false;
    }
} 