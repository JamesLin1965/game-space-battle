// 碰撞檢測
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// 隨機數生成
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// 音效控制
const SoundManager = {
    muted: false,
    sounds: {},
    currentBGM: null,

    init() {
        // 初始化音效系統
        this.sounds = {
            'fire': new Audio('assets/sounds/fire.mp3'),
            'shoot': new Audio('assets/sounds/shoot.mp3'),
            'explosion': new Audio('assets/sounds/explosion.mp3'),
            'hurt': new Audio('assets/sounds/hurt-sound.mp3'),
            'game-over': new Audio('assets/sounds/game-over-sound.mp3')
        };

        // 設置音量
        Object.entries(this.sounds).forEach(([key, sound]) => {
            if (key === 'fire') {
                sound.volume = CONFIG.SOUND.BGM_VOLUME;
                sound.loop = true;
            } else if (key === 'game-over') {
                sound.volume = CONFIG.SOUND.BGM_VOLUME; // 遊戲結束音樂使用背景音樂音量
            } else {
                sound.volume = CONFIG.SOUND.SFX_VOLUME;
            }
        });

        // 獲取HTML中的背景音樂元素
        const bgm = document.getElementById('bgm');
        if (bgm) {
            bgm.volume = CONFIG.SOUND.BGM_VOLUME;
        }
    },

    play(soundId) {
        if (this.muted || !this.sounds[soundId]) return;
        
        // 如果是背景音樂，需要特殊處理
        if (soundId === 'fire') {
            this.switchBGM(soundId);
        } else {
            // 一般音效：重置並播放
            const sound = this.sounds[soundId];
            sound.currentTime = 0;
            sound.play().catch(err => console.log('音效播放失敗:', err));
        }
    },

    switchBGM(soundId) {
        const bgm = document.getElementById('bgm');
        
        // 停止HTML背景音樂
        if (bgm) {
            bgm.pause();
        }

        // 停止當前播放的遊戲背景音樂
        if (this.currentBGM && this.sounds[this.currentBGM]) {
            this.sounds[this.currentBGM].pause();
            this.sounds[this.currentBGM].currentTime = 0;
        }
        
        // 播放新的背景音樂
        if (soundId && this.sounds[soundId]) {
            this.currentBGM = soundId;
            this.sounds[soundId].play().catch(err => console.log('背景音樂播放失敗:', err));
        }
    },

    toggleMute() {
        this.muted = !this.muted;
        
        // 更新所有音效的靜音狀態
        Object.values(this.sounds).forEach(sound => {
            sound.muted = this.muted;
        });
        
        return this.muted;
    },

    stopAll() {
        // 停止HTML背景音樂
        const bgm = document.getElementById('bgm');
        if (bgm) {
            bgm.pause();
            bgm.currentTime = 0;
        }

        // 停止所有遊戲音效
        Object.values(this.sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
        this.currentBGM = null;
    },

    playGameOver() {
        // 停止所有音效
        this.stopAll();
        
        // 播放遊戲結束音樂
        if (this.sounds['game-over'] && !this.muted) {
            this.sounds['game-over'].currentTime = 0;
            this.sounds['game-over'].play().catch(err => console.log('遊戲結束音樂播放失敗:', err));
        }
    }
};

// 分數管理
const ScoreManager = {
    currentScore: 0,
    highScore: localStorage.getItem('highScore') || 0,

    reset() {
        this.currentScore = 0;
        this.updateDisplay();
    },

    add(points) {
        this.currentScore += points;
        if (this.currentScore > this.highScore) {
            this.highScore = this.currentScore;
            localStorage.setItem('highScore', this.highScore);
        }
        this.updateDisplay();
        return this.currentScore;
    },

    updateDisplay() {
        document.getElementById('score').textContent = `分數: ${this.currentScore}`;
    },

    getScore() {
        return this.currentScore;
    }
};

// 遊戲狀態管理
const GameStateManager = {
    currentState: CONFIG.GAME_STATES.MENU,

    setState(newState) {
        this.currentState = newState;
        this.updateUI();
        this.updateBGM(newState);
    },

    updateBGM(state) {
        switch (state) {
            case CONFIG.GAME_STATES.MENU:
                // 菜單狀態使用 HTML audio 元素播放的背景音樂
                break;
            case CONFIG.GAME_STATES.PLAYING:
                SoundManager.play('fire');
                break;
            case CONFIG.GAME_STATES.GAME_OVER:
                SoundManager.playGameOver();
                break;
        }
    },

    updateUI() {
        const startButton = document.getElementById('start-button');
        const pauseButton = document.getElementById('pause-button');
        const restartButton = document.getElementById('restart-button');
        const gameOverScreen = document.getElementById('game-over');

        switch (this.currentState) {
            case CONFIG.GAME_STATES.MENU:
                startButton.style.display = 'inline-block';
                pauseButton.style.display = 'none';
                restartButton.style.display = 'none';
                gameOverScreen.style.display = 'none';
                break;
            case CONFIG.GAME_STATES.PLAYING:
                startButton.style.display = 'none';
                pauseButton.style.display = 'inline-block';
                pauseButton.textContent = '暫停';
                restartButton.style.display = 'inline-block';
                gameOverScreen.style.display = 'none';
                break;
            case CONFIG.GAME_STATES.PAUSED:
                pauseButton.textContent = '繼續';
                break;
            case CONFIG.GAME_STATES.GAME_OVER:
                startButton.style.display = 'none';
                pauseButton.style.display = 'none';
                restartButton.style.display = 'inline-block';
                gameOverScreen.style.display = 'block';
                document.getElementById('final-score').textContent = ScoreManager.getScore();
                break;
        }
    }
}; 