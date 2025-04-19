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
        if (this.items.length < this.maxItems) {
            this.items.push(new HealthItem(x, y));
        }
    }

    update() {
        this.items.forEach(item => item.update());
    }

    draw(ctx) {
        this.items.forEach(item => item.draw(ctx));
    }
}
