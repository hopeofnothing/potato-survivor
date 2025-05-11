class Enemy {
    constructor(x, y, player) {
        this.x = x;
        this.y = y;
        this.speed = 1.5; // Reduced from 2.0 (25% slower)
        this.health = 1;
        this.facingLeft = true;
        this.expValue = 10;
        
        console.log(`Creating enemy at position: ${x}, ${y}`);
        
        // Create and load enemy sprite with error handling
        this.sprite = new Image();
        this.sprite.onload = () => {
            console.log('Enemy sprite loaded successfully');
            // Set dimensions based on actual sprite size
            // Scale the sprite while maintaining aspect ratio
            const scale = 0.8; // Increased from 0.4 to make the sprite larger
            this.width = this.sprite.naturalWidth * scale;
            this.height = this.sprite.naturalHeight * scale;
        };
        this.sprite.onerror = () => {
            console.error('Error loading enemy sprite');
            // Fallback dimensions if sprite fails to load
            this.width = 48;
            this.height = 48;
        };
        this.sprite.src = 'assets/Ugly_Fairy.png';
        
        // Initial dimensions (will be updated when sprite loads)
        this.width = 48;
        this.height = 48;
    }

    update(playerX, playerY) {
        const angle = Math.atan2(playerY - this.y, playerX - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
        
        this.facingLeft = playerX < this.x;
    }

    draw(ctx) {
        try {
            if (!ctx) {
                console.error('No context provided for enemy draw');
                return;
            }

            ctx.save();
            ctx.translate(this.x, this.y);
            
            if (!this.facingLeft) {
                ctx.scale(-1, 1);
            }
            
            // Always draw something - either sprite or fallback
            if (this.sprite.complete && this.sprite.naturalHeight !== 0) {
                ctx.drawImage(
                    this.sprite,
                    -this.width/2,
                    -this.height/2,
                    this.width,
                    this.height
                );
            } else {
                // Fallback shape
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            ctx.restore();
        } catch (error) {
            console.error('Error in enemy draw:', error);
        }
    }
}

class EnemySpawner {
    constructor() {
        this.reset();
    }

    reset() {
        this.enemies = [];
        this.spawnInterval = 1000;  // Starting spawn interval
        this.lastSpawn = 0;
        this.maxEnemies = 40;
        this.lastDifficultyIncrease = 0;
        this.difficultyIncreaseInterval = 30000;  // Every 30 seconds
        this.wave = 1;
        this.player = null;
        this.baseSpawnCount = 1;  // Base number of enemies to spawn at once
    }

    increaseDifficulty() {
        this.wave++;
        
        // Progressively decrease spawn interval (faster spawns)
        // Minimum 150ms between spawns, reduces by 5% each wave
        this.spawnInterval = Math.max(150, this.spawnInterval * 0.95);
        
        // Increase max enemies (more enemies on screen)
        // Maximum 100 enemies, increases by wave number
        this.maxEnemies = Math.min(100, 40 + (this.wave * 3));
        
        // Increase base spawn count (more enemies per spawn)
        // Maximum 5 enemies per spawn, increases every 3 waves
        this.baseSpawnCount = Math.min(5, 1 + Math.floor(this.wave / 3));
        
        // Create wave announcement text
        console.log(`Wave ${this.wave} started!`);
    }

    update(currentTime, canvasWidth, canvasHeight) {
        // Check if it's time to increase difficulty
        if (currentTime - this.lastDifficultyIncrease > this.difficultyIncreaseInterval) {
            this.increaseDifficulty();
            this.lastDifficultyIncrease = currentTime;
        }

        // Spawn multiple enemies if enough time has passed
        if (currentTime - this.lastSpawn > this.spawnInterval && 
            this.enemies.length < this.maxEnemies) {
            
            // Calculate dynamic spawn count based on current wave
            const maxSpawnCount = Math.min(
                this.baseSpawnCount + Math.floor(Math.random() * (this.wave / 2)),
                this.maxEnemies - this.enemies.length
            );
            
            for (let i = 0; i < maxSpawnCount; i++) {
                this.spawn(canvasWidth, canvasHeight);
            }
            this.lastSpawn = currentTime;
        }

        // Update all enemies
        if (this.player) {
            this.enemies.forEach(enemy => {
                enemy.update(this.player.x, this.player.y);
            });
        }

        // Remove dead enemies and those that are far off screen
        const initialCount = this.enemies.length;
        this.enemies = this.enemies.filter(enemy => {
            return enemy.health > 0 && // Remove dead enemies
                   enemy.x > -100 && 
                   enemy.x < canvasWidth + 100 && 
                   enemy.y > -100 && 
                   enemy.y < canvasHeight + 100;
        });
        if (initialCount !== this.enemies.length) {
            console.log(`Removed ${initialCount - this.enemies.length} enemies. ${this.enemies.length} remaining`);
        }
    }

    spawn(canvasWidth, canvasHeight) {
        // Don't spawn if at max enemies
        if (this.enemies.length >= this.maxEnemies) {
            return;
        }

        // Spawn from all sides with better distribution
        const side = Math.floor(Math.random() * 4);
        let x, y;

        switch(side) {
            case 0: // top
                x = Math.random() * canvasWidth;
                y = -20;
                break;
            case 1: // right
                x = canvasWidth + 20;
                y = Math.random() * canvasHeight;
                break;
            case 2: // bottom
                x = Math.random() * canvasWidth;
                y = canvasHeight + 20;
                break;
            case 3: // left
                x = -20;
                y = Math.random() * canvasHeight;
                break;
        }

        const enemy = new Enemy(x, y);
        this.enemies.push(enemy);
        console.log(`Spawned enemy at: ${x}, ${y}. Total enemies: ${this.enemies.length}`);
    }

    draw(ctx) {
        console.log(`Drawing ${this.enemies.length} enemies`);
        this.enemies.forEach((enemy, index) => {
            if (enemy) {
                enemy.draw(ctx);
            } else {
                console.error(`Invalid enemy at index ${index}`);
            }
        });
    }

    setPlayer(player) {
        this.player = player;
    }
}