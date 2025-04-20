class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();

        // Add window resize handler
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize(); // Initial resize

        this.keys = {};
        this.gameState = 'start'; // 'start', 'playing', 'paused', 'gameOver'
        this.startTime = 0;
        this.pauseStartTime = 0;
        this.totalPausedTime = 0;
        this.currentTime = 0;
        this.highScore = localStorage.getItem('highScore') || 0;
        this.isUpgrading = false;
        this.animationFrameId = null; // Track the animation frame
        
        // Mobile controls
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.joystick = null;
        this.joystickDirection = { x: 0, y: 0 };
        
        // Create background texture canvas
        this.generateBackgroundTexture();
        
        // Initialize game objects as null
        this.player = null;
        this.enemySpawner = null;
        this.weaponSystem = null;
        this.upgradeSystem = null;

        // Create lives display UI element
        this.createLivesDisplay();

        this.setupEventListeners();
        this.updateHighScoreDisplay();
        this.showStartScreen();

        this.audioManager = new AudioManager();
        this.healthItemManager = new HealthItemManager();
        this.setupAudioControls();
    }

    handleResize() {
        // Get the container dimensions
        const container = document.getElementById('game-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate the aspect ratio
        const targetAspectRatio = 4/3; // You can adjust this to your preferred aspect ratio
        let canvasWidth = containerWidth;
        let canvasHeight = containerHeight;

        // Adjust dimensions to maintain aspect ratio
        if (containerWidth / containerHeight > targetAspectRatio) {
            canvasWidth = containerHeight * targetAspectRatio;
        } else {
            canvasHeight = containerWidth / targetAspectRatio;
        }

        // Set canvas dimensions
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;

        // Update background texture if it exists
        if (this.backgroundCanvas) {
            this.generateBackgroundTexture();
        }

        // If game is running, reposition player
        if (this.player) {
            this.player.x = canvasWidth / 2;
            this.player.y = canvasHeight / 2;
        }
    }

    setupCanvas() {
        // Initial canvas setup will be handled by handleResize
        this.handleResize();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Handle ESC key for pause
            if (e.key === 'Escape' && this.gameState === 'playing') {
                this.pauseGame();
            } else if (e.key === 'Escape' && this.gameState === 'paused') {
                this.resumeGame();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('restart-button').addEventListener('click', () => {
            this.startGame();
        });
    }

    updateHighScoreDisplay() {
        document.getElementById('high-score').textContent = this.highScore;
        document.getElementById('game-over-high-score').textContent = this.highScore;
    }

    showStartScreen() {
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        this.canvas.style.opacity = '0.5';
    }

    showGameOverScreen() {
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('start-screen').classList.add('hidden');
        this.canvas.style.opacity = '0.5';
        
        const finalScore = Math.floor((this.currentTime - this.startTime) / 1000);
        document.getElementById('final-score').textContent = finalScore;

        if (finalScore > this.highScore) {
            this.highScore = finalScore;
            localStorage.setItem('highScore', this.highScore);
            this.updateHighScoreDisplay();
        }
    }

    startGame() {
        // Cancel any existing animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        console.log('Starting new game...');
        this.gameState = 'playing';
        this.startTime = Date.now();
        this.currentTime = this.startTime;
        this.totalPausedTime = 0;
        this.isUpgrading = false;
        
        // Hide screens
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        this.canvas.style.opacity = '1';

        // Initialize new game objects
        this.player = new Player(this.canvas.width/2, this.canvas.height/2, this);
        this.enemySpawner = new EnemySpawner();
        this.weaponSystem = new WeaponSystem(this);
        this.upgradeSystem = new UpgradeSystem(this.player, this.weaponSystem);

        // Set player reference in enemy spawner
        this.enemySpawner.setPlayer(this.player);
        
        // Create UI elements
        this.createExpUI();
        this.updateLivesDisplay(); // Initialize lives display

        // Setup mobile controls if on mobile
        if (this.isMobile) {
            document.getElementById('joystick-container').classList.add('playing');
            this.setupMobileControls();
        }

        // Start audio
        this.audioManager.playBGM();

        // Start game loop
        this.gameLoop();
    }

    pauseGame() {
        this.gameState = 'paused';
        this.pauseStartTime = Date.now();
        document.getElementById('pause-screen').classList.remove('hidden');
        this.canvas.style.opacity = '0.7';
    }

    resumeGame() {
        this.gameState = 'playing';
        this.totalPausedTime += Date.now() - this.pauseStartTime;
        document.getElementById('pause-screen').classList.add('hidden');
        this.canvas.style.opacity = '1';
        this.gameLoop();
    }

    createLivesDisplay() {
        const ui = document.getElementById('ui');
        this.livesDisplay = document.createElement('div');
        this.livesDisplay.id = 'lives';
        this.livesDisplay.style.marginTop = '10px';
        ui.appendChild(this.livesDisplay);
        // Initialize with empty lives (will be updated when game starts)
        this.livesDisplay.textContent = 'Lives: ';
    }

    updateLivesDisplay() {
        if (this.player) {
            this.livesDisplay.textContent = `Lives: ${'❤️'.repeat(this.player.lives)}`;
        }
    }

    checkCollisions() {
        // Only check player-enemy collisions now
        this.checkPlayerEnemyCollisions();
    }

    checkPlayerEnemyCollisions() {
        // Only check player-enemy collisions if player exists and is not invulnerable
        if (!this.player || this.player.invulnerable) return;

        for (let enemy of this.enemySpawner.enemies) {
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < (enemy.width + this.player.width) / 2) {
                if (this.player.takeDamage(this.currentTime)) {
                    this.audioManager.playHitSound();
                    const enemyIndex = this.enemySpawner.enemies.indexOf(enemy);
                    if (enemyIndex > -1) {
                        this.enemySpawner.enemies.splice(enemyIndex, 1);
                    }
                    this.updateLivesDisplay();

                    if (this.player.lives <= 0) {
                        this.gameOver();
                        return;
                    }
                }
            }
        }
    }

    gameOver() {
        // Cancel the animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.gameState = 'gameOver';
        this.audioManager.stopBGM();
        this.audioManager.playGameOverSound();

        const survivalTime = Math.floor((this.currentTime - this.startTime) / 1000);
        
        // Update high score if needed
        if (survivalTime > this.highScore) {
            this.highScore = survivalTime;
            localStorage.setItem('highScore', this.highScore);
        }

        // Clean up
        this.cleanup();

        // Show game over screen
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').textContent = survivalTime;
        document.getElementById('game-over-high-score').textContent = this.highScore;
        this.canvas.style.opacity = '0.7';

        // Disable joystick
        if (this.isMobile) {
            document.getElementById('joystick-container').classList.remove('playing');
        }
    }

    update() {
        if (this.gameState !== 'playing') return;

        this.currentTime = Date.now() - this.totalPausedTime;
        
        // Update all game objects
        if (this.player) {
            // Use joystick input for mobile, keyboard for desktop
            const input = this.isMobile ? this.joystickDirection : this.keys;
            this.player.update(input, this.currentTime, this.canvas.width, this.canvas.height);
        }

        if (this.enemySpawner) {
            this.enemySpawner.update(this.currentTime, this.canvas.width, this.canvas.height);
        }

        if (this.weaponSystem && this.enemySpawner) {
            this.weaponSystem.update(
                this.currentTime, 
                this.player.x, 
                this.player.y, 
                this.enemySpawner.enemies
            );
        }

        this.checkCollisions();
        this.updateExpUI();

        // Update timer
        document.getElementById('score').textContent = 
            `Time: ${Math.floor((this.currentTime - this.startTime) / 1000)}s`;
    }

    generateBackgroundTexture() {
        // Create an offscreen canvas for the background texture
        this.backgroundCanvas = document.createElement('canvas');
        this.backgroundCanvas.width = 200; // Size of the repeating pattern
        this.backgroundCanvas.height = 200;
        const bgCtx = this.backgroundCanvas.getContext('2d');

        // Base grass color
        bgCtx.fillStyle = '#2d5a27'; // Dark grass green
        bgCtx.fillRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);

        // Add grass texture variations
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * this.backgroundCanvas.width;
            const y = Math.random() * this.backgroundCanvas.height;
            const size = Math.random() * 4 + 1;
            
            // Randomly choose between lighter and darker grass patches
            const shade = Math.random();
            if (shade < 0.5) {
                bgCtx.fillStyle = 'rgba(65, 120, 50, 0.4)'; // Lighter grass
            } else {
                bgCtx.fillStyle = 'rgba(30, 60, 25, 0.4)'; // Darker grass
            }

            bgCtx.beginPath();
            bgCtx.arc(x, y, size, 0, Math.PI * 2);
            bgCtx.fill();
        }

        // Add some grass blade details
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * this.backgroundCanvas.width;
            const y = Math.random() * this.backgroundCanvas.height;
            const length = Math.random() * 6 + 3;
            const angle = Math.random() * Math.PI * 2;

            bgCtx.strokeStyle = 'rgba(65, 120, 50, 0.3)';
            bgCtx.lineWidth = 1;
            bgCtx.beginPath();
            bgCtx.moveTo(x, y);
            bgCtx.lineTo(
                x + Math.cos(angle) * length,
                y + Math.sin(angle) * length
            );
            bgCtx.stroke();
        }

        // Optional: Add some tiny flowers or details
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.backgroundCanvas.width;
            const y = Math.random() * this.backgroundCanvas.height;
            const size = Math.random() * 2 + 1;

            bgCtx.fillStyle = `rgba(${Math.random() < 0.5 ? '255, 255, 255' : '255, 255, 0'}, 0.3)`;
            bgCtx.beginPath();
            bgCtx.arc(x, y, size, 0, Math.PI * 2);
            bgCtx.fill();
        }
    }

    draw() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        if (this.backgroundCanvas) {
            const pattern = this.ctx.createPattern(this.backgroundCanvas, 'repeat');
            this.ctx.fillStyle = pattern;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            // Draw enemies first
            if (this.enemySpawner && this.enemySpawner.enemies.length > 0) {
                this.enemySpawner.draw(this.ctx);
            }
            
            // Draw player
            if (this.player) {
                this.player.draw(this.ctx);
            }
            
            // Draw weapon system (projectiles and explosions)
            if (this.weaponSystem) {
                this.weaponSystem.draw(this.ctx);
            }

            // Draw UI (including hearts)
            this.drawUI();
        }
    }

    gameLoop() {
        // Clear any existing animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        if (this.gameState === 'playing' && !this.isUpgrading) {
            this.update();
            this.draw();
        }

        // Request next frame
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    createExpUI() {
        const ui = document.getElementById('ui');
        
        // Create experience bar if it doesn't exist
        if (!document.getElementById('exp-bar')) {
            const expBar = document.createElement('div');
            expBar.id = 'exp-bar';
            expBar.innerHTML = `
                <div class="exp-fill"></div>
                <div class="exp-text">Level 1 (0/100 XP)</div>
            `;
            ui.appendChild(expBar);
        }
    }

    updateExpUI() {
        if (this.upgradeSystem) {
            const expBar = document.getElementById('exp-bar');
            if (expBar) {
                const expFill = expBar.querySelector('.exp-fill');
                const expText = expBar.querySelector('.exp-text');
                const percentage = (this.upgradeSystem.experience / this.upgradeSystem.expToNextLevel) * 100;
                
                expFill.style.width = `${percentage}%`;
                expText.textContent = `Level ${this.upgradeSystem.level} (${this.upgradeSystem.experience}/${this.upgradeSystem.expToNextLevel} XP)`;
            }
        }
    }

    resumeFromUpgrade() {
        this.gameState = 'playing';
        this.isUpgrading = false;
        console.log('Game resumed from upgrade');
    }

    cleanup() {
        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Remove experience bar
        const expBar = document.getElementById('exp-bar');
        if (expBar) {
            expBar.remove();
        }

        // Clear any remaining upgrade menu
        const upgradeMenu = document.querySelector('.upgrade-menu');
        if (upgradeMenu) {
            upgradeMenu.remove();
        }

        // Destroy joystick if it exists
        if (this.joystick) {
            this.joystick.destroy();
            this.joystick = null;
        }

        // Reset game objects
        this.player = null;
        this.enemySpawner = null;
        this.weaponSystem = null;
        this.upgradeSystem = null;
    }

    setupAudioControls() {
        const muteButton = document.getElementById('mute-button');
        muteButton.addEventListener('click', () => {
            this.audioManager.toggleMute();
            muteButton.textContent = this.audioManager.isMuted ? '🔈' : '🔊';
        });
    }

    drawUI() {
        // This method is now empty since we're using HTML for lives display
    }

    setupMobileControls() {
        if (!this.isMobile) return;

        console.log('Setting up mobile controls...');
        console.log('Nipplejs available:', typeof nipplejs !== 'undefined');

        const joystickContainer = document.getElementById('joystick-container');
        const options = {
            zone: joystickContainer,
            color: '#ff6600',
            size: 150,
            threshold: 0.1,
            fadeTime: 250,
            mode: 'dynamic',
            position: { left: '50%', top: '50%' },
            restJoystick: true,
            restOpacity: 0.5,
            lockX: false,
            lockY: false,
            dynamicPage: true
        };

        this.joystick = nipplejs.create(options);

        this.joystick.on('move', (evt, data) => {
            this.joystickDirection = {
                x: data.vector.x,
                y: -data.vector.y // Invert the Y-axis
            };
        });

        this.joystick.on('end', () => {
            this.joystickDirection = { x: 0, y: 0 };
        });
    }
}

// Start the game when the page loads
window.onload = () => {
    new Game();
};