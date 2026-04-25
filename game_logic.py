WIN_COMBINATIONS = [
    (0, 1, 2), (3, 4, 5), (6, 7, 8),
    (0, 3, 6), (1, 4, 7), (2, 5, 8),
    (0, 4, 8), (2, 4, 6)
]

def check_winner(board):
    for combo in WIN_COMBINATIONS:
        a, b, c = combo
        if board[a] and board[a] == board[b] == board[c]:
            return board[a], list(combo)
    if "" not in board:
        return "Tie", None
    return None, None