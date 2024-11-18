//globalne varijable
// Postavljanje osnovnih varijabli za igru,
// uključujući dimenzije elemenata (igrač, blokovi, loptica), početne pozicije i kutove
let board;
let context;
let boardWidth;
let boardHeight;
let playerWidth = 150;
let playerHeight = 15;
let playerVelocityX = 8;
let highScore = localStorage.getItem("highScore") || 0;
let player;
let ball;
let ballWidth = 20;
let ballHeight = 20;
let angle = Math.PI / 4 + (Math.random() * Math.PI) / 2;
let speed = 7;
let blockArray = [];
let blockWidth = 50;
let blockHeight = 30;
let blockColumns = 5;
let blockRows = 3;

let score = 0;
let gameOver = false;

let keys = {
    ArrowLeft: false,
    ArrowRight: false,
};

//Inicijalizira sve potrebne elemente igre, postavlja događaje za tipkovnicu i pokreće igru
window.onload = function () {
    board = document.getElementById("game");
    context = board.getContext("2d");

    adjustCanvas();

    window.addEventListener("resize", adjustCanvas);

    document.addEventListener("keydown", (e) => {
        if (e.code === "ArrowLeft") keys.ArrowLeft = true;
        if (e.code === "ArrowRight") keys.ArrowRight = true;
        if (gameOver && e.code === "Space") resetGame();
    });

    document.addEventListener("keyup", (e) => {
        if (e.code === "ArrowLeft") keys.ArrowLeft = false;
        if (e.code === "ArrowRight") keys.ArrowRight = false;
    });

    resetGame();
    requestAnimationFrame(update);
    requestAnimationFrame(movePlayerSmooth);
};
//Funkcija prilagođava dimenzije platna veličini prozora i postavlja početne pozicije igrača, loptice i blokova.
function adjustCanvas() {
    board.width = window.innerWidth;
    board.height = window.innerHeight;
    boardWidth = board.width;
    boardHeight = board.height;

    player = {
        x: boardWidth / 2 - playerWidth / 2,
        y: boardHeight - playerHeight - 10,
        width: playerWidth,
        height: playerHeight,
        velocityX: playerVelocityX,
    };

    ball = {
        x: boardWidth / 2,
        y: boardHeight / 2,
        width: ballWidth,
        height: ballHeight,
        velocityX: speed * Math.cos(angle) * (Math.random() < 0.5 ? -1 : 1),
        velocityY: -speed * Math.sin(angle),
    };

    createBlocks(); //Stvaranje blokova
}
//Funkcija ažurira stanje igre, detektira sudare, ažurira bodove i provjerava uvjete za završetak igre
function update() {
    requestAnimationFrame(update); // ažuriranje igre

    context.clearRect(0, 0, board.width, board.height); // Brisanje platna

    if (gameOver) {
        // Prikazuje poruku o završetku igre
        if (blockArray.every(block => block.break)) {
            context.font = "60px Verdana";
            context.fillStyle = "green";
            context.textAlign = "center";
            context.fillText("YOU WIN!", boardWidth / 2, boardHeight / 2);
        } else {
            context.font = "60px Verdana";
            context.fillStyle = "red";
            context.textAlign = "center";
            context.fillText("GAME OVER", boardWidth / 2, boardHeight / 2);
        }

        context.font = "20px Verdana";
        context.fillStyle = "white";
        context.fillText(
            "Press 'Space' to Restart",
            boardWidth / 2,
            boardHeight / 2 + 50
        );
        return;
    }

    // Crtanje igrača
    context.fillStyle = "red";
    context.shadowBlur = 5;
    context.shadowColor = "lightgray";
    context.fillRect(player.x, player.y, player.width, player.height);
    context.shadowBlur = 0;
    context.shadowColor = "transparent";
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    // Crtanje loptice
    context.fillStyle = "white";
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
    context.beginPath();
    context.arc(
        ball.x + ball.width / 2,
        ball.y + ball.height / 2,
        ball.width / 2,
        0,
        2 * Math.PI
    );
    context.fill();
    // Provjera sudara loptice s granicama
    if (ball.y <= 0) {
        ball.velocityY *= -1;
    } else if (ball.x <= 0 || ball.x + ball.width >= boardWidth) {
        ball.velocityX *= -1;
    } else if (ball.y + ball.height >= boardHeight) {
        gameOver = true;
    }
    // Provjera sudara loptice s igračem
    if (topCollision(ball, player) || bottomCollision(ball, player)) {
        ball.velocityY *= -1;
    } else if (rightCollision(ball, player) || leftCollision(ball, player)) {
        ball.velocityX *= -1;
    }

    context.fillStyle = "skyblue";
    context.fillStyle = "red";
    context.shadowBlur = 5;
    context.shadowColor = "lightgray";
    // Crtanje i provjera sudara s blokovima
    for (let i = 0; i < blockArray.length; i++) {
        let block = blockArray[i];
        if (!block.break) {
            if (topCollision(ball, block) || bottomCollision(ball, block)) {
                block.break = true; // Blok se razbija
                ball.velocityY *= -1;
                score += 1;
            } else if (leftCollision(ball, block) || rightCollision(ball, block)) {
                block.break = true; // Blok se razbija
                ball.velocityX *= -1;
                score += 1;
            }

            context.fillRect(block.x, block.y, block.width, block.height);
        }
    }
    context.shadowBlur = 0;
    context.shadowColor = "transparent";
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;

    // Provjera pobjede
    if (blockArray.every(block => block.break)) {
        gameOver = true;
    }

    // Ažuriranje najbolje ocjene
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
    }

    // Prikaz bodova
    context.font = "20px Verdana";
    context.fillStyle = "white";
    context.textAlign = "right";
    context.fillText(`Score: ${score}`, boardWidth - 10, 20);
    context.fillText(`High Score: ${highScore}`, boardWidth - 10, 40);
}


//Funkcija omogućuje kretanje igrača lijevo-desno, unutar granica platna
function movePlayerSmooth() {
    if (keys.ArrowLeft) {
        let nextPlayerX = player.x - player.velocityX;
        if (!outOfBounds(nextPlayerX)) {
            player.x = nextPlayerX;
        }
    }
    if (keys.ArrowRight) {
        let nextPlayerX = player.x + player.velocityX;
        if (!outOfBounds(nextPlayerX)) {
            player.x = nextPlayerX;
        }
    }
    requestAnimationFrame(movePlayerSmooth);
}

function outOfBounds(x) {
    return x < 0 || x + playerWidth > boardWidth;
}
//Funkcija provjerava sudar loptice s igračem i blokovima iz određenih smjerova
function detectCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}
// Specifične funkcije za provjeru smjera sudara
function topCollision(ball, block) {
    return detectCollision(ball, block) && ball.y + ball.height >= block.y;
}

function bottomCollision(ball, block) {
    return detectCollision(ball, block) && block.y + block.height >= ball.y;
}

function leftCollision(ball, block) {
    return detectCollision(ball, block) && ball.x + ball.width >= block.x;
}

function rightCollision(ball, block) {
    return detectCollision(ball, block) && block.x + block.width >= ball.x;
}
//Funkcija za generiranje blokova
function createBlocks() {
    blockArray = [];
    let padding = 30;
    let marginTop = 50;
    let marginSides = 80;


    blockWidth =
        (boardWidth - marginSides * 2 - padding * (blockColumns - 1)) /
        blockColumns;


    blockHeight = 15;

    for (let i = 0; i < blockColumns; i++) {
        for (let j = 0; j < blockRows; j++) {
            let block = {
                x: marginSides + i * (blockWidth + padding),
                y: marginTop + j * (blockHeight + padding),
                width: blockWidth,
                height: blockHeight,
                break: false,
            };
            blockArray.push(block);
        }
    }
}
//Funkcija resetira stanje igre na početne vrijednosti, postavlja novu lopticu i blokove
function resetGame() {
    gameOver = false;

    player = {
        x: boardWidth / 2 - playerWidth / 2,
        y: boardHeight - playerHeight - 10,
        width: playerWidth,
        height: playerHeight,
        velocityX: playerVelocityX,
    };


    let angle = Math.PI / 4 + (Math.random() * Math.PI) / 2;

    ball = {
        x: boardWidth / 2,
        y: boardHeight / 2,
        width: ballWidth,
        height: ballHeight,
        velocityX: speed * Math.cos(angle) * (Math.random() < 0.5 ? -1 : 1),
        velocityY: -speed * Math.sin(angle),
    };

    blockArray = [];
    score = 0;
    createBlocks();
}


