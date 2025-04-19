class Player {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.speed = 5;
        
        // Create and load the player image with error handling
        this.sprite = new Image();
        this.sprite.onload = () => {
            console.log('Player sprite loaded successfully');
        };
        this.sprite.onerror = () => {
            console.error('Error loading player sprite');
        };
        this.sprite.src = 'assets/Hero_SweetPotato.png'; // Make sure this matches your file name
        
        // We'll set the size based on your image
        // Adjust these numbers based on your image size
        this.width = 48;  // Set this to your image width or desired width
        this.height = 48; // Set this to your image height or desired height
        
        this.facingLeft = false;
        this.lives = 3; // Initialize with 3 lives
        this.maxLives = 3;
        this.invulnerable = false; // For invulnerability frames after getting hit
        this.invulnerableTime = 2000; // 2 seconds of invulnerability
        this.lastHitTime = 0;
        this.game = game; // Reference to game instance
        
        // If you're using a GIF, you might want to handle the animation
        this.isGif = this.sprite.src.toLowerCase().endsWith('.gif');
    }

    update(keys, currentTime, canvasWidth, canvasHeight) {
        // Update invulnerability
        if (this.invulnerable && currentTime - this.lastHitTime > this.invulnerableTime) {
            this.invulnerable = false;
        }

        let newX = this.x;
        let newY = this.y;

        // Calculate new position based on input
        if (keys.w || keys.ArrowUp) newY -= this.speed;
        if (keys.s || keys.ArrowDown) newY += this.speed;
        if (keys.a || keys.ArrowLeft) {
            newX -= this.speed;
            this.facingLeft = true;
        }
        if (keys.d || keys.ArrowRight) {
            newX += this.speed;
            this.facingLeft = false;
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