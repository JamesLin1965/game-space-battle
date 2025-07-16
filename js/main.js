// 等待DOM加載完成
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded'); // 調試信息

    // 初始化音效管理器
    try {
        SoundManager.init();
        console.log('Sound Manager initialized'); // 調試信息
    } catch (error) {
        console.error('Sound Manager initialization failed:', error);
    }

    // 獲取畫布元素
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!'); // 調試信息
        return;
    }
    
    console.log('Canvas dimensions:', { // 調試信息
        width: canvas.width,
        height: canvas.height
    });

    // 檢查 canvas context
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get canvas context!'); // 調試信息
        return;
    }
    
    // 創建遊戲實例
    try {
        const game = new Game(canvas);
        console.log('Game instance created'); // 調試信息

        // 設置初始遊戲狀態並播放菜單音樂
        GameStateManager.setState(CONFIG.GAME_STATES.MENU);
        SoundManager.play('battle-march');
        console.log('Game state set to:', CONFIG.GAME_STATES.MENU); // 調試信息
    } catch (error) {
        console.error('Game initialization failed:', error);
    }
}); 