class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 2;
        this.width = 48;
        this.height = 48;
        this.health = 1;  // Health property
        this.facingLeft = true;
        this.expValue = 10; // Experience value when killed
        
        console.log(`Creating enemy at position: ${x}, ${y}`);
        
        // Create and load enemy sprite with error handling
        this.sprite = new Image();
        this.sprite.onload = () => {
            console.log('Enemy sprite loaded successfully');
        };
        this.sprite.onerror = () => {
            console.error('Error loading enemy sprite');
        };
        this.sprite.src = 'assets/Ugly_Fairy.png';
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
        this.spawnInterval = 1000;
        this.lastSpawn = 0;
        this.maxEnemies = 40;
        this.lastDifficultyIncrease = 0;
        this.difficultyIncreaseInterval = 30000;
        this.wave = 1;
        this.player = null;
    }

    startGame() {
        // Spawn multiple enemies at game start
        for (let i = 0; i < this.initialSpawnCount; i++) {
            this.spawn(this.canvas.width, this.canvas.height);
        }
    }

    increaseDifficulty() {
        this.wave++;
        // Faster spawn rate
        this.spawnInterval = Math.max(150, this.spawnInterval - 30); // Minimum 0.15 seconds between spawns
        // More enemies allowed
        this.maxEnemies = Math.min(100, 75 + (this.wave * 5));
        
        // Spawn a wave of enemies when difficulty increases
        const waveSpawnCount = Math.min(10, this.wave * 2);
        for (let i = 0; i < waveSpawnCount; i++) {
            this.spawn(this.canvas.width, this.canvas.height);
        }
        
        this.createWaveAnnouncement();
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

    update(currentTime, canvasWidth, canvasHeight) {
        // Spawn multiple enemies if enough time has passed
        if (currentTime - this.lastSpawn > this.spawnInterval && 
            this.enemies.length < this.maxEnemies) {
            
            // Spawn 1-3 enemies at once
            const spawnCount = Math.min(
                3, 
                this.maxEnemies - this.enemies.length
            );
            
            for (let i = 0; i < spawnCount; i++) {
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