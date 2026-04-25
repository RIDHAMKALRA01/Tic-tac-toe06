const cells = document.querySelectorAll(".cell");
const line = document.getElementById("win-line");
let locked = false;

// Turn indicator update function
function updateTurnIndicator(board) {
    const indicator = document.getElementById("turn-indicator");
    if (!indicator) return; // Exit if indicator doesn't exist
    
    const xCount = board.filter(cell => cell === "X").length;
    const oCount = board.filter(cell => cell === "O").length;
    
    // Check if game is over
    const gameOver = board.every(cell => cell !== "") || 
                     (xCount > 0 || oCount > 0); // Check for winner in backend
    
    if (gameOver) {
        // Check for winner from the backend response
        // This will be handled in updateBoard function
        return;
    }
    
    if (xCount === oCount) {
        indicator.textContent = "Player's Turn (X)";
        indicator.className = "turn-indicator player";
    } else {
        indicator.textContent = "Computer's Turn (O)";
        indicator.className = "turn-indicator ai";
    }
}

// Initial check for AI's first move (if any)
setTimeout(() => {
    cells.forEach((c, i) => {
        if (c.innerText === "O") {
            // AI has already made a move (starting move)
            c.classList.add('o');
            locked = false; // Allow player to move
        }
    });
}, 100);

cells.forEach(c => {
    c.onclick = () => {
        if (!locked && c.innerText === "") {
            locked = true;
            move(c.dataset.i);
        }
    };
});

function move(i) {
    fetch("/move", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ index: Number(i) })
    })
    .then(r => r.json())
    .then(state => {
        // Update X's move immediately
        updateBoard(state);
        
        // Only continue if game isn't over yet
        if (!state.winner && !state.tie) {
            // Wait 1 second for AI move (if needed)
            setTimeout(() => {
                fetch("/aimove", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({ board: state.board })
                })
                .then(r => r.json())
                .then(newState => {
                    updateBoard(newState);
                    
                    // Draw line if game ended with AI move
                    if (newState.win_line) {
                        drawLine(newState.win_line);
                    }
                    
                    // Unlock if game continues
                    if (!newState.winner && !newState.tie) {
                        locked = false;
                    }
                });
            }, 1000);
        } else {
            // Draw line if game ended with player's move
            if (state.win_line) {
                drawLine(state.win_line);
            }
        }
    });
}

function updateBoard(s) {
    s.board.forEach((v, i) => {
        cells[i].innerText = v;
        // Update classes for color
        if (v === 'X') {
            cells[i].classList.add('x');
            cells[i].classList.remove('o');
        } else if (v === 'O') {
            cells[i].classList.add('o');
            cells[i].classList.remove('x');
        } else {
            cells[i].classList.remove('x', 'o');
        }
    });
    
    // Update turn indicator
    updateTurnIndicator(s.board);
    
    // Update scores
    document.getElementById("sx").innerText = s.score.X;
    document.getElementById("so").innerText = s.score.O;
    document.getElementById("st").innerText = s.score.Tie;
    
    // Hide win line if no winner
    if (!s.winner && !s.tie) {
        line.style.display = "none";
    } else {
        // If game is over, update turn indicator to show result
        const indicator = document.getElementById("turn-indicator");
        if (indicator) {
            if (s.winner === "X") {
                indicator.textContent = "Player Wins!";
                indicator.className = "turn-indicator player";
            } else if (s.winner === "O") {
                indicator.textContent = "Computer Wins!";
                indicator.className = "turn-indicator ai";
            } else if (s.tie) {
                indicator.textContent = "Game Tied!";
                indicator.className = "turn-indicator";
            }
        }
    }
    
    // If AI has already made a starting move, unlock the board
    if (s.board.includes("O") && !s.board.includes("X") && !s.winner && !s.tie) {
        locked = false; // Player can now make a move
    }
}

function drawLine(combo) {
    const board = document.querySelector(".board");
    const rect = board.getBoundingClientRect();

    const size = rect.width;
    const cell = size / 3;
    const center = size / 2;
    const diag = Math.sqrt(2) * (size - cell * 0.8);

    const lines = {
        // Horizontal
        "0,1,2": { w: size, x: center, y: cell * 0.5,  rot: 0 },
        "3,4,5": { w: size, x: center, y: cell * 1.5,  rot: 0 },
        "6,7,8": { w: size, x: center, y: cell * 2.5,  rot: 0 },

        // Vertical
        "0,3,6": { w: size, x: cell * 0.5, y: center, rot: 90 },
        "1,4,7": { w: size, x: cell * 1.5, y: center, rot: 90 },
        "2,5,8": { w: size, x: cell * 2.5, y: center, rot: 90 },

        // Diagonals (INSIDE BOX ✅)
        "0,4,8": { w: diag, x: center, y: center, rot: 45 },
        "2,4,6": { w: diag, x: center, y: center, rot: -45 }
    };

    const key = combo.join(",");
    const l = lines[key];
    if (!l) return;

    line.style.width = `${l.w}px`;
    line.style.left = `${l.x}px`;
    line.style.top = `${l.y}px`;
    line.style.transform = `translate(-50%, -50%) rotate(${l.rot}deg)`;
    line.style.display = "block";
}

function reset() {
    fetch("/reset", { method: "POST" })
        .then(r => r.json())
        .then(state => {
            updateBoard(state);
            locked = false;
            
            // If AI starts, show its move and allow player to respond
            if (state.board.includes("O") && !state.board.includes("X")) {
                locked = false;
            }
        });
}

// Add this code at the end - for colorizing X and O cells
document.addEventListener('DOMContentLoaded', function() {
    const cells = document.querySelectorAll('.cell');
    
    function updateCellClasses() {
        cells.forEach(cell => {
            const content = cell.innerText.trim();
            // Remove existing classes
            cell.classList.remove('x', 'o');
            
            // Add appropriate class
            if (content === 'X') {
                cell.classList.add('x');
            } else if (content === 'O') {
                cell.classList.add('o');
            }
        });
    }
    
    // Create a MutationObserver to watch for cell content changes
    const observer = new MutationObserver(updateCellClasses);
    
    cells.forEach(cell => {
        observer.observe(cell, { 
            childList: true, 
            characterData: true,
            subtree: true 
        });
    });
    
    updateCellClasses();
    
    // Initial turn indicator update on page load
    setTimeout(() => {
        const currentBoard = Array.from(cells).map(cell => cell.innerText.trim());
        updateTurnIndicator(currentBoard);
    }, 200);
});