const playBoard = document.querySelector(".play-board");
const scoreElement = document.querySelector(".score");
const leftToEatElement = document.querySelector(".left-to-eat");
const timeElement = document.querySelector(".time");
const levelElement = document.querySelector(".level");
const controls = document.querySelectorAll(".controls i");

function millisecondsToMinutesAndSeconds(milliseconds) {
  var minutes = Math.floor(milliseconds / 60000);
  var seconds = ((milliseconds % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}
const levels = [
  {
    field: 15,
    time: 10000, // 00:10
    timeStep: 250,
    food: {
      amount: 2,
      scores: 1,
    },
    obstacles: [],
    bonuses: [],
    maxScores: 2,
  },
  {
    field: 30,
    time: 40000,
    timeStep: 125,
    food: {
      amount: 7,
      scores: 1,
    },
    obstacles: ["fix", "fix"],
    bonuses: [
      { type: "points", value: 10, startFood: 3 },
      { type: "points", value: 20, startFood: 6 },
    ],
    maxScores: 39,
  },
];
const maxLevel = levels.length;
let level = 1;
let field;
let isLevelComplete = false;
let screen = "";
let foodX;
let foodY;
const obstacles = [];
let obstacleX;
let obstacleY;
let bonusX;
let bonusY;
let isBonus = false;
let isBonusEaten = false;
let currentBonus;
let leftToEat;
let stepX = 0;
let stepY = 0;
let snakeX = 5;
let snakeY = 10;
let snakeBody = [[snakeX, snakeY]];
let setIntervalId;
let score = 0;
const foodPoints = 1;
let maxScores;
let levelTime;
let isTime = false;
let timeStep;
let time = 0;
const protocol = [];

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

const setLevel = () => {
  protocol.push({ time: time, event: "start game", value: level });
  field = levels[level - 1].field;
  levelTime = levels[level - 1].time;
  timeStep = levels[level - 1].timeStep;
  maxScores = levels[level - 1].maxScores;
};

const counter = () => {
  // проверка генерации еды
  const foodAmount = protocol.filter((notice) => notice.event === "food eaten");
  leftToEat = levels[level - 1].food.amount - foodAmount.length;
  if (leftToEat === 0) {
    setEvent("level is complete", level);
    isLevelComplete = true;
  }
  // проверка генерации бонусов
  if (levels[level - 1].bonuses.length !== 0) {
    let bonusesList = levels[level - 1].bonuses.map((bonus) => bonus.startFood);
    bonusesList = bonusesList.map((li) => {
      return { start: li, end: li + 2 };
    });
    for (let i = 0; i < bonusesList.length; i++) {
      if (foodAmount.length === bonusesList[i].start) {
        isBonus = true;
        currentBonus = i;
      }
      if (foodAmount.length === bonusesList[i].end) {
        isBonus = false;
        isBonusEaten = false;
      }
    }
  }
};

const setFoodPosition = () => {
  [foodX, foodY] = getFreeCell(snakeBody.concat(obstacles));
  setEvent("set food", foodX + ":" + foodY);
};

const setObstaclePosition = () => {
  let booking = [];
  booking.push(snakeBody);
  for (let i = 0; i < levels[level - 1].obstacles.length; i++) {
    [obstacleX, obstacleY] = getFreeCell(booking);
    obstacles.push({ X: obstacleX, Y: obstacleY });
    setEvent("set fix obstacle", obstacleX + ":" + obstacleY);
    booking.push([obstacleX, obstacleY]);
  }
};

const setBonusPosition = () => {
  [bonusX, bonusY] = getFreeCell(snakeBody.concat(obstacles, [foodX, foodY]));
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
  playBoard.style.gridTemplate = `repeat(${field}, 1fr) / repeat(${field}, 1fr)`;
  // первой создается голова змейки
  screen = `<div class="head" style="grid-area: ${snakeBody[0][1]} / ${snakeBody[0][0]}"></div>`;
  // к ней добавляется остальная часть, если она есть
  for (let i = 1; i < snakeBody.length; i++)
    screen += `<div class="head" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;
  // второй создается еда
  screen += `<div class="food" style="grid-area: ${foodY} / ${foodX}"></div>`;
  // третьим создается препятствие
  for (let i = 0; i < obstacles.length; i++)
    screen += `<div class="obstacle" style="grid-area: ${obstacles[i].Y} / ${obstacles[i].X}"></div>`;
  // четвертым создается бонус, если он есть
  if (isBonus && !isBonusEaten)
    screen += `<div class="bonus" style="grid-area: ${bonusY} / ${bonusX}"></div>`;
  // после  игрового поля создается табло
  scoreElement.innerHTML = `Score: ${score}`; // текущие очки
  highScoreElement.innerHTML = `LeftToEat: ${leftToEat}`; // максимально возможный результат
  // остаток времени до окончания уровня
  timeElement.innerHTML = `Time: ${millisecondsToMinutesAndSeconds(
    levelTime - time < 0 ? 0 : levelTime - time
  )}`;
  levelElement.innerHTML = `Level: ${level}`; // текущий уровень
  // вывод созданного изображения на экран
  playBoard.innerHTML = !isLevelComplete ? screen : "";
};
/*
  функция checkingRestrictions() проверяет, выполняются ли установленные игрой ограничения
*/
const checkingRestrictions = () => {
  // проверка соприкосновения с препятствиями
  if (snakeX === obstacleX && snakeY === obstacleY) {
    setEvent("game over", "obstacle contact");
  }
  // проверка соприкосновения с границами поля
  if (snakeX <= 0 || snakeX > field || snakeY <= 0 || snakeY > field) {
    setEvent("game over", "border contact");
  }
  // проверка соприкосновения змейки с самой собой
  for (let i = 0; i < snakeBody.length; i++) {
    if (
      i !== 0 &&
      snakeBody[0][1] === snakeBody[i][1] &&
      snakeBody[0][0] === snakeBody[i][0]
    ) {
      setEvent("game over", "contact with oneself");
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
    setEvent("bonus eaten", levels[level - 1].bonuses[currentBonus].value);
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
      break;
    case "bonus eaten":
      if (!isBonusEaten) {
        isBonusEaten = true;
        score += value;
      }
      break;
    case "level is complete":
      level++;
      if (level > levels.length) {
        clearInterval(setIntervalId);
        alert("You WIN! Press OK to replay...");
        localStorage.setItem("protocol", JSON.stringify(protocol));
        location.reload();
        break;
      }
      clearInterval(setIntervalId);
      alert(
        `Level ${
          level - 1
        } is complete! Congratulation! Well done! It's time to Level ${level}`
      );
      isLevelComplete = false;
      snakeX = 5;
      snakeY = 10;
      stepX = 0;
      stepY = 0;
      snakeBody = [[snakeX, snakeY]];
      setLevel();
      setObstaclePosition();
      setFoodPosition();
      setIntervalId = setInterval(() => {
        // перемещение змейки по игровому полю
        moveSnake();
        // проверка всех предусмотренных игрой ограничений
        checkingRestrictions();
        // проверка доступных игроку взаимодействий
        checkingInteractions();
        protocolExecutor();
        counter();
        // вывод текущего изображения игры
        render();
        // отсчет игрового времени
        timer();
      }, timeStep);
      break;
    case "game over":
      clearInterval(setIntervalId);
      alert("Game over! Press OK to replay...");
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
setLevel();
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
  counter();
  // вывод текущего изображения игры
  render();
  // отсчет игрового времени
  timer();
}, timeStep);

document.addEventListener("keydown", changeDirection);
