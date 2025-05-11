class Projectile {
    constructor(x, y, targetX, targetY, speed = 8) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.size = 8;
        this.piercing = 1;
        this.hitCount = 0;
        this.explodes = false;
        this.explosionLevel = 0;
        this.isExploding = false;
        this.explosionTimer = 0;
        this.explosionDuration = 20;
        
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
        }
    }

    canHitEnemy() {
        return this.hitCount < this.piercing;
    }

    getExplosionRadius() {
        return this.baseExplosionRadius * (1 + this.explosionLevel * 0.2);
    }

    startExplosion(x, y) {
        console.log('Starting explosion at:', x, y);  // Debug log
        this.isExploding = true;
        this.explosionX = x;
        this.explosionY = y;
        this.explosionTimer = this.explosionDuration;
    }

    shouldBeRemoved() {
        return this.hitCount >= this.piercing;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.alpha = 1;
        this.decay = 0.02 + Math.random() * 0.03; // Random decay rate
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= this.decay;
        this.size *= 0.97; // Gradually reduce size
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Explosion {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.particles = [];
        this.active = true;
        
        console.log('Creating explosion at:', x, y, 'with radius:', radius);
        
        // Create particles
        const particleCount = Math.floor(radius * 1.5);
        const colors = ['#ff4400', '#ff8800', '#ffaa00', '#ffcc00']; // Fire colors
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)]));
        }
        console.log('Created explosion with', particleCount, 'particles');
    }

    update() {
        this.particles.forEach(particle => particle.update());
        this.particles = this.particles.filter(particle => particle.alpha > 0);
        this.active = this.particles.length > 0;
    }

    draw(ctx) {
        if (!ctx) {
            console.error('No context provided for explosion draw');
            return;
        }

        try {
            // Draw explosion glow
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            gradient.addColorStop(0, 'rgba(255, 200, 0, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            
            ctx.save();
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw particles
            this.particles.forEach(particle => particle.draw(ctx));
            ctx.restore();
        } catch (error) {
            console.error('Error drawing explosion:', error);
        }
    }
}

class WeaponSystem {
    constructor(game) {
        this.game = game;
        this.reset();
        this.explosions = [];
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
                enemies.forEach(enemy => {
                    if (this.checkCollision(projectile, enemy) && projectile.canHitEnemy()) {
                        enemy.health -= this.damage;
                        projectile.hitCount++;

                        // Check if enemy died and add experience
                        if (enemy.health <= 0 && this.game && this.game.upgradeSystem) {
                            this.game.upgradeSystem.addExperience(enemy.expValue);
                            // Add health drop chance when enemy dies
                            if (Math.random() < 0.1) { // 10% chance to drop health
                                if (this.game.healthItemManager) {
                                    console.log('Attempting to spawn health item at:', enemy.x, enemy.y);
                                    this.game.healthItemManager.spawnHealthItem(enemy.x, enemy.y);
                                } else {
                                    console.error('healthItemManager not initialized');
                                }
                            }
                        }

                        // Handle explosion if we have the explosion upgrade
                        if (projectile.explodes && projectile.explosionLevel > 0) {
                            console.log('Creating explosion for projectile with level:', projectile.explosionLevel);
                            // Create new explosion effect
                            const explosionRadius = 50 + (projectile.explosionLevel * 20);
                            this.createExplosion(projectile.x, projectile.y, explosionRadius);
                            
                            // Apply explosion damage to nearby enemies - FIXED: Added null check and enemy health check
                            enemies.forEach(otherEnemy => {
                                if (otherEnemy && otherEnemy !== enemy && otherEnemy.health > 0) {
                                    const dx = otherEnemy.x - projectile.x;
                                    const dy = otherEnemy.y - projectile.y;
                                    const distance = Math.sqrt(dx * dx + dy * dy);
                                    
                                    if (distance <= explosionRadius) {
                                        otherEnemy.health -= this.damage;
                                        // Check if enemy died from explosion and add experience
                                        if (otherEnemy.health <= 0 && this.game && this.game.upgradeSystem) {
                                            this.game.upgradeSystem.addExperience(otherEnemy.expValue);
                                        }
                                    }
                                }
                            });
                        }
                    }
                });
            }
        });

        // Remove projectiles that have hit their max targets
        this.projectiles = this.projectiles.filter(p => !p.shouldBeRemoved());

        if (currentTime - this.lastShot >= this.shotInterval) {
            const nearestEnemy = this.findNearestEnemy(playerX, playerY, enemies);
            if (nearestEnemy) {
                this.shoot(playerX, playerY, nearestEnemy.x, nearestEnemy.y);
                this.lastShot = currentTime;
            }
        }

        // Update explosions
        this.explosions.forEach(explosion => explosion.update());
        this.explosions = this.explosions.filter(explosion => explosion.active);
    }

    checkCollision(projectile, enemy) {
        const dx = projectile.x - enemy.x;
        const dy = projectile.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (projectile.size/2 + enemy.width/2);
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

    draw(ctx) {
        if (!ctx) {
            console.error('No context provided for weapon system draw');
            return;
        }

        try {
            // Draw projectiles
            this.projectiles.forEach(projectile => {
                projectile.draw(ctx);
            });
            
            // Draw explosions
            console.log('Drawing', this.explosions.length, 'explosions');
            this.explosions.forEach(explosion => explosion.draw(ctx));
        } catch (error) {
            console.error('Error in weapon system draw:', error);
        }
    }

    createExplosion(x, y, radius) {
        console.log('Creating explosion at:', x, y, 'with radius:', radius);
        // Add validation to prevent invalid explosions
        if (isNaN(x) || isNaN(y) || isNaN(radius) || radius <= 0) {
            console.error('Invalid explosion parameters:', x, y, radius);
            return;
        }
        this.explosions.push(new Explosion(x, y, radius));
    }

    handleProjectileCollision(projectile, enemy) {
        if (projectile.explodes && projectile.explosionLevel > 0) {
            const explosionRadius = 50 + (projectile.explosionLevel * 20);
            this.createExplosion(projectile.x, projectile.y, explosionRadius);
            
            // Handle explosion damage to nearby enemies
            // ... rest of explosion logic ...
        }
    }
}
