from flask import Flask, render_template, request, jsonify
from game_logic import check_winner
from ai import best_move
import copy

# Configure Flask to look for templates in the current directory (root)
# instead of the default 'templates' folder
app = Flask(__name__, template_folder='.')

state = {
    "board": [""] * 9,
    "winner": None,
    "tie": False,
    "win_line": None,
    "score": {"X": 0, "O": 0, "Tie": 0},
    "game_count": 0,  # Add game counter
    "ai_first": False  # Track if AI should start
}

@app.route("/")
def index():
    # Reset board when loading the page
    state["board"] = [""] * 9
    state["winner"] = None
    state["tie"] = False
    state["win_line"] = None
    
    # Every even game (0, 2, 4...): Human first
    # Every odd game (1, 3, 5...): AI first
    state["ai_first"] = (state["game_count"] % 2 == 1)
    
    # If AI should start, make its first move
    if state["ai_first"]:
        ai_idx = best_move(state["board"])
        if ai_idx is not None:
            state["board"][ai_idx] = "O"
    
    return render_template("index.html")

@app.route("/move", methods=["POST"])
def move():
    idx = request.json["index"]
    
    if state["winner"] or state["tie"]:
        return jsonify(state)

    if state["board"][idx] == "":
        state["board"][idx] = "X"

        result, combo = check_winner(state["board"])
        if result:
            finalize(result, combo)
            
    return jsonify(state)

@app.route("/aimove", methods=["POST"])
def aimove():
    # Get current board state from request
    current_board = request.json["board"]
    state["board"] = current_board
    
    if state["winner"] or state["tie"]:
        return jsonify(state)
    
    # AI MOVE
    ai_idx = best_move(state["board"])
    if ai_idx is not None:
        state["board"][ai_idx] = "O"

        result, combo = check_winner(state["board"])
        if result:
            finalize(result, combo)
    
    return jsonify(state)

def finalize(result, combo):
    if result == "Tie":
        state["tie"] = True
        state["score"]["Tie"] += 1
    else:
        state["winner"] = result
        state["win_line"] = combo
        state["score"][result] += 1
    
    # Increment game counter when game ends
    state["game_count"] += 1

@app.route("/reset", methods=["POST"])
def reset():
    state["board"] = [""] * 9
    state["winner"] = None
    state["tie"] = False
    state["win_line"] = None
    
    # Determine who starts next game
    state["ai_first"] = (state["game_count"] % 2 == 1)
    
    # If AI should start, make its first move immediately
    if state["ai_first"]:
        ai_idx = best_move(state["board"])
        if ai_idx is not None:
            state["board"][ai_idx] = "O"
    
    return jsonify(state)

if __name__ == "__main__":
    app.run(debug=True)