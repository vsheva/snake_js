const playBoard = document.querySelector(".play-board");
const scoreElement = document.querySelector(".score");
const highScoreElement = document.querySelector(".high-score");
const controls = document.querySelectorAll(".controls i");

let htmlMarkup = "";
let gameOver = false;
let foodX;
let foodY;
let obstacleX;
let obstacleY;
let snakeX = 5;
let snakeY = 10;
let snakeBody = [];
let setIntervalId;
let score = 0;
let highScore = localStorage.getItem("high-score") || 0;
highScoreElement.innerHTML = `High Score: ${highScore}`;
const timeStep = 100;
let time = 0;
const protocol = [{ time: time, move: "", step: 0, event: "start game" }];

const setEvent = (newEvent) => {
  const lastMove = protocol[protocol.length - 1];
  const newRecord = { ...lastMove, time: time, event: newEvent };
  if (lastMove.event !== "start game") {
    protocol[protocol.length - 1] = newRecord;
    if (newEvent !== "game over" && !newEvent.includes("new"))
      protocol.push(newRecord);
  } else protocol.unshift(newRecord);
};

const changeFoodPosition = () => {
  foodX = Math.floor(Math.random() * 30) + 1;
  foodY = Math.floor(Math.random() * 30) + 1;
  setEvent("new food coordinates: " + foodX + ":" + foodY);
};

const setObstaclePosition = () => {
  obstacleX = Math.floor(Math.random() * 30) + 1;
  obstacleY = Math.floor(Math.random() * 30) + 1;
  setEvent("fix obstacle coordinates: " + obstacleX + ":" + obstacleY);
};

const changeDirection = (e) => {
  const { move } = protocol[protocol.length - 1];
  if (e.key === "ArrowUp" && move !== "Y") {
    protocol.push({ time: time, move: "Y", step: -1, event: "" });
  } else if (e.key === "ArrowDown" && move !== "Y") {
    protocol.push({ time: time, move: "Y", step: 1, event: "" });
  } else if (e.key === "ArrowLeft" && move !== "X") {
    protocol.push({ time: time, move: "X", step: -1, event: "" });
  } else if (e.key === "ArrowRight" && move !== "X") {
    protocol.push({ time: time, move: "X", step: 1, event: "" });
  }
  initGame();
};

controls.forEach((key) => {
  key.addEventListener("click", () =>
    changeDirection({ key: key.dataset.key })
  );
});

const initGame = (timeStep) => {
  htmlMarkup = `<div class="food" style="grid-area: ${foodY} / ${foodX}"></div>`;
  htmlMarkup += `<div class="obstacle" style="grid-area: ${obstacleY} / ${obstacleX}"></div>`;

  if (snakeX === foodX && snakeY === foodY) {
    setEvent("food eaten");
  }

  if (snakeX === obstacleX && snakeY === obstacleY) {
    setEvent("game over");
  }

  const { move, step, event } = protocol[protocol.length - 1];
  switch (event) {
    case "food eaten":
      snakeBody.push([]);
      changeFoodPosition();
      score++;
      highScore = score >= highScore ? score : highScore;
      localStorage.setItem("high-score", highScore);
      scoreElement.innerHTML = `Score: ${score}`;
      highScoreElement.innerHTML = `High Score: ${highScore}`;
      break;
    case "game over":
      clearInterval(setIntervalId);
      alert("Game over! Press OK to replay...");
      localStorage.setItem("protocol", JSON.stringify(protocol));
      location.reload();
      break;
  }
  switch (move) {
    case "X":
      snakeX += step;
      break;
    case "Y":
      snakeY += step;
      break;
  }

  for (let i = snakeBody.length - 1; i > 0; i--) {
    snakeBody[i] = snakeBody[i - 1];
  }
  snakeBody[0] = [snakeX, snakeY];

  if (snakeX <= 0 || snakeX > 30 || snakeY <= 0 || snakeY > 30) {
    setEvent("game over");
  }

  for (let i = 0; i < snakeBody.length; i++) {
    htmlMarkup += `<div class="head" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;
    if (
      i !== 0 &&
      snakeBody[0][1] === snakeBody[i][1] &&
      snakeBody[0][0] === snakeBody[i][0]
    ) {
      setEvent("game over");
    }
  }
  playBoard.innerHTML = htmlMarkup;
};
changeFoodPosition();
setObstaclePosition();
initGame();
setIntervalId = setInterval(() => {
  initGame(timeStep);
  time = time + timeStep;
}, timeStep);
document.addEventListener("keydown", changeDirection);
