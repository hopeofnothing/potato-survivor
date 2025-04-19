class UpgradeSystem {
    constructor(player, weaponSystem) {
        this.player = player;
        this.weaponSystem = weaponSystem;
        this.reset();
        console.log('Upgrade system initialized');
    }

    reset() {
        this.experience = 0;
        this.level = 1;
        this.expToNextLevel = 100;
        this.availableUpgrades = 0;
        this.upgrades = {
            frontShot: 0,
            backShot: 0,
            piercing: 0,
            explosion: 0
        };
        this.maxUpgradeLevel = 5;
    }

    addExperience(amount) {
        this.experience += amount;
        console.log(`Added ${amount} XP. Total: ${this.experience}/${this.expToNextLevel}`);
        while (this.experience >= this.expToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.experience -= this.expToNextLevel;
        this.expToNextLevel = Math.floor(this.expToNextLevel * 1.5);
        this.availableUpgrades++;
        this.player.game.audioManager.playLevelUpSound();
        this.showUpgradeMenu();
    }

    showUpgradeMenu() {
        this.player.game.isUpgrading = true;
        this.player.game.gameState = 'paused';
        
        const upgradeMenu = document.createElement('div');
        upgradeMenu.className = 'upgrade-menu';
        upgradeMenu.innerHTML = `
            <div class="upgrade-title">Level Up! Choose an upgrade:</div>
            <div class="upgrade-options">
                ${this.createUpgradeOption('frontShot', 'Forward Shot', 'Add one more forward projectile')}
                ${this.createUpgradeOption('backShot', 'Backward Shot', 'Add one more backward projectile')}
                ${this.createUpgradeOption('piercing', 'Piercing Shot', 'Projectiles pierce through one more enemy')}
                ${this.createUpgradeOption('explosion', 'Explosive Shot', 'Increase explosion AOE radius by 50%')}
            </div>
        `;

        upgradeMenu.addEventListener('click', (e) => {
            const option = e.target.closest('.upgrade-option');
            if (option) {
                const upgradeType = option.dataset.upgradeType;
                if (upgradeType) {
                    this.selectUpgrade(upgradeType);
                }
            }
        });

        document.body.appendChild(upgradeMenu);
    }

    createUpgradeOption(type, title, description) {
        if (this.upgrades[type] >= this.maxUpgradeLevel) {
            return '';
        }

        let currentEffect = '';
        switch(type) {
            case 'piercing':
                currentEffect = `Current: Pierce ${this.weaponSystem.piercing} enemies`;
                break;
            case 'explosion':
                const radius = 50 * (1 + this.upgrades.explosion * 0.5);
                currentEffect = `Current: ${Math.round(radius)} AOE radius`;
                break;
            case 'frontShot':
                currentEffect = `Current: ${this.weaponSystem.frontProjectiles} projectiles`;
                break;
            case 'backShot':
                currentEffect = `Current: ${this.weaponSystem.backProjectiles} projectiles`;
                break;
        }

        return `
            <div class="upgrade-option" data-upgrade-type="${type}">
                <div class="upgrade-name">${title}</div>
                <div class="upgrade-description">${description}</div>
                <div class="upgrade-current">${currentEffect}</div>
                <div class="upgrade-level">Level: ${this.upgrades[type]}/${this.maxUpgradeLevel}</div>
            </div>
        `;
    }

    selectUpgrade(type) {
        if (this.availableUpgrades > 0 && this.upgrades[type] < this.maxUpgradeLevel) {
            this.upgrades[type]++;
            this.availableUpgrades--;
            
            // Apply upgrade effects
            switch(type) {
                case 'frontShot':
                    this.weaponSystem.frontProjectiles++;
                    break;
                case 'backShot':
                    this.weaponSystem.backProjectiles++;
                    break;
                case 'piercing':
                    this.weaponSystem.piercing++;
                    break;
                case 'explosion':
                    this.weaponSystem.explosionLevel++;
                    break;
            }

            // Remove upgrade menu and resume game
            const menu = document.querySelector('.upgrade-menu');
            if (menu) {
                menu.remove();
            }
            setTimeout(() => {
                this.player.game.resumeFromUpgrade();
            }, 100);
        }
    }
}
