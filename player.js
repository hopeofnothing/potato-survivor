class Player {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.speed = 5;
        this.game = game;
        
        // Create and load the player image with error handling
        this.sprite = new Image();
        this.sprite.onload = () => {
            console.log('Player sprite loaded successfully');
            // Set dimensions based on actual sprite size
            // Scale the sprite while maintaining aspect ratio
            const scale = 1.0; // Increased from 0.5 to make the sprite larger
            this.width = this.sprite.naturalWidth * scale;
            this.height = this.sprite.naturalHeight * scale;
        };
        this.sprite.onerror = () => {
            console.error('Error loading player sprite');
            // Fallback dimensions if sprite fails to load
            this.width = 48;
            this.height = 48;
        };
        this.sprite.src = 'assets/Hero_SweetPotato.png';
        
        // Initial dimensions (will be updated when sprite loads)
        this.width = 48;
        this.height = 48;
        
        this.facingLeft = false;
        this.lives = 3; // Initialize with 3 lives
        this.maxLives = 3;
        this.invulnerable = false; // For invulnerability frames after getting hit
        this.invulnerableTime = 2000; // 2 seconds of invulnerability
        this.lastHitTime = 0;
        
        // If you're using a GIF, you might want to handle the animation
        this.isGif = this.sprite.src.toLowerCase().endsWith('.gif');
    }

    update(input, currentTime, canvasWidth, canvasHeight) {
        // Update invulnerability
        if (this.invulnerable && currentTime - this.lastHitTime > this.invulnerableTime) {
            this.invulnerable = false;
        }

        let newX = this.x;
        let newY = this.y;

        // Handle input (both keyboard and joystick)
        if (this.game.isMobile) {
            // Joystick input
            newX += input.x * this.speed;
            newY += input.y * this.speed;
            this.facingLeft = input.x < 0;
        } else {
            // Keyboard input
            if (input.w || input.ArrowUp) newY -= this.speed;
            if (input.s || input.ArrowDown) newY += this.speed;
            if (input.a || input.ArrowLeft) {
                newX -= this.speed;
                this.facingLeft = true;
            }
            if (input.d || input.ArrowRight) {
                newX += this.speed;
                this.facingLeft = false;
            }
        }

        // Constrain to screen bounds
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;

        // Apply constraints and update position
        // Left bound
        if (newX < halfWidth) {
            newX = halfWidth;
        }
        // Right bound
        if (newX > canvasWidth - halfWidth) {
            newX = canvasWidth - halfWidth;
        }
        // Top bound
        if (newY < halfHeight) {
            newY = halfHeight;
        }
        // Bottom bound
        if (newY > canvasHeight - halfHeight) {
            newY = canvasHeight - halfHeight;
        }

        // Update position
        this.x = newX;
        this.y = newY;
    }

    draw(ctx) {
        try {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // Make player blink when invulnerable
            if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }
            
            if (this.facingLeft) {
                ctx.scale(-1, 1);
            }
            
            if (this.sprite.complete && this.sprite.naturalHeight !== 0) {
                // Draw the sprite
                ctx.drawImage(
                    this.sprite,
                    -this.width/2,
                    -this.height/2,
                    this.width,
                    this.height
                );
            } else {
                // Fallback shape if image fails to load
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
            }
            
            ctx.restore();
        } catch (error) {
            console.error('Error in player draw:', error);
        }
    }

    takeDamage(currentTime) {
        if (this.invulnerable) return false; // No damage during invulnerability

        this.lives--;
        this.invulnerable = true;
        this.lastHitTime = currentTime;
        return true; // Damage was taken
    }
}