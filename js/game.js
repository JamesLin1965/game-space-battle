class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false }); // 禁用 alpha 通道以提升性能
        this.player = new Player();
        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        this.stars = Array.from({length: 30}, () => new Star()); // 減少星星數量
        this.lastEnemySpawn = 0;
        this.enemySpawnInterval = CONFIG.ENEMY_SPAWN_INTERVAL;
        this.pressedKeys = new Set();
        this.difficultyLevel = 1;
        this.animationFrameId = null;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.isPaused = false;
        
        // 性能優化：限制最大物體數量
        this.maxEnemies = 10;
        this.maxPlayerBullets = 15;
        this.maxEnemyBullets = 20;
        
        this.meteors = [];
        this.lastMeteorSpawn = 0;
        this.maxMeteors = 5;

        // 添加滑鼠控制相關變量
        this.isMouseControl = false;
        this.targetX = this.player.x;
        this.targetY = this.player.y;
        this.isMouseDown = false; // 添加滑鼠按下狀態追踪
     
        // 保存暫停時的遊戲狀態
        this.pausedState = null;

        this.bindEvents();
    }

    bindEvents() {
        // 鍵盤控制
        window.addEventListener('keydown', (e) => {
            console.log('Key pressed:', e.key); // 調試信息
            this.pressedKeys.add(e.key);
            
            // 暫停功能 (空格鍵)
            if (e.key === ' ') {
                e.preventDefault(); // 防止空格鍵滾動頁面
                console.log('Toggle pause');
                this.togglePause();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.pressedKeys.delete(e.key);
        });

        // 添加滑鼠移動事件監聽
        this.canvas.addEventListener('mousemove', (e) => {
            if (GameStateManager.currentState === CONFIG.GAME_STATES.PLAYING) {
                const rect = this.canvas.getBoundingClientRect();
                this.isMouseControl = true;
                this.targetX = e.clientX - rect.left - this.player.width / 2;
                this.targetY = e.clientY - rect.top - this.player.height / 2;
            }
        });

        // 添加滑鼠按下和放開事件
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // 左鍵
                this.isMouseDown = true;
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) { // 左鍵
                this.isMouseDown = false;
            }
        });

        // 滑鼠離開畫布時停用滑鼠控制和射擊
        this.canvas.addEventListener('mouseout', () => {
            this.isMouseControl = false;
            this.isMouseDown = false;
        });

        // 按鈕控制
        document.getElementById('start-button').addEventListener('click', () => {
            console.log('Game starting'); // 調試信息
            this.start();
        });
        document.getElementById('pause-button').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-button').addEventListener('click', () => this.restart());
        document.getElementById('play-again').addEventListener('click', () => this.restart());
        document.getElementById('sound-toggle').addEventListener('click', () => {
            const muted = SoundManager.toggleMute();
            document.getElementById('sound-toggle').textContent = `音效: ${muted ? '關' : '開'}`;
        });
    }

    start() {
        console.log('Game starting');
        GameStateManager.setState(CONFIG.GAME_STATES.PLAYING);
        SoundManager.play('fire'); // 改為播放 fire 音效
        this.lastFrameTime = 0;
        if (!this.animationFrameId) {
            this.gameLoop(performance.now());
        }
    }

    togglePause() {
        if (GameStateManager.currentState === CONFIG.GAME_STATES.PLAYING) {
            // 暫停遊戲
            this.isPaused = true;
            GameStateManager.setState(CONFIG.GAME_STATES.PAUSED);
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            SoundManager.stopAll();
        } else if (GameStateManager.currentState === CONFIG.GAME_STATES.PAUSED) {
            // 繼續遊戲
            this.isPaused = false;
            GameStateManager.setState(CONFIG.GAME_STATES.PLAYING);
            SoundManager.play('fire');
            this.lastFrameTime = performance.now();
            this.gameLoop(this.lastFrameTime);
        }
    }

    restart() {
        // 重置遊戲對象
        this.player = new Player();
        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        this.lastEnemySpawn = 0;
        this.enemySpawnInterval = CONFIG.ENEMY_SPAWN_INTERVAL;
        this.difficultyLevel = 1;
        
        // 重置分數
        ScoreManager.reset();
        
        // 重置到初始狀態
        GameStateManager.setState(CONFIG.GAME_STATES.MENU);
        
        // 重置音效並播放初始背景音樂
        SoundManager.stopAll();
        
        // 顯示開始畫面並禁用開始按鈕
        document.getElementById('start-screen').style.display = 'flex';
        document.getElementById('start-button').disabled = true;
        
        // 播放初始背景音樂
        const bgm = document.getElementById('bgm');
        if (bgm) {
            bgm.currentTime = 0;
            bgm.play().catch(err => console.log('背景音樂播放失敗:', err));
        }
        
        // 取消動畫循環
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    gameLoop(currentTime) {
        // 如果不是在遊戲中狀態，不執行遊戲循環
        if (GameStateManager.currentState !== CONFIG.GAME_STATES.PLAYING) {
            return;
        }

        // 計算幀時間差
        if (!this.lastFrameTime) this.lastFrameTime = currentTime;
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        // 如果遊戲沒有暫停，才更新遊戲狀態
        if (!this.isPaused) {
            this.update(deltaTime);
        }
        
        // 繪製遊戲畫面
        this.draw();

        // 請求下一幀
        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // 使用 deltaTime 來平滑更新
        const timeScale = deltaTime / 16.67; // 基於 60FPS 的時間比例

        // 更新玩家位置
        if (this.isMouseControl) {
            // 滑鼠控制
            const dx = this.targetX - this.player.x;
            const dy = this.targetY - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 1) {
                const moveSpeed = Math.min(distance, this.player.speed * timeScale);
                const ratio = moveSpeed / distance;
                
                this.player.x += dx * ratio;
                this.player.y += dy * ratio;
                
                // 確保飛船不會超出畫布範圍
                this.player.x = Math.max(0, Math.min(CONFIG.CANVAS_WIDTH - this.player.width, this.player.x));
                this.player.y = Math.max(0, Math.min(CONFIG.CANVAS_HEIGHT - this.player.height, this.player.y));
            }
        } else {
            // 鍵盤控制
            if (this.pressedKeys.has('ArrowUp')) this.player.move('up', timeScale);
            if (this.pressedKeys.has('ArrowDown')) this.player.move('down', timeScale);
            if (this.pressedKeys.has('ArrowLeft')) this.player.move('left', timeScale);
            if (this.pressedKeys.has('ArrowRight')) this.player.move('right', timeScale);
        }

        // 檢查射擊條件（滑鼠左鍵或F鍵）
        if ((this.isMouseDown || this.pressedKeys.has('f')) && 
            GameStateManager.currentState === CONFIG.GAME_STATES.PLAYING) {
            const bullets = this.player.shoot();
            if (bullets && Array.isArray(bullets)) {
                const availableSlots = this.maxPlayerBullets - this.playerBullets.length;
                const bulletsToAdd = bullets.slice(0, availableSlots);
                this.playerBullets.push(...bulletsToAdd);
            }
        }

        // 更新星星
        this.stars.forEach(star => star.move(timeScale));

        // 生成敵人和隕石
        const currentTime = performance.now();
        if (currentTime - this.lastEnemySpawn > this.enemySpawnInterval && 
            this.enemies.length < this.maxEnemies) {
            const enemyType = Math.random() < 0.7 ? 'BASIC' : 'ADVANCED';
            this.enemies.push(new Enemy(enemyType));
            this.lastEnemySpawn = currentTime;
        }
        
        if (currentTime - this.lastMeteorSpawn > CONFIG.METEOR.SPAWN_INTERVAL && 
            this.meteors.length < this.maxMeteors) {
            this.meteors.push(new Meteor());
            this.lastMeteorSpawn = currentTime;
        }

        // 更新敵人
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.move(timeScale)) {
                this.enemies.splice(i, 1);
            } else if (this.enemyBullets.length < this.maxEnemyBullets) {
                const bullet = enemy.shoot();
                if (bullet) this.enemyBullets.push(bullet);
            }
        }

        // 更新隕石
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            if (this.meteors[i].move(timeScale)) {
                this.meteors.splice(i, 1);
            }
        }

        // 更新子彈
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            if (this.playerBullets[i].move(timeScale)) {
                this.playerBullets.splice(i, 1);
            }
        }
        
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            if (this.enemyBullets[i].move(timeScale)) {
                this.enemyBullets.splice(i, 1);
            }
        }

        // 檢查碰撞
        this.checkCollisions();

        // 更新難度
        this.updateDifficulty();
    }

    checkCollisions() {
        const playerHitbox = {
            x: this.player.x + this.player.width * 0.2,
            y: this.player.y + this.player.height * 0.2,
            width: this.player.width * 0.6,
            height: this.player.height * 0.6
        };

        // 玩家子彈與敵人碰撞
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (checkCollision(bullet, enemy)) {
                    this.playerBullets.splice(i, 1);
                    this.enemies.splice(j, 1);
                    ScoreManager.add(enemy.points);
                    SoundManager.play('explosion');
                    break;
                }
            }
        }

        // 玩家子彈與隕石碰撞
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            for (let j = this.meteors.length - 1; j >= 0; j--) {
                const meteor = this.meteors[j];
                if (checkCollision(bullet, meteor)) {
                    this.playerBullets.splice(i, 1);
                    this.meteors.splice(j, 1);
                    ScoreManager.add(meteor.points);
                    SoundManager.play('explosion');
                    break;
                }
            }
        }

        // 敵人子彈與玩家碰撞
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            if (checkCollision(this.enemyBullets[i], playerHitbox)) {
                this.enemyBullets.splice(i, 1);
                this.handlePlayerHit();
                break;
            }
        }

        // 玩家與敵人碰撞
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (checkCollision(this.enemies[i], playerHitbox)) {
                this.enemies.splice(i, 1);
                this.handlePlayerHit();
                break;
            }
        }

        // 玩家與隕石碰撞
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            if (checkCollision(this.meteors[i], playerHitbox)) {
                this.meteors.splice(i, 1);
                this.handlePlayerHit();
                break;
            }
        }
    }

    handlePlayerHit() {
        SoundManager.play('hurt'); // 播放受傷音效
        if (this.player.takeDamage()) {
            SoundManager.play('explosion'); // 如果玩家死亡，播放爆炸音效
            this.gameOver();
        }
    }

    updateDifficulty() {
        const currentLevel = Math.floor(ScoreManager.getScore() / CONFIG.DIFFICULTY.SCORE_THRESHOLD) + 1;
        if (currentLevel > this.difficultyLevel) {
            this.difficultyLevel = currentLevel;
            this.enemySpawnInterval *= CONFIG.DIFFICULTY.SPAWN_RATE_INCREASE;
            this.enemies.forEach(enemy => {
                enemy.speed *= CONFIG.DIFFICULTY.SPEED_INCREASE;
            });
            // 更新玩家子彈行數
            this.player.updateBulletRows(this.difficultyLevel);
        }
    }

    gameOver() {
        GameStateManager.setState(CONFIG.GAME_STATES.GAME_OVER);
        SoundManager.playGameOver(); // 播放遊戲結束音樂
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
    }

    draw() {
        // 清空畫布
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 繪製遊戲物體
        this.stars.forEach(star => star.draw(this.ctx));
        this.player.draw(this.ctx);
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.playerBullets.forEach(bullet => bullet.draw(this.ctx));
        this.enemyBullets.forEach(bullet => bullet.draw(this.ctx));
        this.meteors.forEach(meteor => meteor.draw(this.ctx));
    }
} 