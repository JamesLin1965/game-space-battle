import * as PIXI from 'pixi.js';

export class Bullet {
    private sprite: PIXI.Sprite;
    private speed: number = 10; // 提高子彈速度
    private app: PIXI.Application;

    constructor(app: PIXI.Application, x: number, y: number) {
        this.app = app;
        
        // 創建子彈精靈
        this.sprite = PIXI.Sprite.from('assets/images/bullet.png');
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.3);
        
        // 設置初始位置
        this.sprite.x = x;
        this.sprite.y = y;
        
        // 添加到舞台
        this.app.stage.addChild(this.sprite);
    }

    public update(): void {
        // 向上移動
        this.sprite.y -= this.speed;
    }

    public isOutOfScreen(): boolean {
        return this.sprite.y < -this.sprite.height;
    }

    public destroy(): void {
        this.app.stage.removeChild(this.sprite);
        this.sprite.destroy();
    }

    public getSprite(): PIXI.Sprite {
        return this.sprite;
    }
} 