/**
 * Models for the game
 */

class Models {
    constructor() {
        this.cache = {};
    }

    // Create a simple soldier model
    createSoldierModel(color) {
        const group = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.3;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const headMaterial = new THREE.MeshLambertMaterial({ color: color });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.7;
        group.add(head);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.1);
        const armMaterial = new THREE.MeshLambertMaterial({ color: color });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.25, 0.3, 0);
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.25, 0.3, 0);
        group.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.1);
        const legMaterial = new THREE.MeshLambertMaterial({ color: color });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.1, -0.1, 0);
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.1, -0.1, 0);
        group.add(rightLeg);
        
        return group;
    }
    
    // Create a squad of soldiers
    createSquad(color, count, formation) {
        const squad = new THREE.Group();
        
        const rows = Math.ceil(Math.sqrt(count));
        const cols = Math.ceil(count / rows);
        
        let index = 0;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (index >= count) break;
                
                const soldier = this.createSoldierModel(color);
                
                // Position based on formation
                if (formation === 'grid') {
                    soldier.position.set(
                        col * 0.5 - (cols * 0.5) / 2,
                        0,
                        row * 0.5 - (rows * 0.5) / 2
                    );
                } else if (formation === 'circle') {
                    const angle = (index / count) * Math.PI * 2;
                    const radius = count * 0.05 + 0.5;
                    soldier.position.set(
                        Math.cos(angle) * radius,
                        0,
                        Math.sin(angle) * radius
                    );
                }
                
                squad.add(soldier);
                index++;
            }
        }
        
        return squad;
    }
    
    // Create a simple battlefield
    createBattlefield(width, length) {
        const geometry = new THREE.BoxGeometry(width, 0.1, length);
        const material = new THREE.MeshLambertMaterial({ color: 0x999999 });
        const battlefield = new THREE.Mesh(geometry, material);
        battlefield.position.y = -0.05;
        
        // Add road markings
        const roadMarkingGeometry = new THREE.PlaneGeometry(0.2, length);
        const roadMarkingMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            side: THREE.DoubleSide
        });
        
        for (let i = -2; i <= 2; i += 2) {
            const roadMarking = new THREE.Mesh(roadMarkingGeometry, roadMarkingMaterial);
            roadMarking.rotation.x = Math.PI / 2;
            roadMarking.position.set(i, 0.01, 0);
            battlefield.add(roadMarking);
        }
        
        return battlefield;
    }
    
    // Create obstacles (tires)
    createTireObstacle(size = 1) {
        const group = new THREE.Group();
        
        const tireGeometry = new THREE.TorusGeometry(0.3 * size, 0.1 * size, 8, 24);
        const tireMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        
        // Create a stack of tires
        for (let i = 0; i < 3; i++) {
            const tire = new THREE.Mesh(tireGeometry, tireMaterial);
            tire.rotation.x = Math.PI / 2;
            tire.position.y = i * 0.15 * size;
            group.add(tire);
        }
        
        return group;
    }
    
    // Create a weapon model
    createWeaponModel(type) {
        let weapon;
        
        switch (type) {
            case 'rifle':
                weapon = this.createRifleModel();
                break;
            case 'machine-gun':
                weapon = this.createMachineGunModel();
                break;
            case 'bow':
                weapon = this.createBowModel();
                break;
            default:
                weapon = this.createRifleModel();
        }
        
        return weapon;
    }
    
    // Create a rifle model
    createRifleModel() {
        const group = new THREE.Group();
        
        // Barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8);
        const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.x = 0.3;
        group.add(barrel);
        
        // Stock
        const stockGeometry = new THREE.BoxGeometry(0.3, 0.08, 0.04);
        const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const stock = new THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.x = 0.05;
        group.add(stock);
        
        return group;
    }
    
    // Create a machine gun model
    createMachineGunModel() {
        const group = new THREE.Group();
        
        // Barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8);
        const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.x = 0.35;
        group.add(barrel);
        
        // Stock
        const stockGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.06);
        const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const stock = new THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.x = 0.05;
        group.add(stock);
        
        // Magazine
        const magazineGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.05);
        const magazineMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const magazine = new THREE.Mesh(magazineGeometry, magazineMaterial);
        magazine.position.set(0.1, -0.15, 0);
        group.add(magazine);
        
        return group;
    }
    
    // Create a bow model
    createBowModel() {
        const group = new THREE.Group();
        
        // Bow curve
        const bowCurve = new THREE.EllipseCurve(
            0, 0,                       // center
            0.3, 0.5,                   // x radius, y radius
            Math.PI / 2, -Math.PI / 2,  // start angle, end angle
            false,                      // clockwise
            0                           // rotation
        );
        
        const bowPoints = bowCurve.getPoints(50);
        const bowGeometry = new THREE.BufferGeometry().setFromPoints(bowPoints);
        const bowMaterial = new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 2 });
        const bow = new THREE.Line(bowGeometry, bowMaterial);
        bow.rotation.z = Math.PI / 2;
        group.add(bow);
        
        // String
        const stringGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0.5, 0),
            new THREE.Vector3(0, -0.5, 0)
        ]);
        const stringMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
        const string = new THREE.Line(stringGeometry, stringMaterial);
        string.rotation.z = Math.PI / 2;
        group.add(string);
        
        // Arrow
        const arrowGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.6, 8);
        const arrowMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.rotation.z = Math.PI / 2;
        arrow.position.x = 0.3;
        group.add(arrow);
        
        // Arrowhead
        const arrowheadGeometry = new THREE.ConeGeometry(0.02, 0.05, 8);
        const arrowheadMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const arrowhead = new THREE.Mesh(arrowheadGeometry, arrowheadMaterial);
        arrowhead.rotation.z = -Math.PI / 2;
        arrowhead.position.x = 0.625;
        group.add(arrowhead);
        
        return group;
    }
    
    // Create a projectile based on weapon type
    createProjectile(type) {
        let projectile;
        
        switch (type) {
            case 'rifle':
                projectile = this.createBulletProjectile(0.02, 0.08, 0xFFD700);
                break;
            case 'machine-gun':
                projectile = this.createBulletProjectile(0.03, 0.1, 0xFF4500);
                break;
            case 'bow':
                projectile = this.createArrowProjectile();
                break;
            default:
                projectile = this.createBulletProjectile(0.02, 0.08, 0xFFD700);
        }
        
        return projectile;
    }
    
    // Create a bullet projectile
    createBulletProjectile(radius, length, color) {
        const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
        const material = new THREE.MeshBasicMaterial({ color: color });
        const bullet = new THREE.Mesh(geometry, material);
        bullet.rotation.x = Math.PI / 2;
        
        return bullet;
    }
    
    // Create an arrow projectile
    createArrowProjectile() {
        const group = new THREE.Group();
        
        // Arrow shaft
        const shaftGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.4, 8);
        const shaftMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft.rotation.z = Math.PI / 2;
        shaft.position.x = 0.2;
        group.add(shaft);
        
        // Arrowhead
        const headGeometry = new THREE.ConeGeometry(0.02, 0.05, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.rotation.z = -Math.PI / 2;
        head.position.x = 0.425;
        group.add(head);
        
        // Fletching
        const fletchingGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.01);
        const fletchingMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        const fletching = new THREE.Mesh(fletchingGeometry, fletchingMaterial);
        fletching.position.x = 0.025;
        group.add(fletching);
        
        return group;
    }
} 