import * as PIXI from 'pixi.js';
import { Bullet } from './Bullet';
import { SoundManager } from '../../audio/SoundManager';

export class Player {
    private sprite: PIXI.Sprite;
    private bullets: Bullet[] = [];
    private lives: number = 3;
    private speed: number = 5;
    private app: PIXI.Application;
    private canShoot: boolean = true;
    private shootCooldown: number = 150; // 降低射擊冷卻時間
    private isShooting: boolean = false; // 新增：追踪是否正在射擊
    private lastShootTime: number = 0; // 新增：記錄上次射擊時間

    constructor(app: PIXI.Application) {
        this.app = app;
        
        // 創建玩家精靈
        this.sprite = PIXI.Sprite.from('assets/images/player.png');
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.5);
        
        // 設置初始位置
        this.reset();
        
        // 添加到舞台
        this.app.stage.addChild(this.sprite);
        
        // 設置鍵盤事件
        this.setupKeyboardEvents();
    }

    private setupKeyboardEvents(): void {
        // 按鍵按下事件
        window.addEventListener('keydown', (e: KeyboardEvent) => {
            switch(e.key.toLowerCase()) { // 轉換為小寫以支援大小寫
                case 'arrowleft':
                    this.moveLeft();
                    break;
                case 'arrowright':
                    this.moveRight();
                    break;
                case ' ':
                    this.shoot();
                    break;
                case 'f': // 新增：按下 F 鍵開始連續射擊
                    this.isShooting = true;
                    break;
            }
        });

        // 新增：按鍵釋放事件
        window.addEventListener('keyup', (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'f') {
                this.isShooting = false;
            }
        });
    }

    private moveLeft(): void {
        if (this.sprite.x > this.sprite.width / 2) {
            this.sprite.x -= this.speed;
        }
    }

    private moveRight(): void {
        if (this.sprite.x < this.app.screen.width - this.sprite.width / 2) {
            this.sprite.x += this.speed;
        }
    }

    private shoot(): void {
        const currentTime = Date.now();
        if (currentTime - this.lastShootTime >= this.shootCooldown) {
            // 創建新子彈
            const bullet = new Bullet(
                this.app,
                this.sprite.x,
                this.sprite.y - this.sprite.height / 2
            );
            this.bullets.push(bullet);
            
            // 播放射擊音效
            SoundManager.getInstance().playSound('shoot');
            
            // 更新上次射擊時間
            this.lastShootTime = currentTime;
        }
    }

    public update(): void {
        // 處理連續射擊
        if (this.isShooting) {
            this.shoot();
        }

        // 更新子彈
        this.bullets = this.bullets.filter(bullet => {
            bullet.update();
            // 移除超出螢幕的子彈
            if (bullet.isOutOfScreen()) {
                bullet.destroy();
                return false;
            }
            return true;
        });
    }

    public reset(): void {
        // 重置玩家位置
        this.sprite.x = this.app.screen.width / 2;
        this.sprite.y = this.app.screen.height - 100;
        
        // 清除所有子彈
        this.bullets.forEach(bullet => bullet.destroy());
        this.bullets = [];
        
        // 重置生命值和射擊狀態
        this.lives = 3;
        this.isShooting = false;
        this.lastShootTime = 0;
    }

    public takeDamage(): void {
        this.lives--;
        if (this.lives <= 0) {
            // 播放爆炸音效
            SoundManager.getInstance().playSound('explosion');
        }
    }

    public getLives(): number {
        return this.lives;
    }

    public getSprite(): PIXI.Sprite {
        return this.sprite;
    }

    public getBullets(): Bullet[] {
        return this.bullets;
    }
} 