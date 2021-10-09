const port = process.argv[3];
const ip = process.argv[2];


var socket = require('socket.io-client')(`http://${ip}:${port}`);
const repl = require('repl');
const chalk = require('chalk');

//converting array board to string and displaying it
socket.on('showBoard', board => {
    let str = board.toString()

    console.log(board.slice(0, 3).toString().replace(/[, ]+/g, " "), ' ');
    console.log(board.slice(3, 6).toString().replace(/[, ]+/g, " "), ' ');
    console.log(board.slice(6, 9).toString().replace(/[, ]+/g, " "), ' ');



})
//on connecting of client message displayed to respective cient
socket.on('connect', () => {

    console.log(chalk.green.inverse('connected to ' + ip + ' ' + port));

})

socket.on('message', (data) => {

    console.log(chalk.green(data));
})

socket.on('win', winner => {
    console.log("Winner is player " + winner);

})
socket.on('draw', data => {
    console.log(chalk.blue.inverse(data));


})
socket.on('error', data => {
    console.log(chalk.red.inverse(data.data))

})

socket.on('game.begin', data => {
    console.log("You are player " + data.symbol)
    console.log("First turn X player's  ")
})
socket.on('gameOver', message => {
    console.log(message.mssg + message.symbol)
    //console.log("You loose")
})
//using repl to take input from CLI
repl.start({
    prompt: '',
    eval: (cmd) => {
        socket.emit('move', cmd)
    }
})