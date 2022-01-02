import React, { useState, useEffect } from "react";

import axios from "axios";

const INITIAL_GAME_BOARD_STATE = [
  [null, null, null],
  [null, null, null],
  [null, null, null],
];

const INITIAL_GAME_PLAYER = Math.floor(Math.random() * 2);

function getSymbol(value) {
  if (value === 1) {
    return "X";
  }
  if (value === 0) {
    return "O";
  }

  return null;
}

const win_types = {
  COLUMN_MATCH: "COLUMN MATCH",
  ROW_MATCH: "ROW MATCH",
  DIAGONAL_MATCH: "DIAGONAL MATCH",
};

export function App() {
  const [player, setPlayer] = useState(INITIAL_GAME_PLAYER); // 0 || 1
  const [boardId, setBoardId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [win, setWin] = useState(false);
  const [withoutSolution, setWithoutSolution] = useState(false);

  const [gameBoard, setGameBoard] = useState(INITIAL_GAME_BOARD_STATE);

  function markWin(win_type = "", pos = -1, currentPlayer) {
    setWin(true);
    setPlayer(currentPlayer);
    let board = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];
    switch (win_type) {
      case win_types.ROW_MATCH:
        for (let i = 0; i < 3; i++) {
          board[pos][i] = currentPlayer;
        }
        setGameBoard(board);
        break;
      case win_types.COLUMN_MATCH:
        for (let i = 0; i < 3; i++) {
          board[i][pos] = currentPlayer;
        }
        setGameBoard(board);
        break;
      case win_types.DIAGONAL_MATCH:
        if (pos === 0) {
          for (let i = 0; i < 3; i++) {
            board[i][i] = currentPlayer;
          }
        } else if (pos === 2) {
          for (let i = 0; i < 3; i++) {
            board[2 - i][i] = currentPlayer;
          }
        }
        setGameBoard(board);
        break;
      default:
        break;
    }
  }

  async function markPosition(
    rowPosition = -1,
    columnPosition = -1,
    currentPlayer
  ) {
    try {
      const response = await axios.post(
        "http://localhost:5000/mark_board_position",
        {
          row: rowPosition,
          column: columnPosition,
          player: currentPlayer,
          board_id: boardId,
        }
      );
      if (response.data.message === "WIN") {
        window.localStorage.removeItem("@board_id");
        window.localStorage.removeItem("@player");
        markWin(
          response.data.win_type,
          response.data.pos,
          response.data.player
        );
      }
    } catch (e) {
      const message = e?.response?.data?.message || e;
      if (message === "WITHOUT SOLUTION") {
        window.localStorage.removeItem("@board_id");
        window.localStorage.removeItem("@player");
        setWithoutSolution(true);
      }
    }
  }

  useEffect(() => {
    (async () => {
      const board_id = window.localStorage.getItem("@board_id");
      const player_id = window.localStorage.getItem("@player");

      async function createBoard() {
        const response = await axios.post("http://localhost:5000/start");

        const data = response.data;
        window.localStorage.setItem("@board_id", data.board_id);
        setBoardId(data.board_id);
        setGameBoard(INITIAL_GAME_BOARD_STATE);
      }

      if (!board_id) {
        await createBoard();
      } else {
        try {
          const response = await axios.get(
            `http://localhost:5000/board/${board_id}`
          );

          setBoardId(board_id);
          setGameBoard(response.data.board);
          if (player_id) {
            setPlayer(Number(player_id));
          }
        } catch {
          await createBoard();
        }
      }

      setLoading(false);
      setWin(false);
    })();
  }, []);

  function updatePlayer(currentPlayer) {
    setPlayer(currentPlayer);
    window.localStorage.setItem("@player", currentPlayer);
  }

  return (
    <main id="main">
      {win && (
        <div id="win_main">
          <div id="win_box">
            <h1>Vitóriaaaa!!!!</h1>
            <div>
              <p>
                O player "<span>{getSymbol(player)}</span>" venceu esta partida!
              </p>
              <button
                onClick={() => {
                  window.location.reload();
                }}
              >
                Iniciar nova partida
              </button>
            </div>
          </div>
        </div>
      )}
      {withoutSolution && (
        <div id="win_main">
          <div id="win_box">
            <h1 className="red">Partida sem solução</h1>
            <div>
              <p>Não desanime, vamos jogar outra!</p>
              <button
                onClick={() => {
                  window.location.reload();
                }}
              >
                Iniciar nova partida
              </button>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <>
          <h1 id="title">Player: {getSymbol(player)}</h1>
          <div id="board">
            {gameBoard.map((row, rowIndex) => {
              return (
                <div className="row" key={`row-${rowIndex}`}>
                  {row.map((column, columnIndex) => {
                    function onPress() {
                      if (column !== null) return;

                      let _gameBoard = gameBoard;

                      _gameBoard[rowIndex][columnIndex] = player;

                      markPosition(rowIndex, columnIndex, player);
                      setGameBoard(_gameBoard);
                      updatePlayer(player === 1 ? 0 : 1);
                    }
                    let symbol = getSymbol(column);

                    function getClass() {
                      if (withoutSolution) return "gray";
                      if (!win) {
                        if (symbol === "X") {
                          return "marked-x";
                        } else if (symbol === "O") {
                          return "marked-o";
                        }
                        return null;
                      } else {
                        if (symbol !== null) {
                          return "win";
                        } else {
                          return "block";
                        }
                      }
                    }
                    return (
                      <button
                        data-row={rowIndex}
                        data-column={columnIndex}
                        onClick={onPress}
                        key={`column-${columnIndex}`}
                        className={getClass()}
                      >
                        {symbol === null && <p>{getSymbol(player)}</p>}
                        {symbol}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
