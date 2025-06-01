document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sudokuGrid = document.getElementById('sudoku-grid');
    const numberGrid = document.getElementById('number-grid');
    const newGameBtn = document.getElementById('new-game');
    const undoBtn = document.getElementById('undo');
    const notesBtn = document.getElementById('notes');
    const eraseBtn = document.getElementById('erase');
    const hintBtn = document.getElementById('hint');
    const themeToggle = document.getElementById('theme-toggle');
    const easyBtn = document.getElementById('easy');
    const mediumBtn = document.getElementById('medium');
    const hardBtn = document.getElementById('hard');
    
    // Game state
    let board = Array(9).fill().map(() => Array(9).fill(0));
    let solution = Array(9).fill().map(() => Array(9).fill(0));
    let fixedCells = Array(9).fill().map(() => Array(9).fill(false));
    let notes = Array(9).fill().map(() => Array(9).fill().map(() => Array(9).fill(false)));
    let selectedCell = null;
    let selectedNumber = null;
    let notesMode = false;
    let moveHistory = [];
    let difficulty = 'easy'; // 'easy', 'medium', 'hard'
    
    // Initialize the game
    initGame();
    
    // Event listeners
    newGameBtn.addEventListener('click', initGame);
    undoBtn.addEventListener('click', undoMove);
    notesBtn.addEventListener('click', toggleNotesMode);
    eraseBtn.addEventListener('click', eraseCell);
    hintBtn.addEventListener('click', giveHint);
    themeToggle.addEventListener('click', toggleTheme);
    easyBtn.addEventListener('click', () => setDifficulty('easy'));
    mediumBtn.addEventListener('click', () => setDifficulty('medium'));
    hardBtn.addEventListener('click', () => setDifficulty('hard'));
    
    // Set difficulty
    function setDifficulty(newDifficulty) {
        difficulty = newDifficulty;
        easyBtn.classList.remove('active');
        mediumBtn.classList.remove('active');
        hardBtn.classList.remove('active');
        
        if (difficulty === 'easy') {
            easyBtn.classList.add('active');
        } else if (difficulty === 'medium') {
            mediumBtn.classList.add('active');
        } else {
            hardBtn.classList.add('active');
        }
        
        initGame();
    }
    
    // Initialize the game
    function initGame() {
        // Clear the board
        board = Array(9).fill().map(() => Array(9).fill(0));
        fixedCells = Array(9).fill().map(() => Array(9).fill(false));
        notes = Array(9).fill().map(() => Array(9).fill().map(() => Array(9).fill(false)));
        moveHistory = [];
        selectedCell = null;
        selectedNumber = null;
        
        // Generate a new Sudoku puzzle
        generateSudoku();
        
        // Render the board
        renderBoard();
        
        // Render number pad
        renderNumberPad();
    }
    
    // Generate a Sudoku puzzle based on difficulty
    function generateSudoku() {
        // Create a solved Sudoku board
        createSolvedBoard();
        
        // Make a copy of the solution
        solution = board.map(row => [...row]);
        
        // Determine cells to remove based on difficulty
        let cellsToRemove;
        switch(difficulty) {
            case 'easy':
                cellsToRemove = 40; // ~45-50 cells remaining
                break;
            case 'medium':
                cellsToRemove = 50; // ~35-40 cells remaining
                break;
            case 'hard':
                cellsToRemove = 60; // ~25-30 cells remaining
                break;
            default:
                cellsToRemove = 45;
        }
        
        let removedCells = 0;
        
        while (removedCells < cellsToRemove) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            
            if (board[row][col] !== 0) {
                const temp = board[row][col];
                board[row][col] = 0;
                
                // Check if the puzzle still has a unique solution
                const tempBoard = board.map(row => [...row]);
                if (countSolutions(tempBoard) === 1) {
                    fixedCells[row][col] = false;
                    removedCells++;
                } else {
                    board[row][col] = temp;
                }
            }
        }
        
        // Mark remaining numbers as fixed
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] !== 0) {
                    fixedCells[row][col] = true;
                }
            }
        }
    }
    
    // Create a solved Sudoku board
    function createSolvedBoard() {
        // Reset board
        board = Array(9).fill().map(() => Array(9).fill(0));
        
        // Fill diagonal 3x3 boxes (they are independent)
        fillDiagonalBoxes();
        
        // Solve the rest of the board
        solveSudoku(0, 3);
    }
    
    // Fill diagonal 3x3 boxes
    function fillDiagonalBoxes() {
        for (let box = 0; box < 9; box += 3) {
            fillBox(box, box);
        }
    }
    
    // Fill a 3x3 box
    function fillBox(row, col) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        shuffleArray(nums);
        
        let index = 0;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                board[row + i][col + j] = nums[index++];
            }
        }
    }
    
    // Shuffle an array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    // Solve Sudoku using backtracking
    function solveSudoku(row, col) {
        if (row === 9) {
            return true;
        }
        
        if (col === 9) {
            return solveSudoku(row + 1, 0);
        }
        
        if (board[row][col] !== 0) {
            return solveSudoku(row, col + 1);
        }
        
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        shuffleArray(nums);
        
        for (const num of nums) {
            if (isValidMove(row, col, num)) {
                board[row][col] = num;
                
                if (solveSudoku(row, col + 1)) {
                    return true;
                }
                
                board[row][col] = 0;
            }
        }
        
        return false;
    }
    
    // Count solutions for a Sudoku board
    function countSolutions(boardToCheck) {
        let count = 0;
        const tempBoard = boardToCheck.map(row => [...row]);
        
        function backtrack(row, col) {
            if (row === 9) {
                count++;
                return;
            }
            
            if (col === 9) {
                backtrack(row + 1, 0);
                return;
            }
            
            if (tempBoard[row][col] !== 0) {
                backtrack(row, col + 1);
                return;
            }
            
            for (let num = 1; num <= 9; num++) {
                if (isValidMove(row, col, num, tempBoard)) {
                    tempBoard[row][col] = num;
                    backtrack(row, col + 1);
                    if (count > 1) return; // Early exit if multiple solutions
                    tempBoard[row][col] = 0;
                }
            }
        }
        
        backtrack(0, 0);
        return count;
    }
    
    // Check if a move is valid
    function isValidMove(row, col, num, boardToCheck = board) {
        // Check row
        for (let i = 0; i < 9; i++) {
            if (boardToCheck[row][i] === num && i !== col) {
                return false;
            }
        }
        
        // Check column
        for (let i = 0; i < 9; i++) {
            if (boardToCheck[i][col] === num && i !== row) {
                return false;
            }
        }
        
        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = boxRow; i < boxRow + 3; i++) {
            for (let j = boxCol; j < boxCol + 3; j++) {
                if (boardToCheck[i][j] === num && (i !== row || j !== col)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // Render the Sudoku board
    function renderBoard() {
        sudokuGrid.innerHTML = '';
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                if (fixedCells[row][col]) {
                    cell.classList.add('fixed');
                    cell.textContent = board[row][col];
                } else if (board[row][col] !== 0) {
                    cell.classList.add('user-input');
                    cell.textContent = board[row][col];
                    
                    // Check if the number is correct
                    if (board[row][col] !== solution[row][col]) {
                        cell.classList.add('error');
                    }
                } else if (hasNotes(row, col)) {
                    const notesContainer = document.createElement('div');
                    notesContainer.className = 'notes';
                    
                    for (let noteRow = 0; noteRow < 3; noteRow++) {
                        for (let noteCol = 0; noteCol < 3; noteCol++) {
                            const noteNum = noteRow * 3 + noteCol + 1;
                            const noteElement = document.createElement('div');
                            noteElement.className = 'note';
                            
                            if (notes[row][col][noteNum - 1]) {
                                noteElement.textContent = noteNum;
                            }
                            
                            notesContainer.appendChild(noteElement);
                        }
                    }
                    
                    cell.appendChild(notesContainer);
                }
                
                if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
                    cell.classList.add('selected');
                }
                
                cell.addEventListener('click', () => selectCell(row, col));
                sudokuGrid.appendChild(cell);
            }
        }
    }
    
    // Check if a cell has any notes
    function hasNotes(row, col) {
        return notes[row][col].some(note => note);
    }
    
    // Render the number pad
    function renderNumberPad() {
        numberGrid.innerHTML = '';
        
        for (let num = 1; num <= 9; num++) {
            const btn = document.createElement('button');
            btn.className = 'number-btn';
            btn.textContent = num;
            btn.dataset.number = num;
            
            btn.addEventListener('click', () => handleNumberInput(num));
            
            numberGrid.appendChild(btn);
        }
    }
    
    // Select a cell
    function selectCell(row, col) {
        if (fixedCells[row][col]) return;
        
        selectedCell = { row, col };
        renderBoard();
    }
    
    // Handle number input
    function handleNumberInput(num) {
        if (!selectedCell) return;
        
        const { row, col } = selectedCell;
        
        if (fixedCells[row][col]) return;
        
        // Save current state for undo
        const prevValue = board[row][col];
        const prevNotes = [...notes[row][col]];
        moveHistory.push({ row, col, prevValue, prevNotes });
        
        if (notesMode) {
            // Toggle note
            notes[row][col][num - 1] = !notes[row][col][num - 1];
            
            // Clear the cell if it has a number
            if (board[row][col] !== 0) {
                board[row][col] = 0;
            }
        } else {
            // Clear notes if any
            notes[row][col] = Array(9).fill(false);
            
            // Set or clear the number
            board[row][col] = board[row][col] === num ? 0 : num;
        }
        
        renderBoard();
        checkCompletion();
    }
    
    // Undo the last move
    function undoMove() {
        if (moveHistory.length === 0) return;
        
        const lastMove = moveHistory.pop();
        const { row, col, prevValue, prevNotes } = lastMove;
        
        board[row][col] = prevValue;
        notes[row][col] = prevNotes;
        
        renderBoard();
    }
    
    // Toggle notes mode
    function toggleNotesMode() {
        notesMode = !notesMode;
        notesBtn.classList.toggle('active', notesMode);
        
        // Visual feedback
        if (notesMode) {
            notesBtn.style.transform = 'translateY(-3px)';
            setTimeout(() => {
                notesBtn.style.transform = '';
            }, 200);
        }
    }
    
    // Erase the selected cell
    function eraseCell() {
        if (!selectedCell) return;
        
        const { row, col } = selectedCell;
        
        if (fixedCells[row][col]) return;
        
        // Save current state for undo
        const prevValue = board[row][col];
        const prevNotes = [...notes[row][col]];
        moveHistory.push({ row, col, prevValue, prevNotes });
        
        board[row][col] = 0;
        notes[row][col] = Array(9).fill(false);
        selectedNumber = null;
        
        renderBoard();
    }
    
    // Give a hint
    function giveHint() {
        if (!selectedCell) return;
        
        const { row, col } = selectedCell;
        
        if (fixedCells[row][col] || board[row][col] !== 0) return;
        
        // Save current state for undo
        const prevValue = board[row][col];
        const prevNotes = [...notes[row][col]];
        moveHistory.push({ row, col, prevValue, prevNotes });
        
        // Clear notes if any
        notes[row][col] = Array(9).fill(false);
        
        // Set the correct number
        board[row][col] = solution[row][col];
        
        renderBoard();
        checkCompletion();
    }
    
    // Check if the puzzle is completed
    function checkCompletion() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] !== solution[row][col]) {
                    return false;
                }
            }
        }
        
        // Puzzle completed
        setTimeout(() => {
            alert('Parabéns! Você completou o Sudoku!');
        }, 100);
        
        return true;
    }
    
    // Toggle theme between dark and light
    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');
    }
});