const CONFIG = {
    // 遊戲畫布設置
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 400, // 修改為 400
    FPS: 60,

    // 玩家設置
    PLAYER_SPEED: 5,
    PLAYER_SIZE: 40,
    PLAYER_INITIAL_LIVES: 3,
    PLAYER_BULLET_SPEED: 7,
    PLAYER_BULLET_SIZE: 8,
    PLAYER_SHOOT_DELAY: 250, // 毫秒

    // 敵人設置
    ENEMY_TYPES: {
        BASIC: {
            speed: 3,
            size: 30,
            points: 10,
            color: '#ff0000',
            shootProbability: 0.01
        },
        ADVANCED: {
            speed: 4,
            size: 40,
            points: 20,
            color: '#ff6600',
            shootProbability: 0.02
        }
    },
    ENEMY_BULLET_SPEED: 5,
    ENEMY_BULLET_SIZE: 6,
    ENEMY_SPAWN_INTERVAL: 2000, // 毫秒

    // 難度設置
    DIFFICULTY: {
        SPAWN_RATE_INCREASE: 0.9, // 每次提高難度時，生成間隔減少的比例
        SPEED_INCREASE: 1.1, // 每次提高難度時，速度增加的比例
        SCORE_THRESHOLD: 100 // 每獲得100分提高一次難度
    },

    // 碰撞檢測
    COLLISION_DAMAGE: 1,

    // 音效設置
    SOUND: {
        BGM_VOLUME: 0.3,
        SFX_VOLUME: 0.5
    },

    // 遊戲狀態
    GAME_STATES: {
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'gameOver'
    },

    // 隕石設置
    METEOR: {
        MIN_SIZE: 20,
        MAX_SIZE: 50,
        MIN_SPEED: 2,
        MAX_SPEED: 4,
        SPAWN_INTERVAL: 3000, // 毫秒
        ROTATION_SPEED: 0.02, // 每幀旋轉速度
        COLOR: '#808080', // 灰色
        POINTS: 5 // 擊毀獲得的分數
    }
}; 