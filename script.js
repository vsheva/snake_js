const playBoard = document.querySelector(".play-board");
const scoreElement = document.querySelector(".score");
const highScoreElement = document.querySelector(".high-score");
const timeElement = document.querySelector(".time");
const snakeLivesElement = document.querySelector(".snakeLives");
const controls = document.querySelectorAll(".controls i");

function millisecondsToMinutesAndSeconds(milliseconds) {
  var minutes = Math.floor(milliseconds / 60000);
  var seconds = ((milliseconds % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}
let level = 1;
const field = 30;
let htmlMarkup = "";
let screen = "";
let foodX;
let foodY;
let obstacleX;
let obstacleY;
let bonusX;
let bonusY;
let isBonus;
let snakeLives = 3;
let isEvent = false;
let move = "";
let stepX = 0;
let stepY = 0;
let snakeX = 5;
let snakeY = 10;
let snakeBody = [[snakeX, snakeY]];
let setIntervalId;
let score = 0;
const foodPoints = 1;
const bonusPoints = 10;
let highScore = localStorage.getItem("high-score") || 0;
let levelTime = 30000;
let isTime = false;
const timeStep = 125;
let time = 0;
const protocol = [{ time: time, event: "start game", value: level }];

const setEvent = (newEvent, newValue) => {
  const newRecord = { time: time, event: newEvent, value: newValue };
  if (isTime) {
    protocol.push(newRecord);
    if (newRecord.event === "game over") isTime = false;
  } else protocol.unshift(newRecord);
};

const getFreeCell = (bookedCells) => {
  let freeCellX;
  let freeCellY;
  do {
    freeCellX = Math.floor(Math.random() * field) + 1;
    freeCellY = Math.floor(Math.random() * field) + 1;
  } while (
    bookedCells.every(
      (coord) => coord[0] === freeCellX || coord[1] === freeCellY
    )
  );

  return [freeCellX, freeCellY];
};

const setFoodPosition = () => {
  [foodX, foodY] = getFreeCell(snakeBody.concat([obstacleX, obstacleY]));
  setEvent("set food", foodX + ":" + foodY);
};

const setObstaclePosition = () => {
  [obstacleX, obstacleY] = getFreeCell(snakeBody);
  setEvent("set fix obstacle", obstacleX + ":" + obstacleY);
};

const setBonusPosition = () => {
  isBonus = true;
  [bonusX, bonusY] = getFreeCell(
    snakeBody.concat([obstacleX, obstacleY], [foodX, foodY])
  );
  setEvent("set point bonus", bonusX + ":" + bonusY);
};

const changeDirection = (e) => {
  const { event } = protocol[protocol.length - 1];
  let newEvent;
  if (e.key === "ArrowUp" && event !== "Y") {
    newEvent = { time: time, event: "Y", value: -1 };
  } else if (e.key === "ArrowDown" && event !== "Y") {
    newEvent = { time: time, event: "Y", value: 1 };
  } else if (e.key === "ArrowLeft" && event !== "X") {
    newEvent = { time: time, event: "X", value: -1 };
  } else if (e.key === "ArrowRight" && event !== "X") {
    newEvent = { time: time, event: "X", value: 1 };
  } else {
    return;
  }
  isTime = true;
  protocol.push(newEvent);
};

controls.forEach((key) => {
  key.addEventListener("click", () =>
    changeDirection({ key: key.dataset.key })
  );
});
/*
  Функция timer() запускает отсчет времени после начала игры
*/
const timer = () => {
  // время начинает расти только после того, как игра начинается (isTime === true)
  time += isTime ? timeStep : 0;
};
/*
    Функция render() выводит на экран игровое поле и табло на каждом шаге игры, 
    с учетом всех текущих изменений
  */
const render = () => {
  // первой создается голова змейки
  screen = `<div class="head" style="grid-area: ${snakeBody[0][1]} / ${snakeBody[0][0]}"></div>`;
  // к ней добавляется остальная часть, если она есть
  for (let i = 1; i < snakeBody.length; i++)
    screen += `<div class="head" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;
  // второй создается еда
  screen += `<div class="food" style="grid-area: ${foodY} / ${foodX}"></div>`;
  // третьим создается препятствие
  screen += `<div class="obstacle" style="grid-area: ${obstacleY} / ${obstacleX}"></div>`;
  // четвертым создается бонус, если он есть
  if (isBonus)
    screen += `<div class="bonus" style="grid-area: ${bonusY} / ${bonusX}"></div>`;
  // после  игрового поля создается табло
  scoreElement.innerHTML = `Score: ${score}`; // текущие очки
  highScoreElement.innerHTML = `High Score: ${highScore}`; // максимальный результат
  // остаток времени до окончания уровня
  timeElement.innerHTML = `Time: ${millisecondsToMinutesAndSeconds(
    levelTime - time < 0 ? 0 : levelTime - time
  )}`;
  snakeLivesElement.innerHTML = `Live: ${snakeLives}`;
  // вывод созданного изображения на экран
  playBoard.innerHTML = screen;
};
/*
  функция checkingRestrictions() проверяет, выполняются ли установленные игрой ограничения
*/
const checkingRestrictions = () => {
  // проверка соприкосновения с препятствиями
  if (snakeX === obstacleX && snakeY === obstacleY) {
    setEvent("game over", "obstacle contact");
    snakeLives--; // Decrement lives when hitting an obstacle

    if (snakeLives > 0) {
      // Reset snake's position to initial coordinates
      snakeX = 5;
      snakeY = 10;
    } else {
      setEvent("game over", "out of lives"); // Trigger game over if out of lives
      clearInterval(setIntervalId);
      alert("Game over! Press OK to replay...");
      localStorage.setItem("protocol", JSON.stringify(protocol));
      location.reload();
      return; // Exit the function to prevent further processing
    }
  }
  // проверка соприкосновения с границами поля
  if (snakeX <= 0 || snakeX > field || snakeY <= 0 || snakeY > field) {
    setEvent("game over", "border contact");
    snakeLives--; // Decrement lives when hitting the wall
    // Move these lines inside the "if" block to prevent early game over
    if (snakeLives <= 0) {
      setEvent("game over", "out of lives"); // Trigger game over if out of lives
      return; // Exit the function to prevent further processing
    }
  }
  // проверка соприкосновения змейки с самой собой
  for (let i = 0; i < snakeBody.length; i++) {
    if (
      i !== 0 &&
      snakeBody[0][1] === snakeBody[i][1] &&
      snakeBody[0][0] === snakeBody[i][0]
    ) {
      setEvent("game over", "contact with oneself");
      snakeLives--;
    }
  }
  // проверка превышения лимита времени, отведенного на текущий уровень
  if (time >= levelTime) {
    setEvent("game over", "time limit");
  }
};
/*
  функция checkingInteractions() проверяет, происходят ли доступные игроку взаимодействия
*/
const checkingInteractions = () => {
  // проверка соприкосновения змейки с едой
  if (snakeX === foodX && snakeY === foodY) {
    setEvent("food eaten", foodPoints);
  }
  // проверка соприкосновения змейки с бонусом
  if (snakeX === bonusX && snakeY === bonusY && isBonus) {
    setEvent("bonus eaten", bonusPoints);
  }
};
/*
  функция moveSnake() изменяет координаты змейки
*/
const moveSnake = () => {
  snakeX += stepX;
  snakeY += stepY;
  // смещаем координаты каждого элемента в массиве
  // с координатами змейки на один элемент назад
  for (let i = snakeBody.length - 1; i > 0; i--) {
    snakeBody[i] = snakeBody[i - 1];
  }
  // на место освободившегося первого элемента вводим текущие
  // координаты головы змейки
  snakeBody[0] = [snakeX, snakeY];
};

const protocolExecutor = () => {
  const { value, event } = protocol[protocol.length - 1];
  switch (event) {
    case "food eaten":
      snakeBody.push([]);
      setFoodPosition();
      score += value;
      highScore = score >= highScore ? score : highScore;
      localStorage.setItem("high-score", highScore);
      break;
    case "bonus eaten":
      if (isBonus) {
        isBonus = false;
        score += value;
        highScore = score >= highScore ? score : highScore;
        localStorage.setItem("high-score", highScore);
      }
      break;

    case "game over":
      clearInterval(setIntervalId);
      if (value === "out of lives") {
        alert("Out of lives! Press OK to replay...");
        localStorage.setItem("protocol", JSON.stringify(protocol));
        location.reload();
        return; // Exit the function to prevent the game from restarting immediately
      } else {
        alert("Game over! Press OK to replay...");
      }
      localStorage.setItem("protocol", JSON.stringify(protocol));
      location.reload();
      break;

    case "X":
      stepX = value;
      stepY = 0;
      break;
    case "Y":
      stepX = 0;
      stepY = value;
      break;
  }
};

// игра
setObstaclePosition();
setFoodPosition();
setBonusPosition();
setIntervalId = setInterval(() => {
  // перемещение змейки по игровому полю
  moveSnake();
  // проверка всех предусмотренных игрой ограничений
  checkingRestrictions();
  // проверка доступных игроку взаимодействий
  checkingInteractions();
  protocolExecutor();
  // вывод текущего изображения игры
  render();
  // отсчет игрового времени
  timer();
}, timeStep);
document.addEventListener("keydown", changeDirection);
