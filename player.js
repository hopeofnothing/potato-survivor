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
        
        // Dash properties
        this.dashSpeed = 10;
        this.dashDuration = 150; // milliseconds
        this.dashCooldown = 1000; // milliseconds
        this.lastDashTime = 0;
        this.isDashing = false;
        
        // Mobile double tap detection
        this.lastTapTime = 0;
        this.doubleTapThreshold = 300; // milliseconds
        this.lastTapX = 0;
        this.lastTapY = 0;
    }

    update(input, currentTime, canvasWidth, canvasHeight) {
        // Update invulnerability
        if (this.invulnerable && currentTime - this.lastHitTime > this.invulnerableTime) {
            this.invulnerable = false;
        }

        // Check for dash input and cooldown
        if (input[' '] && !this.isDashing && currentTime - this.lastDashTime > this.dashCooldown) {
            this.startDash(currentTime);
        }

        let newX = this.x;
        let newY = this.y;

        // Calculate movement speed based on dash state
        const currentSpeed = this.isDashing ? this.dashSpeed : this.speed;

        // Handle input (both keyboard and joystick)
        if (this.game.isMobile) {
            // Joystick input
            newX += input.x * currentSpeed;
            newY += input.y * currentSpeed;
            this.facingLeft = input.x < 0;
        } else {
            // Keyboard input
            if (input.w || input.ArrowUp) newY -= currentSpeed;
            if (input.s || input.ArrowDown) newY += currentSpeed;
            if (input.a || input.ArrowLeft) {
                newX -= currentSpeed;
                this.facingLeft = true;
            }
            if (input.d || input.ArrowRight) {
                newX += currentSpeed;
                this.facingLeft = false;
            }
        }

        // End dash if duration is over
        if (this.isDashing && currentTime - this.lastDashTime > this.dashDuration) {
            this.isDashing = false;
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

        // Update position with screen bounds
        this.x = Math.max(this.width/2, Math.min(canvasWidth - this.width/2, this.x));
        this.y = Math.max(this.height/2, Math.min(canvasHeight - this.height/2, this.y));
        
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

            // Draw dash cooldown indicator
            const currentTime = Date.now();
            const timeSinceLastDash = currentTime - this.lastDashTime;
            if (timeSinceLastDash < this.dashCooldown) {
                // Draw cooldown circle
                const cooldownProgress = timeSinceLastDash / this.dashCooldown;
                const radius = this.width / 3;
                
                // Draw background circle
                ctx.beginPath();
                ctx.arc(0, -this.height/2 - radius - 5, radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fill();
                
                // Draw progress arc
                ctx.beginPath();
                ctx.arc(0, -this.height/2 - radius - 5, radius, -Math.PI/2, -Math.PI/2 + (2 * Math.PI * cooldownProgress));
                ctx.lineTo(0, -this.height/2 - radius - 5);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.fill();
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

    startDash(currentTime) {
        this.isDashing = true;
        this.lastDashTime = currentTime;
        // Optional: Add dash effect or sound here
    }
}