document.addEventListener("DOMContentLoaded", () => {
  const sudokuGrid = document.getElementById("sudoku-grid"); // Grade do Sudoku
  const numberGrid = document.getElementById("number-grid"); // Teclado numérico
  const themeToggle = document.getElementById("theme-toggle"); // Botão para alternar tema
  const easyBtn = document.getElementById("easy"); // Botão dificuldade fácil
  const mediumBtn = document.getElementById("medium"); // Botão dificuldade média
  const timerEl = document.getElementById("timer");
  const hardBtn = document.getElementById("hard"); // Botão dificuldade difícil
  const notesBtn = document.querySelector(".notes-btn"); // Botão modo notas

  // Define o ícone do tema conforme o modo atual
  if (document.body.classList.contains("light-mode")) {
    themeToggle.textContent = "☀️";
  } else {
    themeToggle.textContent = "🌙";
  }

  // Alterna entre tema claro e escuro
  function toggleTheme() {
    document.body.classList.toggle("light-mode");
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("light-mode")) {
      themeToggle.textContent = "☀️";
    } else {
      themeToggle.textContent = "🌙";
    }
  }

  themeToggle.addEventListener("click", toggleTheme);

  // Estado do jogo
  let board = Array(9)
    .fill()
    .map(() => Array(9).fill(0)); // Tabuleiro atual
  let solution = Array(9)
    .fill()
    .map(() => Array(9).fill(0)); // Solução do Sudoku
  let fixedCells = Array(9)
    .fill()
    .map(() => Array(9).fill(false)); // Células fixas (não editáveis)
  let notes = Array(9)
    .fill()
    .map(() =>
      Array(9)
        .fill()
        .map(() => Array(9).fill(false))
    ); // Notas do usuário em cada célula
  let selectedCell = null; // Célula atualmente selecionada
  let selectedNumber = null; // Número selecionado no teclado
  let notesMode = false; // Diz se o modo notas está ativo
  let moveHistory = []; // Histórico de movimentos para desfazer
  let difficulty = "easy"; // Dificuldade atual
  let dicasUsadas = 0;
  const maxDicas = 5;
  // Tempo total do jogo em segundos
  let tempoTotal = 150;
  let intervalo;
  let timerIniciado = false;
  let jogoBloqueado = false; // controla se o tabuleiro está bloqueado

  // Inicializa o jogo
  initGame();

  // Adiciona event listeners aos botões de controle
  document
    .querySelectorAll(".undo-btn")
    .forEach((btn) => btn.addEventListener("click", undoMove));
  document
    .querySelectorAll(".notes-btn")
    .forEach((btn) => btn.addEventListener("click", toggleNotesMode));
  document
    .querySelectorAll(".erase-btn")
    .forEach((btn) => btn.addEventListener("click", eraseCell));
  document
    .querySelectorAll(".hint-btn")
    .forEach((btn) => btn.addEventListener("click", giveHint));
  themeToggle.addEventListener("click", toggleTheme);
  easyBtn.addEventListener("click", () => setDifficulty("easy"));
  mediumBtn.addEventListener("click", () => setDifficulty("medium"));
  hardBtn.addEventListener("click", () => setDifficulty("hard"));

  // Define a dificuldade do jogo
  function setDifficulty(newDifficulty) {
    difficulty = newDifficulty;
    easyBtn.classList.remove("active");
    mediumBtn.classList.remove("active");
    hardBtn.classList.remove("active");

    if (difficulty === "easy") {
      easyBtn.classList.add("active");
    } else if (difficulty === "medium") {
      mediumBtn.classList.add("active");
    } else {
      hardBtn.classList.add("active");
    }

    initGame();
  }

  // Inicializa o jogo
  function initGame() {
    // Limpa o tabuleiro
    board = Array(9)
      .fill()
      .map(() => Array(9).fill(0));
    fixedCells = Array(9)
      .fill()
      .map(() => Array(9).fill(false));
    notes = Array(9)
      .fill()
      .map(() =>
        Array(9)
          .fill()
          .map(() => Array(9).fill(false))
      );
    moveHistory = [];
    selectedCell = null;
    selectedNumber = null;
    dicasUsadas = 0;
    document
      .querySelectorAll(".hint-btn")
      .forEach((btn) => (btn.disabled = false));

    // Gera um novo quebra-cabeça de Sudoku
    generateSudoku();

    // Renderiza o tabuleiro
    renderBoard();

    // Renderiza o teclado numérico
    renderNumberPad();

    // Reinicia o timer
    tempoTotal = 150;
    timerIniciado = false;
    jogoBloqueado = false;
    updateTimerDisplay();
  }

  // Gera um quebra-cabeça de Sudoku com base na dificuldade
  function generateSudoku() {
    // Cria um tabuleiro de Sudoku resolvido
    createSolvedBoard();

    // Faz uma cópia da solução
    solution = board.map((row) => [...row]);

    // Determina as células a serem removidas com base na dificuldade
    let cellsToRemove;
    switch (difficulty) {
      case "easy":
        cellsToRemove = 30; 
        break;
      case "medium":
        cellsToRemove = 40; 
        break;
      case "hard":
        cellsToRemove = 50; 
        break;
      default:
        cellsToRemove = 45;
    }

    let removedCells = 0;
    let attempts = 0;
    const maxAttempts = 2000;

    // Remove células até atingir o número desejado ou atingir o número máximo de tentativas
    while (removedCells < cellsToRemove && attempts < maxAttempts) {
      attempts++;
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);

      if (board[row][col] !== 0) {
        const temp = board[row][col];
        board[row][col] = 0;

        // Verifica se o quebra-cabeça ainda tem uma solução única
        const tempBoard = board.map((row) => [...row]);
        if (countSolutions(tempBoard) === 1) {
          fixedCells[row][col] = false;
          removedCells++;
        } else {
          board[row][col] = temp;
        }
      }
    }

    if (attempts === maxAttempts) {
      showPopup("Não foi possível gerar o Sudoku. Tente novamente.", "error");
      return;
    }

    // Marca as células fixas
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] !== 0) {
          fixedCells[row][col] = true;
        }
      }
    }
  }

  // Cria um tabuleiro de Sudoku resolvido
  function createSolvedBoard() {
    // Redefine o tabuleiro
    board = Array(9)
      .fill()
      .map(() => Array(9).fill(0));

    // Preenche as caixas 3x3 diagonais (elas são independentes)
    fillDiagonalBoxes();

    // Resolve o restante do tabuleiro
    solveSudoku(0, 3);
  }

  // Preenche as caixas 3x3 diagonais
  function fillDiagonalBoxes() {
    for (let box = 0; box < 9; box += 3) {
      fillBox(box, box);
    }
  }

  // Preenche uma caixa 3x3
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

  // Embaralha um array
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Resolve o Sudoku usando retrocesso
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

  // Conta soluções para um tabuleiro de Sudoku
  function countSolutions(boardToCheck) {
    let count = 0;
    const tempBoard = boardToCheck.map((row) => [...row]);

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
          if (count > 1) return; // Saída antecipada se houver múltiplas soluções
          tempBoard[row][col] = 0;
        }
      }
    }

    backtrack(0, 0);
    return count;
  }

  // Verifica se um movimento é válido
  function isValidMove(row, col, num, boardToCheck = board) {
    // Verifica linha
    for (let i = 0; i < 9; i++) {
      if (boardToCheck[row][i] === num && i !== col) {
        return false;
      }
    }

    // Verifica coluna
    for (let i = 0; i < 9; i++) {
      if (boardToCheck[i][col] === num && i !== row) {
        return false;
      }
    }

    // Verifica caixa 3x3
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

  // Renderiza o tabuleiro de Sudoku
  function renderBoard() {
    sudokuGrid.innerHTML = "";

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = row;
        cell.dataset.col = col;

        if (fixedCells[row][col]) {
          cell.classList.add("fixed");
          cell.textContent = board[row][col];
        } else if (board[row][col] !== 0) {
          cell.classList.add("user-input");
          cell.textContent = board[row][col];

          // Verifica se o número está correto
          if (board[row][col] !== solution[row][col]) {
            cell.classList.add("error");
          }
        } else if (hasNotes(row, col)) {
          const notesContainer = document.createElement("div");
          notesContainer.className = "notes";

          for (let noteRow = 0; noteRow < 3; noteRow++) {
            for (let noteCol = 0; noteCol < 3; noteCol++) {
              const noteNum = noteRow * 3 + noteCol + 1;
              const noteElement = document.createElement("div");
              noteElement.className = "note";

              if (notes[row][col][noteNum - 1]) {
                noteElement.textContent = noteNum;
              }

              notesContainer.appendChild(noteElement);
            }
          }

          cell.appendChild(notesContainer);
        }

        if (
          selectedCell &&
          selectedCell.row === row &&
          selectedCell.col === col
        ) {
          cell.classList.add("selected");
        }

        cell.addEventListener("click", () => selectCell(row, col));
        sudokuGrid.appendChild(cell);
      }
    }
  }

  // Verifica se uma célula tem notas
  function hasNotes(row, col) {
    return notes[row][col].some((note) => note);
  }

  // Renderiza o teclado numérico
  function renderNumberPad() {
    numberGrid.innerHTML = "";

    for (let num = 1; num <= 9; num++) {
      const btn = document.createElement("button");
      btn.className = "number-btn";
      btn.textContent = num;
      btn.dataset.number = num;

      btn.addEventListener("click", () => handleNumberInput(num));

      numberGrid.appendChild(btn);
    }
  }

  // Seleciona uma célula
  function selectCell(row, col) {
    console.log("jogoBloqueado:", jogoBloqueado);
    if (jogoBloqueado) return;
    if (fixedCells[row][col]) return;
    selectedCell = { row, col };
    renderBoard();
  }

  // Manipula a entrada de número
  function handleNumberInput(num) {
    if (jogoBloqueado) return;
    iniciarTimerSeNecessario(); // Inicia o timer na primeira ação
    if (!selectedCell) return;

    const { row, col } = selectedCell;

    if (fixedCells[row][col]) return;

    // Salva o estado atual para desfazer
    const prevValue = board[row][col];
    const prevNotes = [...notes[row][col]];
    moveHistory.push({ row, col, prevValue, prevNotes });

    if (notesMode) {
      // Alterna nota
      notes[row][col][num - 1] = !notes[row][col][num - 1];

      // Limpa a célula se tiver um número
      if (board[row][col] !== 0) {
        board[row][col] = 0;
      }
    } else {
      // Limpa notas se houver
      notes[row][col] = Array(9).fill(false);

      // Define ou limpa o número
      board[row][col] = board[row][col] === num ? 0 : num;
    }

    renderBoard();
    checkCompletion();
  }

  // Desfaz o último movimento
  function undoMove() {
    if (jogoBloqueado) return;
    if (moveHistory.length === 0) return;

    const lastMove = moveHistory.pop();
    const { row, col, prevValue, prevNotes } = lastMove;

    board[row][col] = prevValue;
    notes[row][col] = [...prevNotes];

    renderBoard();
  }

  // Alterna o modo notas
  function toggleNotesMode() {
    if (jogoBloqueado) return;
    notesMode = !notesMode;
    document.querySelectorAll(".notes-btn").forEach((btn) => {
      btn.classList.toggle("active", notesMode);
      if (notesMode) {
        btn.style.transform = "translateY(-3px)";
        setTimeout(() => {
          btn.style.transform = "";
        }, 200);
      }
    });
  }

  // Limpa a célula selecionada
  function eraseCell() {
    if (jogoBloqueado) return;
    if (!selectedCell) return;

    const { row, col } = selectedCell;

    if (fixedCells[row][col]) return;

    // Salva o estado atual para desfazer
    const prevValue = board[row][col];
    const prevNotes = [...notes[row][col]];
    moveHistory.push({ row, col, prevValue, prevNotes });

    board[row][col] = 0;
    notes[row][col] = Array(9).fill(false);
    selectedNumber = null;

    renderBoard();
  }

  // Dá uma dica
  function giveHint() {
    if (jogoBloqueado) return;
    if (dicasUsadas >= maxDicas) {
      showPopup("Você já usou todas as 5 dicas!", "error");
      return;
    }
    iniciarTimerSeNecessario(); // Inicia o timer ao pedir dica
    if (!selectedCell) return;

    const { row, col } = selectedCell;

    if (fixedCells[row][col] || board[row][col] !== 0) return;

    // Salva o estado atual para desfazer
    const prevValue = board[row][col];
    const prevNotes = [...notes[row][col]];
    moveHistory.push({ row, col, prevValue, prevNotes });

    // Limpa notas se houver
    notes[row][col] = Array(9).fill(false);

    // Define o número correto
    board[row][col] = solution[row][col];

    dicasUsadas++;
    if (dicasUsadas >= maxDicas) {
      // Desabilita todos os botões de dica
      document
        .querySelectorAll(".hint-btn")
        .forEach((btn) => (btn.disabled = true));
    }

    renderBoard();
    checkCompletion();
  }

  // Verifica se o quebra-cabeça está completo
  function checkCompletion() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] !== solution[row][col]) {
          return false;
        }
      }
    }

    // Quebra-cabeça completo
    setTimeout(() => {
      showPopup("Parabéns! Você completou o Sudoku!");
    }, 100);

    return true;
  }

  // Função para mostrar pop-up customizado
  function showPopup(message, type = "success") {
    const popup = document.getElementById("popup-alert");
    const msg = document.getElementById("popup-message");
    const icon = popup.querySelector(".popup-icon");
    msg.textContent = message;
    icon.textContent = type === "error" ? "⚠️" : "🎉";
    popup.style.display = "flex";
  }

  // Fechar pop-up ao clicar no botão OK
  document.getElementById("popup-close").addEventListener("click", () => {
    document.getElementById("popup-alert").style.display = "none";
  });

  function updateTimerDisplay() {
    if (!timerEl) return;
    const min = String(Math.floor(tempoTotal / 60)).padStart(2, "0");
    const sec = String(tempoTotal % 60).padStart(2, "0");
    timerEl.innerText = `Tempo: ${min}:${sec}`;
  }

  function startTimer() {
    clearInterval(intervalo);
    intervalo = setInterval(() => {
      if (tempoTotal <= 0) {
        clearInterval(intervalo);
        tempoTotal = 0;
        updateTimerDisplay();
        jogoBloqueado = true; // Bloqueia o tabuleiro
        showPopupPerguntaReinicio();
        return;
      }
      tempoTotal--;
      updateTimerDisplay();
    }, 1000);
  }

  function iniciarTimerSeNecessario() {
    if (!timerIniciado) {
      timerIniciado = true;
      startTimer();
    }
  }

  // Função para mostrar pop-up de pergunta ao acabar o tempo
  function showPopupPerguntaReinicio() {
    const popup = document.getElementById("popup-alert");
    const msg = document.getElementById("popup-message");
    const icon = popup.querySelector(".popup-icon");
    msg.textContent = "Tempo esgotado! Deseja reiniciar o jogo?";
    icon.textContent = "⏰";
    document.getElementById("popup-close").style.display = "none";
    document.getElementById("popup-restart").style.display = "inline-block";
    document.getElementById("popup-cancel").style.display = "inline-block";
    popup.style.display = "flex";
  }

  // Função para restaurar pop-up padrão
  function resetPopupButtons() {
    document.getElementById("popup-close").style.display = "inline-block";
    document.getElementById("popup-restart").style.display = "none";
    document.getElementById("popup-cancel").style.display = "none";
  }

  // Eventos dos botões do pop-up
  document.getElementById("popup-close").addEventListener("click", () => {
    document.getElementById("popup-alert").style.display = "none";
    resetPopupButtons();
  });
  document.getElementById("popup-restart").addEventListener("click", () => {
    document.getElementById("popup-alert").style.display = "none";
    resetPopupButtons();
    tempoTotal = 150;
    timerIniciado = false;
    jogoBloqueado = false;
    initGame();
    updateTimerDisplay();
    // Garante desbloqueio ao iniciar
    setTimeout(() => {
      jogoBloqueado = false;
    }, 100);
  });
  document.getElementById("popup-cancel").addEventListener("click", () => {
    document.getElementById("popup-alert").style.display = "none";
    resetPopupButtons();
    // Mantém o tabuleiro, mas bloqueia as ações
    jogoBloqueado = true;
    tempoTotal = 0;
    updateTimerDisplay();
  });
});
