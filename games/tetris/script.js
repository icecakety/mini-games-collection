class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-piece-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // 游戏设置
        this.gridSize = 30;
        this.rows = 20;
        this.cols = 10;
        this.canvas.width = this.cols * this.gridSize;
        this.canvas.height = this.rows * this.gridSize;
        
        // 游戏状态
        this.gameState = 'start';
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.highScore = localStorage.getItem('tetrisHighScore') || 0;
        
        // 游戏设置
        this.speed = 1000;
        this.showGhost = true;
        this.showGrid = true;
        
        // 游戏元素
        this.board = this.createEmptyBoard();
        this.currentPiece = null;
        this.nextPiece = null;
        this.gameLoopId = null;
        
        this.bindEvents();
        this.updateDisplays();
        this.generateNextPiece();
    }

    createEmptyBoard() {
        return Array(this.rows).fill().map(() => Array(this.cols).fill(0));
    }

    // 俄罗斯方块形状定义
    tetrominos = {
        I: {
            shape: [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            color: 'tetromino-I'
        },
        O: {
            shape: [
                [1, 1],
                [1, 1]
            ],
            color: 'tetromino-O'
        },
        T: {
            shape: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 'tetromino-T'
        },
        L: {
            shape: [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 'tetromino-L'
        },
        J: {
            shape: [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 'tetromino-J'
        },
        S: {
            shape: [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            color: 'tetromino-S'
        },
        Z: {
            shape: [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ],
            color: 'tetromino-Z'
        }
    };

    tetrominoNames = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];

    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        
        document.getElementById('speed-select').addEventListener('change', (e) => this.changeSpeed(e.target.value));
        document.getElementById('ghost-toggle').addEventListener('change', (e) => {
            this.showGhost = e.target.checked;
            this.draw();
        });
        document.getElementById('grid-toggle').addEventListener('change', (e) => {
            this.showGrid = e.target.checked;
            this.draw();
        });
    }

    handleKeyPress(e) {
        if (this.gameState !== 'playing') return;

        switch (e.code) {
            case 'ArrowLeft':
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
                this.rotatePiece();
                break;
            case 'Space':
                this.togglePause();
                break;
            case 'KeyR':
                this.restartGame();
                break;
        }
        
        e.preventDefault();
    }

    startGame() {
        this.gameState = 'playing';
        document.getElementById('start-screen').classList.add('hidden');
        this.generateNewPiece();
        this.gameLoop();
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            clearTimeout(this.gameLoopId);
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.gameLoop();
        }
    }

    restartGame() {
        document.getElementById('game-over').classList.add('hidden');
        this.board = this.createEmptyBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.speed = 1000;
        this.gameState = 'playing';
        this.generateNextPiece();
        this.generateNewPiece();
        this.updateDisplays();
        this.gameLoop();
    }

    changeSpeed(speed) {
        const speeds = {
            'slow': 1500,
            'medium': 1000,
            'fast': 500,
            'insane': 200
        };
        this.speed = speeds[speed] || 1000;
        document.getElementById('speed-display').textContent = 
            speed === 'slow' ? '慢速' : 
            speed === 'medium' ? '中速' : 
            speed === 'fast' ? '快速' : '极速';
    }

    gameLoop() {
        if (this.gameState !== 'playing') return;

        this.movePiece(0, 1);
        this.gameLoopId = setTimeout(() => this.gameLoop(), this.speed);
    }

    generateNextPiece() {
        const name = this.tetrominoNames[Math.floor(Math.random() * this.tetrominoNames.length)];
        this.nextPiece = {
            name: name,
            shape: this.tetrominos[name].shape,
            color: this.tetrominos[name].color,
            x: 0,
            y: 0
        };
        this.drawNextPiece();
    }

    generateNewPiece() {
        this.currentPiece = { ...this.nextPiece };
        this.currentPiece.x = Math.floor(this.cols / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
        this.currentPiece.y = 0;
        
        this.generateNextPiece();
        
        // 检查游戏结束
        if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
            this.gameOver();
        }
    }

    movePiece(dx, dy) {
        if (!this.currentPiece) return;

        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;

        if (!this.checkCollision(newX, newY, this.currentPiece.shape)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            this.draw();
        } else if (dy > 0) {
            // 如果向下移动碰撞，则固定方块
            this.lockPiece();
            this.clearLines();
            this.generateNewPiece();
        }
    }

    rotatePiece() {
        if (!this.currentPiece) return;

        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );

        if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y, rotated)) {
            this.currentPiece.shape = rotated;
            this.draw();
        }
    }

    checkCollision(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;

                    if (
                        newX < 0 || 
                        newX >= this.cols || 
                        newY >= this.rows ||
                        (newY >= 0 && this.board[newY][newX])
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    lockPiece() {
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const boardY = this.currentPiece.y + row;
                    const boardX = this.currentPiece.x + col;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;

        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                this.board.splice(row, 1);
                this.board.unshift(Array(this.cols).fill(0));
                linesCleared++;
                row++; // 重新检查当前行
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.speed = Math.max(100, 1000 - (this.level - 1) * 100);
            this.updateDisplays();
        }
    }

    getGhostPosition() {
        if (!this.currentPiece || !this.showGhost) return null;

        let ghostY = this.currentPiece.y;
        while (!this.checkCollision(this.currentPiece.x, ghostY + 1, this.currentPiece.shape)) {
            ghostY++;
        }
        return ghostY;
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格
        if (this.showGrid) {
            this.drawGrid();
        }

        // 绘制已固定的方块
        this.drawBoard();

        // 绘制影子方块
        const ghostY = this.getGhostPosition();
        if (ghostY !== null && ghostY !== this.currentPiece.y) {
            this.drawPiece(this.currentPiece.x, ghostY, this.currentPiece.shape, 'tetromino-ghost');
        }

        // 绘制当前方块
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape, this.currentPiece.color);
        }

        // 如果暂停，显示暂停文字
        if (this.gameState === 'paused') {
            this.drawPauseScreen();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = '#2d3748';
        this.ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawBoard() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col]) {
                    this.drawBlock(col, row, this.board[row][col]);
                }
            }
        }
    }

    drawPiece(x, y, shape, color) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    this.drawBlock(x + col, y + row, color);
                }
            }
        }
    }

    drawBlock(x, y, color) {
        this.ctx.fillStyle = 'currentColor';
        this.ctx.strokeStyle = '#34495e';
        this.ctx.lineWidth = 2;
        
        this.ctx.save();
        this.ctx.translate(x * this.gridSize, y * this.gridSize);
        
        // 绘制方块主体
        this.ctx.fillStyle = this.getColorValue(color);
        this.ctx.fillRect(1, 1, this.gridSize - 2, this.gridSize - 2);
        
        // 绘制3D效果
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(1, 1, this.gridSize - 2, this.gridSize - 2);
        
        this.ctx.restore();
    }

    getColorValue(colorClass) {
        const colors = {
            'tetromino-I': '#00f0f0',
            'tetromino-O': '#f0f000',
            'tetromino-T': '#a000f0',
            'tetromino-L': '#f0a000',
            'tetromino-J': '#0000f0',
            'tetromino-S': '#00f000',
            'tetromino-Z': '#f00000',
            'tetromino-ghost': 'rgba(255, 255, 255, 0.2)'
        };
        return colors[colorClass] || '#ffffff';
    }

    drawNextPiece() {
        this.nextCtx.fillStyle = '#1a1a2e';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const blockSize = 20;
            const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
            const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;
            
            for (let row = 0; row < this.nextPiece.shape.length; row++) {
                for (let col = 0; col < this.nextPiece.shape[row].length; col++) {
                    if (this.nextPiece.shape[row][col]) {
                        this.nextCtx.fillStyle = this.getColorValue(this.nextPiece.color);
                        this.nextCtx.fillRect(
                            offsetX + col * blockSize,
                            offsetY + row * blockSize,
                            blockSize - 2,
                            blockSize - 2
                        );
                        
                        this.nextCtx.strokeStyle = '#34495e';
                        this.nextCtx.lineWidth = 1;
                        this.nextCtx.strokeRect(
                            offsetX + col * blockSize,
                            offsetY + row * blockSize,
                            blockSize - 2,
                            blockSize - 2
                        );
                    }
                }
            }
        }
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
        clearTimeout(this.gameLoopId);
        
        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('tetrisHighScore', this.highScore);
        }
        
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.remove('hidden');
    }

    updateDisplays() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('high-score').textContent = this.highScore;
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new TetrisGame();
});
