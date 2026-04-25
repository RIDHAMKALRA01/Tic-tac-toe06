from game_logic import check_winner

def minimax(board, is_maximizing):
    result, _ = check_winner(board)
    if result == "O": return 1
    if result == "X": return -1
    if result == "Tie": return 0

    if is_maximizing:
        best = -999
        for i in range(9):
            if board[i] == "":
                board[i] = "O"
                score = minimax(board, False)
                board[i] = ""
                best = max(best, score)
        return best
    else:
        best = 999
        for i in range(9):
            if board[i] == "":
                board[i] = "X"
                score = minimax(board, True)
                board[i] = ""
                best = min(best, score)
        return best

def best_move(board):
    best_score = -999
    move = None
    for i in range(9):
        if board[i] == "":
            board[i] = "O"
            score = minimax(board, False)
            board[i] = ""
            if score > best_score:
                best_score = score
                move = i
    return move