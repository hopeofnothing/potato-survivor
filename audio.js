class AudioManager {
    constructor() {
        // Background Music
        this.bgm = new Audio();
        this.bgm.src = 'assets/bgm.mp3';
        this.bgm.loop = true;
        this.bgm.volume = 0.3;

        // Sound Effects
        this.hitSound = new Audio('assets/hit.mp3');
        this.hitSound.volume = 0.4;

        this.levelUpSound = new Audio('assets/levelup.mp3');
        this.levelUpSound.volume = 0.4;

        this.gameOverSound = new Audio('assets/gameover.mp3');
        this.gameOverSound.volume = 0.4;

        this.healSound = new Audio('assets/heal.mp3');
        this.healSound.volume = 0.4;

        this.isMuted = false;
    }

    playBGM() {
        if (!this.isMuted) {
            this.bgm.play();
        }
    }

    stopBGM() {
        this.bgm.pause();
        this.bgm.currentTime = 0;
    }

    playHitSound() {
        if (!this.isMuted) {
            const sound = this.hitSound.cloneNode();
            sound.play();
        }
    }

    playLevelUpSound() {
        if (!this.isMuted) {
            const sound = this.levelUpSound.cloneNode();
            sound.play();
        }
    }

    playGameOverSound() {
        if (!this.isMuted) {
            const sound = this.gameOverSound.cloneNode();
            sound.play();
        }
    }

    playPickupSound() {
        if (!this.isMuted) {
            const sound = this.healSound.cloneNode();
            sound.play();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.bgm.muted = this.isMuted;
    }
}
