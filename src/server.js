const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')


const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.argv[2];
const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))
//initalizing on connecting to the server
var players = {}, quit = 0;
var board = ['.', '.', '.', '.', '.', '.', '.', '.', '.'];
var count = 1;
var opponentmatch;
var quitkey = "r";
var gameover = 0;

/*create Player*/
function createPlayer(socket) {
  players[socket.id] = {
    //game will start when opponent is found
    opponent: opponentmatch,

    symbol: "X",
    // The socket that is associated with this player
    socket: socket,
  };
  if (opponentmatch) {
    players[socket.id].symbol = "O";
    players[opponentmatch].opponent = socket.id;
    opponentmatch = null;
  } else {
    opponentmatch = socket.id;
  }
}
//accessing the opponent
function getOpponent(socket) {
  if (!players[socket.id].opponent) {
    return;
  }
  return players[players[socket.id].opponent].socket;
}


//checks for winning pattern on board

function processBoard(board, id) {

  var winPattern = "OOO";
  if (players[id].symbol.localeCompare("X") === 0) {
    winPattern = "XXX";
  }

  var row1 = board[0] + board[1] + board[2];
  if (row1 == winPattern) {
    return true
  }
  var row2 = board[3] + board[4] + board[5];
  if (row2 == winPattern) {
    return true
  }
  var row3 = board[6] + board[7] + board[8];
  if (row3 == winPattern) {
    return true
  }
  var col1 = board[0] + board[3] + board[6];
  if (col1 == winPattern) {
    return true
  }
  var col2 = board[1] + board[4] + board[7];
  if (col2 == winPattern) {
    return true
  }
  var col3 = board[2] + board[5] + board[8];
  if (col3 == winPattern) {
    return true
  }
  var diag1 = board[0] + board[4] + board[8];
  if (diag1 == winPattern) {
    return true
  }
  var diag2 = board[2] + board[4] + board[6];
  if (diag2 == winPattern) {
    return true
  }
  return false


}

io.on('connection', (socket) => {
  console.log('connected')
  quit = 0, count = 1;
  gameover = 0;
  board = ['.', '.', '.', '.', '.', '.', '.', '.', '.'];
  createPlayer(socket);

  if (getOpponent(socket)) {
    socket.emit("game.begin", {
      symbol: players[socket.id].symbol,
    });
    getOpponent(socket).emit("game.begin", {
      symbol: players[getOpponent(socket).id].symbol,
    });
  }

  socket.on('move', position => {

    //if pressed r ,game over 
    if (quit == 0 && position.trim() == quitkey) {
      quit = 1;
      socket.emit("gameOver", {
        symbol: players[socket.id].symbol,
        mssg: "You loose player"
      });
      getOpponent(socket).emit("gameOver", {
        symbol: players[getOpponent(socket).id].symbol,
        mssg: "You win player"
      });
      return
    }
    else if (quit == 1 || gameover == 1) {
      return;
    }
    //alphabets not allowed as input
    else if (isNaN(position)) {
      console.log("Invalid Move")
      return;
    }

    let pos = +position

    if (board[pos - 1].localeCompare(".") !== 0) {
      socket.emit("error", { data: "Invalid move ,Please try again" })
      return;
    }


    if (players[socket.id].symbol.localeCompare("X") === 0) {

      //player X only allowed to make odd moves
      if (count === 1 || count === 3 || count === 5 || count === 7 || count === 9) {
        count = count + 1
        if (board[pos - 1].localeCompare(".") === 0) {
          board[pos - 1] = players[socket.id].symbol;
        }

      }
      else {

        socket.emit("error", { data: "Your Opponent's move.Please Wait" })
      }
    }
    else {

      //player O only allowed to make even  moves
      if (count === 2 || count === 4 || count === 6 || count === 8) {
        count = count + 1
        board[pos - 1] = players[socket.id].symbol;
      }
      else {

        socket.emit('error', { data: "Your Opponent's move.Please Wait" })
      }

    }


    io.emit('showBoard', board)
    //minimum 5 moves required to decide winner
    if (count > 5 && count <= 10) {
      console.log(count)
      if (processBoard(board, socket.id)) {
        // console.log("Winner is now "+ players[socket.id].symbol)
        io.emit('win', players[socket.id].symbol)
        gameover = 1
      }
      else {
        if (count >= 10) {
          io.emit('draw', "Game results in draw")
          gameover = 1
        }
      }
    }



  })


})
io.on('disconnect', (evt) => {
  console.log('disconnected')
})


//connecting to the specific product
server.listen(port, () => {
  console.log(`Server is up on port ${port}!`)

})