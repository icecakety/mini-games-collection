class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        
        // 游戏状态
        this.gameState = 'start'; // start, playing, paused, gameover
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        
        // 游戏设置
        this.gridSize = 20;
        this.speed = 150; // 初始速度（毫秒）
        this.showGrid = true;
        
        // 初始化游戏元素
        this.snake = [];
        this.food = {};
        this.direction = 'right';
        this.nextDirection = 'right';
        
        // 绑定事件
        this.bindEvents();
        this.updateHighScoreDisplay();
        this.initializeGame();
    }

    initializeGame() {
        // 初始化蛇（3节）
        this.snake = [
            { x: 5, y: 10 },
            { x: 4, y: 10 },
            { x: 3, y: 10 }
        ];
        
        // 生成食物
        this.generateFood();
        
        // 重置分数和方向
        this.score = 0;
        this.direction = 'right';
        this.nextDirection = 'right';
        
        this.updateScoreDisplay();
    }

    bindEvents() {
        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // 按钮事件
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        
        // 设置变更
        document.getElementById('speed-select').addEventListener('change', (e) => this.changeSpeed(e.target.value));
        document.getElementById('grid-toggle').addEventListener('change', (e) => {
            this.showGrid = e.target.checked;
            this.draw();
        });
    }

    handleKeyPress(e) {
        if (this.gameState === 'start') {
            if (e.code === 'Space' || e.code === 'Enter') {
                this.startGame();
            }
            return;
        }

        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                if (this.direction !== 'down') this.nextDirection = 'up';
                break;
            case 'ArrowDown':
            case 'KeyS':
                if (this.direction !== 'up') this.nextDirection = 'down';
                break;
            case 'ArrowLeft':
            case 'KeyA':
                if (this.direction !== 'right') this.nextDirection = 'left';
                break;
            case 'ArrowRight':
            case 'KeyD':
                if (this.direction !== 'left') this.nextDirection = 'right';
                break;
            case 'Space':
                this.togglePause();
                break;
            case 'KeyR':
                this.restartGame();
                break;
        }
        
        // 防止箭头键滚动页面
        if ([
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'KeyW', 'KeyA', 'KeyS', 'KeyD'
        ].includes(e.code)) {
            e.preventDefault();
        }
    }

    startGame() {
        this.gameState = 'playing';
        document.getElementById('start-screen').classList.add('hidden');
        this.gameLoop();
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.gameLoop();
        }
    }

    restartGame() {
        document.getElementById('game-over').classList.add('hidden');
        this.initializeGame();
        this.gameState = 'playing';
        this.gameLoop();
    }

    changeSpeed(speed) {
        const speeds = {
            'slow': 200,
            'medium': 150,
            'fast': 100,
            'insane': 70
        };
        this.speed = speeds[speed] || 150;
    }

    gameLoop() {
        if (this.gameState !== 'playing') return;

        this.update();
        this.draw();

        setTimeout(() => this.gameLoop(), this.speed);
    }

    update() {
        // 更新方向
        this.direction = this.nextDirection;

        // 移动蛇头
        const head = { ...this.snake[0] };
        
        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // 检查碰撞
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }

        // 添加新头
        this.snake.unshift(head);

        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScoreDisplay();
            this.generateFood();
            
            // 每得50分加速一次
            if (this.score % 50 === 0 && this.speed > 50) {
                this.speed -= 10;
            }
        } else {
            // 没吃到食物就移除尾部
            this.snake.pop();
        }
    }

    checkCollision(head) {
        // 撞墙检测
        if (head.x < 0 || head.x >= this.canvas.width / this.gridSize ||
            head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
            return true;
        }

        // 撞自身检测
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                return true;
            }
        }

        return false;
    }

    generateFood() {
        let newFood;
        let foodOnSnake;
        
        do {
            foodOnSnake = false;
            newFood = {
                x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                y: Math.floor(Math.random() * (this.canvas.height / this.gridSize))
            };
            
            // 确保食物不会生成在蛇身上
            for (let segment of this.snake) {
                if (newFood.x === segment.x && newFood.y === segment.y) {
                    foodOnSnake = true;
                    break;
                }
            }
        } while (foodOnSnake);
        
        this.food = newFood;
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格
        if (this.showGrid) {
            this.drawGrid();
        }

        // 绘制蛇
        this.drawSnake();

        // 绘制食物
        this.drawFood();

        // 如果暂停，显示暂停文字
        if (this.gameState === 'paused') {
            this.drawPauseScreen();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = '#2d3748';
        this.ctx.lineWidth = 0.5;
        
        for (let x = 0; x < this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawSnake() {
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // 蛇头
                this.ctx.fillStyle = '#4CAF50';
                this.ctx.fillRect(
                    segment.x * this.gridSize,
                    segment.y * this.gridSize,
                    this.gridSize,
                    this.gridSize
                );
                
                // 蛇头高光
                this.ctx.fillStyle = '#66BB6A';
                this.ctx.fillRect(
                    segment.x * this.gridSize + 2,
                    segment.y * this.gridSize + 2,
                    this.gridSize - 4,
                    this.gridSize - 4
                );
            } else {
                // 蛇身
                this.ctx.fillStyle = '#43A047';
                this.ctx.fillRect(
                    segment.x * this.gridSize,
                    segment.y * this.gridSize,
                    this.gridSize,
                    this.gridSize
                );
                
                // 蛇身内部
                this.ctx.fillStyle = '#66BB6A';
                this.ctx.fillRect(
                    segment.x * this.gridSize + 1,
                    segment.y * this.gridSize + 1,
                    this.gridSize - 2,
                    this.gridSize - 2
                );
            }
        });
    }

    drawFood() {
        this.ctx.fillStyle = '#FF5252';
        this.ctx.beginPath();
        const centerX = this.food.x * this.gridSize + this.gridSize / 2;
        const centerY = this.food.y * this.gridSize + this.gridSize / 2;
        const radius = this.gridSize / 2 - 2;
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 食物高光
        this.ctx.fillStyle = '#FF8A80';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 2, centerY - 2, radius / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2 - 10);
        this.ctx.font = '16px Arial';
        this.ctx.fillText('按空格键继续', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }

    gameOver() {
        this.gameState = 'gameover';
        
        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.updateHighScoreDisplay();
        }
        
        // 显示游戏结束画面
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.remove('hidden');
    }

    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score;
    }

    updateHighScoreDisplay() {
        document.getElementById('high-score').textContent = this.highScore;
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});
