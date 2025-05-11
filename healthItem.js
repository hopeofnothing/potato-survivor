class HealthItem {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.pulseScale = 1;
        this.pulseDirection = 0.02;
        this.collected = false;
    }

    update() {
        // Pulsing animation
        this.pulseScale += this.pulseDirection;
        if (this.pulseScale > 1.2 || this.pulseScale < 0.8) {
            this.pulseDirection *= -1;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.pulseScale, this.pulseScale);

        // Draw heart shape
        ctx.beginPath();
        ctx.fillStyle = '#ff3366';
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-10, -8, -10, -16, 0, -16);
        ctx.bezierCurveTo(10, -16, 10, -8, 0, 0);
        ctx.fill();

        // Add glow effect
        ctx.shadowColor = '#ff3366';
        ctx.shadowBlur = 10;
        ctx.fill();

        ctx.restore();
    }
}

class HealthItemManager {
    constructor() {
        this.items = [];
        this.maxItems = 2; // Maximum health items on screen
    }

    spawnHealthItem(x, y) {
        // Add padding from edges
        const padding = 30; // Minimum distance from edges
        
        // Get canvas dimensions from the game canvas
        const canvas = document.getElementById('gameCanvas');
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Adjust x and y to stay within bounds
        x = Math.max(padding, Math.min(canvasWidth - padding, x));
        y = Math.max(padding, Math.min(canvasHeight - padding, y));
        
        const item = new HealthItem(x, y);
        this.items.push(item);
    }

    update() {
        this.items.forEach(item => item.update());
    }

    draw(ctx) {
        this.items.forEach(item => item.draw(ctx));
    }
}
