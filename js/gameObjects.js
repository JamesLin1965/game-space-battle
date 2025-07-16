// 基礎遊戲對象類
class GameObject {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// 玩家類
class Player extends GameObject {
    constructor() {
        super(
            50,
            CONFIG.CANVAS_HEIGHT / 2 - CONFIG.PLAYER_SIZE / 2,
            CONFIG.PLAYER_SIZE,
            CONFIG.PLAYER_SIZE,
            '#00ff00'
        );
        this.speed = CONFIG.PLAYER_SPEED;
        this.lives = CONFIG.PLAYER_INITIAL_LIVES;
        this.lastShootTime = 0;
        this.bulletRows = 1; // 初始子彈行數
    }

    move(direction, timeScale) {
        const moveAmount = this.speed * timeScale;
        switch(direction) {
            case 'up':
                this.y = Math.max(0, this.y - moveAmount);
                break;
            case 'down':
                this.y = Math.min(CONFIG.CANVAS_HEIGHT - this.height, this.y + moveAmount);
                break;
            case 'left':
                this.x = Math.max(0, this.x - moveAmount);
                break;
            case 'right':
                this.x = Math.min(CONFIG.CANVAS_WIDTH - this.width, this.x + moveAmount);
                break;
        }
    }

    canShoot() {
        return Date.now() - this.lastShootTime > CONFIG.PLAYER_SHOOT_DELAY;
    }

    shoot() {
        if (!this.canShoot()) return null;
        
        this.lastShootTime = Date.now();
        SoundManager.play('shoot');
        
        const bullets = [];
        const spacing = 15; // 子彈行間距
        
        // 根據bulletRows計算每行子彈的位置
        for (let i = 0; i < this.bulletRows; i++) {
            const offset = (this.bulletRows - 1) * spacing / 2;
            const yPos = this.y + this.height / 2 - CONFIG.PLAYER_BULLET_SIZE / 2 + (i * spacing) - offset;
            
            bullets.push(new Bullet(
                this.x + this.width,
                yPos,
                CONFIG.PLAYER_BULLET_SIZE,
                CONFIG.PLAYER_BULLET_SIZE,
                CONFIG.PLAYER_BULLET_SPEED,
                '#00ff00',
                true
            ));
        }
        
        return bullets;
    }

    // 新增方法：更新子彈行數
    updateBulletRows(difficultyLevel) {
        this.bulletRows = difficultyLevel;
    }

    takeDamage() {
        this.lives--;
        return this.lives <= 0;
    }

    draw(ctx) {
        ctx.save();
        
        // 設置玩家飛船的樣式
        ctx.fillStyle = '#00ff00';
        ctx.strokeStyle = '#00aa00';
        ctx.lineWidth = 2;
        
        // 開始繪製玩家飛船
        ctx.beginPath();
        
        // 飛船主體
        ctx.moveTo(this.x + this.width, this.y + this.height / 2); // 機頭
        ctx.lineTo(this.x + this.width * 0.2, this.y); // 上邊
        ctx.lineTo(this.x, this.y + this.height * 0.3); // 左上
        ctx.lineTo(this.x, this.y + this.height * 0.7); // 左下
        ctx.lineTo(this.x + this.width * 0.2, this.y + this.height); // 下邊
        ctx.lineTo(this.x + this.width, this.y + this.height / 2); // 回到機頭
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 添加艙室
        ctx.beginPath();
        ctx.fillStyle = '#80ff80';
        const cockpitX = this.x + this.width * 0.6;
        const cockpitY = this.y + this.height * 0.3;
        const cockpitWidth = this.width * 0.2;
        const cockpitHeight = this.height * 0.4;
        ctx.ellipse(
            cockpitX,
            cockpitY + cockpitHeight/2,
            cockpitWidth/2,
            cockpitHeight/2,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // 添加引擎效果
        ctx.beginPath();
        const engineGlow = ctx.createLinearGradient(
            this.x,
            this.y + this.height * 0.3,
            this.x - this.width * 0.3,
            this.y + this.height * 0.3
        );
        engineGlow.addColorStop(0, '#00ff00');
        engineGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = engineGlow;
        
        ctx.moveTo(this.x, this.y + this.height * 0.3);
        ctx.lineTo(this.x - this.width * 0.3, this.y + this.height * 0.4);
        ctx.lineTo(this.x - this.width * 0.3, this.y + this.height * 0.6);
        ctx.lineTo(this.x, this.y + this.height * 0.7);
        ctx.fill();

        ctx.restore();

        // 更新生命值顯示
        document.getElementById('lives').textContent = `生命: ${this.lives}`;
    }
}

// 敵人類
class Enemy extends GameObject {
    constructor(type) {
        const enemyConfig = CONFIG.ENEMY_TYPES[type];
        if (!enemyConfig) {
            console.error('Invalid enemy type:', type);
            return;
        }
        
        const yPosition = random(0, CONFIG.CANVAS_HEIGHT - enemyConfig.size);
        super(
            CONFIG.CANVAS_WIDTH,
            yPosition,
            enemyConfig.size,
            enemyConfig.size,
            enemyConfig.color
        );
        
        this.type = type;
        this.speed = enemyConfig.speed;
        this.points = enemyConfig.points;
        this.shootProbability = enemyConfig.shootProbability;
    }

    move(timeScale) {
        this.x -= this.speed * timeScale;
        return this.x + this.width < 0;
    }

    shoot() {
        if (Math.random() < this.shootProbability) {
            console.log('Enemy shooting'); // 調試信息
            return new Bullet(
                this.x,
                this.y + this.height / 2 - CONFIG.ENEMY_BULLET_SIZE / 2,
                CONFIG.ENEMY_BULLET_SIZE,
                CONFIG.ENEMY_BULLET_SIZE,
                CONFIG.ENEMY_BULLET_SPEED,
                '#ff0000',
                false
            );
        }
        return null;
    }

    draw(ctx) {
        ctx.save();
        
        // 根據敵人類型設置不同的外觀
        if (this.type === 'BASIC') {
            // 基礎敵人 - 三角形設計
            ctx.beginPath();
            ctx.fillStyle = '#ff0000';
            ctx.strokeStyle = '#aa0000';
            ctx.lineWidth = 2;
            
            // 畫三角形主體
            ctx.moveTo(this.x, this.y + this.height / 2);
            ctx.lineTo(this.x + this.width, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 添加裝飾線條
            ctx.beginPath();
            ctx.strokeStyle = '#ff4444';
            ctx.moveTo(this.x + this.width * 0.3, this.y + this.height * 0.3);
            ctx.lineTo(this.x + this.width * 0.8, this.y + this.height * 0.3);
            ctx.moveTo(this.x + this.width * 0.3, this.y + this.height * 0.7);
            ctx.lineTo(this.x + this.width * 0.8, this.y + this.height * 0.7);
            ctx.stroke();
        } else {
            // 進階敵人 - 六邊形設計
            ctx.beginPath();
            ctx.fillStyle = '#ff6600';
            ctx.strokeStyle = '#cc5200';
            ctx.lineWidth = 2;
            
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            const radius = this.width / 2;
            
            // 畫六邊形
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 添加中心圓
            ctx.beginPath();
            ctx.fillStyle = '#ff8533';
            ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// 子彈類
class Bullet extends GameObject {
    constructor(x, y, width, height, speed, color, isPlayerBullet) {
        super(x, y, width, height, color);
        this.speed = speed;
        this.isPlayerBullet = isPlayerBullet;
    }

    move(timeScale) {
        const moveAmount = this.speed * timeScale;
        if (this.isPlayerBullet) {
            this.x += moveAmount;
            return this.x > CONFIG.CANVAS_WIDTH;
        } else {
            this.x -= moveAmount;
            return this.x + this.width < 0;
        }
    }

    draw(ctx) {
        ctx.save();
        
        // 根據子彈類型設置不同的外觀
        if (this.isPlayerBullet) {
            // 玩家子彈 - 能量球效果
            const gradient = ctx.createRadialGradient(
                this.x + this.width/2, this.y + this.height/2, 0,
                this.x + this.width/2, this.y + this.height/2, this.width/2
            );
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.3, '#00ff00');
            gradient.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.fillStyle = gradient;
            ctx.arc(
                this.x + this.width/2,
                this.y + this.height/2,
                this.width,
                0,
                Math.PI * 2
            );
            ctx.fill();
        } else {
            // 敵人子彈 - 紅色雷射效果
            const gradient = ctx.createRadialGradient(
                this.x + this.width/2, this.y + this.height/2, 0,
                this.x + this.width/2, this.y + this.height/2, this.width/2
            );
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.3, '#ff0000');
            gradient.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.fillStyle = gradient;
            ctx.arc(
                this.x + this.width/2,
                this.y + this.height/2,
                this.width/2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// 背景星星類
class Star {
    constructor() {
        this.reset();
        this.x = random(0, CONFIG.CANVAS_WIDTH);
    }

    reset() {
        this.x = CONFIG.CANVAS_WIDTH;
        this.y = random(0, CONFIG.CANVAS_HEIGHT);
        this.size = random(1, 2); // 減小星星大小
        this.speed = random(0.5, 2); // 減慢星星速度
    }

    move(timeScale) {
        this.x -= this.speed * timeScale;
        if (this.x + this.size < 0) {
            this.reset();
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
} 

// 隕石類
class Meteor extends GameObject {
    constructor() {
        const size = random(CONFIG.METEOR.MIN_SIZE, CONFIG.METEOR.MAX_SIZE);
        super(
            CONFIG.CANVAS_WIDTH,
            random(0, CONFIG.CANVAS_HEIGHT - size),
            size,
            size,
            CONFIG.METEOR.COLOR
        );
        this.speed = random(CONFIG.METEOR.MIN_SPEED, CONFIG.METEOR.MAX_SPEED);
        this.rotation = random(0, Math.PI * 2);
        this.points = CONFIG.METEOR.POINTS;
    }

    move(timeScale) {
        this.x -= this.speed * timeScale;
        this.rotation += CONFIG.METEOR.ROTATION_SPEED * timeScale;
        return this.x + this.width < 0;
    }

    draw(ctx) {
        ctx.save();
        
        // 設置隕石的中心點
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // 移動到中心點並旋轉
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        
        // 繪製不規則的多邊形（隕石形狀）
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#606060';
        ctx.lineWidth = 2;
        
        // 創建不規則的多邊形頂點
        const points = 8; // 8個頂點
        const radius = this.width / 2;
        for (let i = 0; i < points; i++) {
            const angle = (i * 2 * Math.PI) / points;
            const randomRadius = radius * random(0.7, 1.1); // 隨機調整每個頂點的半徑
            const x = randomRadius * Math.cos(angle);
            const y = randomRadius * Math.sin(angle);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 添加隕石表面的細節（裂縫和凹坑）
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            const crackAngle = random(0, Math.PI * 2);
            const crackDistance = random(radius * 0.3, radius * 0.7);
            const x1 = crackDistance * Math.cos(crackAngle);
            const y1 = crackDistance * Math.sin(crackAngle);
            const x2 = (crackDistance + random(5, 15)) * Math.cos(crackAngle);
            const y2 = (crackDistance + random(5, 15)) * Math.sin(crackAngle);
            
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = '#606060';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        ctx.restore();
    }
} 