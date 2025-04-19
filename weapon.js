class Projectile {
    constructor(x, y, targetX, targetY, speed = 8) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.size = 8;
        this.piercing = 1;
        this.hitEnemies = new Set();
        this.explodes = false;
        this.explosionLevel = 0;
        this.baseExplosionRadius = 50;
        this.isExploding = false;
        this.explosionX = 0;
        this.explosionY = 0;
        this.explosionDuration = 15;
        this.explosionTimer = 0;
        
        const dx = targetX - x;
        const dy = targetY - y;
        this.angle = Math.atan2(dy, dx);
        
        this.dx = Math.cos(this.angle) * speed;
        this.dy = Math.sin(this.angle) * speed;
    }

    update() {
        if (!this.isExploding) {
            this.x += this.dx;
            this.y += this.dy;
        } else if (this.explosionTimer > 0) {
            this.explosionTimer--;
        }
    }

    draw(ctx) {
        if (!this.isExploding) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            ctx.fillStyle = this.piercing > 1 ? '#ffff00' : '#00ffff';
            ctx.beginPath();
            ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = this.explodes ? '#ff4400' : '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(0, 0);
            ctx.stroke();

            ctx.restore();
        } else if (this.explosionTimer > 0) {
            const alpha = this.explosionTimer / this.explosionDuration;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(this.explosionX, this.explosionY, this.getExplosionRadius(), 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 68, 0, 0.3)';
            ctx.fill();
            ctx.strokeStyle = '#ff4400';
            ctx.stroke();
            ctx.restore();
        }
    }

    canHitEnemy(enemy) {
        return !this.hitEnemies.has(enemy.id);
    }

    getExplosionRadius() {
        return this.baseExplosionRadius * (1 + this.explosionLevel * 0.5);
    }

    startExplosion(x, y) {
        this.isExploding = true;
        this.explosionX = x;
        this.explosionY = y;
        this.explosionTimer = this.explosionDuration;
    }

    shouldBeRemoved() {
        return (this.hitEnemies.size >= this.piercing) || 
               (this.isExploding && this.explosionTimer <= 0);
    }
}

class WeaponSystem {
    constructor(game) {
        this.game = game;
        this.reset();
    }

    reset() {
        this.projectiles = [];
        this.lastShot = 0;
        this.shotInterval = 500;
        this.damage = 1;
        this.frontProjectiles = 1;
        this.backProjectiles = 0;
        this.piercing = 1;
        this.explosionLevel = 0;
    }

    update(currentTime, playerX, playerY, enemies) {
        this.projectiles.forEach(projectile => {
            projectile.update();
            
            if (!projectile.isExploding) {
                for (let enemy of enemies) {
                    if (this.checkCollision(projectile, enemy) && projectile.canHitEnemy(enemy)) {
                        this.handleProjectileHit(projectile, enemy, enemies);
                    }
                }
            }
        });

        this.projectiles = this.projectiles.filter(p => !p.shouldBeRemoved());

        if (currentTime - this.lastShot >= this.shotInterval) {
            const nearestEnemy = this.findNearestEnemy(playerX, playerY, enemies);
            if (nearestEnemy) {
                this.shoot(playerX, playerY, nearestEnemy.x, nearestEnemy.y);
                this.lastShot = currentTime;
            }
        }
    }

    checkCollision(projectile, enemy) {
        const dx = projectile.x - enemy.x;
        const dy = projectile.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (projectile.size/2 + enemy.size/2);
    }

    handleProjectileHit(projectile, enemy, enemies) {
        projectile.hitEnemies.add(enemy.id);
        enemy.health -= this.damage;

        if (projectile.explodes) {
            projectile.startExplosion(projectile.x, projectile.y);
            
            const radius = projectile.getExplosionRadius();
            enemies.forEach(otherEnemy => {
                if (!projectile.hitEnemies.has(otherEnemy.id)) {
                    const dx = otherEnemy.x - projectile.x;
                    const dy = otherEnemy.y - projectile.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= radius) {
                        otherEnemy.health -= this.damage;
                        projectile.hitEnemies.add(otherEnemy.id);
                    }
                }
            });
        }
    }

    shoot(playerX, playerY, targetX, targetY) {
        const dx = targetX - playerX;
        const dy = targetY - playerY;
        const baseAngle = Math.atan2(dy, dx);

        // Front projectiles
        for (let i = 0; i < this.frontProjectiles; i++) {
            const spread = (i - (this.frontProjectiles - 1) / 2) * 0.1;
            const angle = baseAngle + spread;
            const projectile = new Projectile(
                playerX,
                playerY,
                playerX + Math.cos(angle) * 100,
                playerY + Math.sin(angle) * 100
            );
            projectile.piercing = this.piercing;
            projectile.explodes = this.explosionLevel > 0;
            projectile.explosionLevel = this.explosionLevel;
            this.projectiles.push(projectile);
        }

        // Back projectiles
        if (this.backProjectiles > 0) {
            const backAngle = baseAngle + Math.PI;
            for (let i = 0; i < this.backProjectiles; i++) {
                const spread = (i - (this.backProjectiles - 1) / 2) * 0.1;
                const angle = backAngle + spread;
                const projectile = new Projectile(
                    playerX,
                    playerY,
                    playerX + Math.cos(angle) * 100,
                    playerY + Math.sin(angle) * 100
                );
                projectile.piercing = this.piercing;
                projectile.explodes = this.explosionLevel > 0;
                projectile.explosionLevel = this.explosionLevel;
                this.projectiles.push(projectile);
            }
        }
    }

    findNearestEnemy(playerX, playerY, enemies) {
        let nearest = null;
        let nearestDist = Infinity;
        
        enemies.forEach(enemy => {
            const dx = enemy.x - playerX;
            const dy = enemy.y - playerY;
            const dist = dx * dx + dy * dy;
            
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = enemy;
            }
        });
        
        return nearest;
    }
}
