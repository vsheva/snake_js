const playBoard = document.querySelector(".play-board");
const scoreElement = document.querySelector(".fa-wallet");
const leftToEatElement = document.querySelector(".fa-carrot");
const timeElement = document.querySelector(".fa-clock");
const levelElement = document.querySelector(".fa-stairs");
const lifeElement = document.querySelector(".fa-heart");
const controls = document.querySelectorAll(".controls i");

function millisecondsToMinutesAndSeconds(milliseconds) {
  var minutes = Math.floor(milliseconds / 60000);
  var seconds = ((milliseconds % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}
const levels = [
  // {
  //   field: 15,
  //   time: 15000,
  //   timeStep: 250,
  //   food: 2,
  //   snakeLives: 2,
  //   obstacles: [],
  //   bonuses: [],
  //   maxScores: 2,
  // },
  {
    field: 30,
    time: 35000,
    timeStep: 125,
    food: 10,
    snakeLives: 3,
    obstacles: ["fix", "x", "y"],
    bonuses: [
      { type: "time", value: 20000, startFood: 1 },
      { type: "points", value: 10, startFood: 4 },
      { type: "lives", value: 20, startFood: 7 },
    ],
    maxScores: 39,
  },
];
const maxLevel = levels.length;
let level = 1;
let field;
let foodLevel;
let currentFood;
let isLevelComplete = false;
let screen = "";
let foodX;
let foodY;
let snakeLives;
let isMistake = false;
const obstacles = [];
let obstacleX;
let obstacleY;
let bonusX;
let bonusY;
let isBonus = false;
let isBonusEaten = false;
let isBonusShow = false;
let currentBonus;
let leftToEat;
let stepX = 0;
let stepY = 0;
let snakeX = 1;
let snakeY = 1;
let snakeBody = [[snakeX, snakeY]];
let setIntervalId;
let score = 0;
const foodPoints = 1;
let maxScores;
let levelTime;
let extraTime = 0;
let liveScores = 0;
let isTime = false;
let timeStep;
let time = 0;
const protocol = [];
let obstacleSpeed = 0;
let obstacleStep = [];
let obstaclesX = [];
let obstaclesY = [];
let obstaclesF = [];
let isRender = false;

const setEvent = (newEvent, newValue) => {
  const newRecord = { time: time, event: newEvent, value: newValue };
  protocol.push(newRecord);
  if (
    newRecord.event === "game over" ||
    newRecord.event === "level is complete"
  )
    isTime = false;
};

const getFreeCell = (bookedCells) => {
  const snakeReserve = [];
  const snakeRows = Math.floor(foodLevel / field);
  for (let i = 0; i < snakeRows; i++) {
    for (let y = 0; y < field; y++) {
      snakeReserve.push([1 + y, 1 + i]);
    }
  }
  for (let z = 0; z < foodLevel - snakeRows * field; z++)
    snakeReserve.push([1 + z, snakeRows + 1]);
  bookedCells = bookedCells.concat(snakeReserve);
  let freeCellX;
  let freeCellY;
  do {
    freeCellX = Math.floor(Math.random() * field) + 1;
    freeCellY = Math.floor(Math.random() * field) + 1;
  } while (
    bookedCells.some(
      (coord) => coord[0] === freeCellX && coord[1] === freeCellY
    )
  );

  return [freeCellX, freeCellY];
};

const setLevel = () => {
  time = 0;
  protocol.push({ time: time, event: "start level", value: level });
  field = levels[level - 1].field;
  foodLevel = levels[level - 1].food;
  levelTime = levels[level - 1].time + extraTime;
  timeStep = levels[level - 1].timeStep;
  maxScores = levels[level - 1].maxScores;
  snakeLives = levels[level - 1].snakeLives;
  obstaclesX = levels[level - 1].obstacles.filter(
    (obstacle) => obstacle === "x"
  );
  obstaclesY = levels[level - 1].obstacles.filter(
    (obstacle) => obstacle === "y"
  );
  obstaclesF = levels[level - 1].obstacles.filter(
    (obstacle) => obstacle === "fix"
  );
  score = score + liveScores;

  isTime = false;
};

const counter = () => {
  // проверка генерации еды
  const currentLevelProtocolStart = protocol.findIndex(
    (notice) => notice.event === "start level" && notice.value === level
  );
  currentFood = protocol
    .slice(currentLevelProtocolStart)
    .filter((notice) => notice.event === "food eaten").length;
  leftToEat = foodLevel - currentFood;
  if (leftToEat === 0) {
    setEvent("level is complete", level);
    extraTime = levelTime - time;
    liveScores = snakeLives * 3;
    isLevelComplete = true;
  }

  // проверка генерации бонусов
  if (levels[level - 1].bonuses.length !== 0) {
    let bonusesList = levels[level - 1].bonuses.map((bonus) => bonus.startFood);
    bonusesList = bonusesList.map((li) => {
      return { start: li, end: li + 2 };
    });
    for (let i = 0; i < bonusesList.length; i++) {
      if (currentFood === bonusesList[i].start && !isBonusShow) {
        isBonus = true;
        isBonusShow = true;
        currentBonus = i;
        setBonusPosition();
      }
      if (currentFood === bonusesList[i].end) {
        if (isBonusShow && !isBonusEaten)
          setEvent("bonus is deleted", currentBonus + 1);
        isBonus = false;
        isBonusEaten = false;
        isBonusShow = false;
      }
    }
  }
  // проверка оставшихся жизней
  if (isMistake) {
    snakeLives -= 1;
    snakeLives < 0
      ? setEvent("game over", "lives limit")
      : setEvent("level continue", level);
  }
  // проверка на прерывание игры
  if (time >= levelTime) setEvent("game over", "time limit");
};

const setFoodPosition = () => {
  let copySnake = snakeBody.slice();
  if (currentFood !== foodLevel - 1) {
    [foodX, foodY] = getFreeCell(copySnake.concat(obstacles));
    setEvent("set food", foodX + ":" + foodY);
  }
};

const setObstaclePosition = (type) => {
  let booking = [];
  let obstacles = [];
  let obstaclesDirection =
    type === "x"
      ? obstaclesX.slice()
      : type === "y"
      ? obstaclesY.slice()
      : obstaclesF.slice();
  let copySnake = snakeBody.slice();
  if (type !== "fix") obstacles.concat(obstaclesF.slice());
  if (type === "y") obstacles.concat(obstaclesX.slice());
  booking.push(copySnake.concat(obstacles));

  obstaclesDirection = obstaclesDirection.map((obstacle) => {
    [obstacleX, obstacleY] = getFreeCell(booking);
    setEvent(
      `set obstacle ${type === "fix" ? "fix" : "moving " + type}`,
      obstacleX + ":" + obstacleY
    );
    booking.push([obstacleX, obstacleY]);
    return [obstacleX, obstacleY];
  });

  return obstaclesDirection;
};

const moveObstacle = (direction) => {
  const obstacles = direction === "x" ? obstaclesX.slice() : obstaclesY.slice();
  obstacleSpeed += timeStep;
  if (obstacleSpeed / timeStep === 5) {
    if (isTime) {
      const index = direction === "x" ? 0 : 1;
      for (let i = 0; i < obstacles.length; i++) {
        obstacleStep.push(1);
        if (obstacles[i][index] === field) {
          obstacleStep[i] = -1;
        }

        if (obstacles[i][index] === 1) {
          obstacleStep[i] = 1;
        }
        obstacles[i][index] += obstacleStep[i];
      }
    }
    obstacleSpeed = 0;
  }

  return obstacles;
};

const setBonusPosition = () => {
  let copySnake = snakeBody.slice();
  [bonusX, bonusY] = getFreeCell(copySnake.concat(obstacles, [foodX, foodY]));
  setEvent(
    `set ${levels[level - 1].bonuses[currentBonus].type} bonus`,
    bonusX + ":" + bonusY
  );
};

const changeDirection = (e) => {
  if (isRender) {
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
    if (isTime || !isMistake || time === 0) protocol.push(newEvent);
    isTime = true;
  }
  isRender = false;
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
  for (let i = 0; i < obstaclesF.length; i++)
    screen += `<div class="obstacle" style="grid-area: ${obstaclesF[i][1]} / ${obstaclesF[i][0]}"></div>`;
  for (let i = 0; i < obstaclesX.length; i++)
    screen += `<div class="obstacle" style="grid-area: ${obstaclesX[i][1]} / ${obstaclesX[i][0]}"></div>`;
  for (let i = 0; i < obstaclesY.length; i++)
    screen += `<div class="obstacle" style="grid-area: ${obstaclesY[i][1]} / ${obstaclesY[i][0]}"></div>`;
  // четвертым создается бонус, если он есть
  if (isBonus && !isBonusEaten)
    screen += `<div class="bonus-${
      levels[level - 1].bonuses[currentBonus].type
    }" style="grid-area: ${bonusY} / ${bonusX}"></div>`;
  // после  игрового поля создается табло
  scoreElement.innerHTML = ` ${score}`; // текущие очки
  leftToEatElement.innerHTML = ` ${leftToEat}`; // максимально возможный результат
  // остаток времени до окончания уровня
  timeElement.innerHTML = ` ${millisecondsToMinutesAndSeconds(
    levelTime - time < 0 ? 0 : levelTime - time
  )}`;
  levelElement.innerHTML = ` ${level}`; // текущий уровень
  lifeElement.innerHTML = ` ${snakeLives < 0 ? 0 : snakeLives}`;
  // вывод созданного изображения на экран
  playBoard.innerHTML = !isLevelComplete ? screen : "";
  isRender = true;
};
/*
  функция checkingRestrictions() проверяет, выполняются ли установленные игрой ограничения
*/
const checkingRestrictions = () => {
  if (isTime) {
    // проверка соприкосновения с препятствиями
    for (let i = 0; i < obstaclesX.length; i++)
    if (snakeX === obstaclesX[i][0] && snakeY === obstaclesX[i][1]) {
      setEvent('life lost', 'obstacle ' + obstaclesX[i][0] + ':' + obstaclesX[i][1] + ' contact');
    }

  for (let i = 0; i < obstaclesY.length; i++)
    if (snakeX === obstaclesY[i][0] && snakeY === obstaclesY[i][1]) {
      setEvent('life lost', 'obstacle ' + obstaclesY[i][0] + ':' + obstaclesY[i][1] + ' contact');
    }

  for (let i = 0; i < obstaclesF.length; i++)
    if (snakeX === obstaclesF[i][0] && snakeY === obstaclesF[i][1]) {
      setEvent('life lost', 'obstacle ' + obstaclesF[i][0] + ':' + obstaclesF[i][1] + ' contact');
    }
    // проверка соприкосновения с границами поля

    if (snakeX <= 0 || snakeX > field || snakeY <= 0 || snakeY > field) {
      setEvent("life lost", "border " + snakeX + ":" + snakeY + " contact");
    }
    // проверка соприкосновения змейки с самой собой
    for (let i = 0; i < snakeBody.length; i++) {
      if (
        i !== 0 &&
        snakeBody[0][1] === snakeBody[i][1] &&
        snakeBody[0][0] === snakeBody[i][0]
      ) {
        setEvent(
          "life lost",
          "contact with oneself " + snakeBody[0][0] + ":" + snakeBody[0][1]
        );
      }
    }
  }
};
/*
  функция checkingInteractions() проверяет, происходят ли доступные игроку взаимодействия
*/
const checkingInteractions = () => {
  // проверка соприкосновения змейки с едой
  if (snakeX === foodX && snakeY === foodY) {
    setEvent("food eaten", currentFood + 1);
  }
  // проверка соприкосновения змейки с бонусом
  if (snakeX === bonusX && snakeY === bonusY && isBonus) {
    setEvent(
      "bonus eaten",
      `${levels[level - 1].bonuses[currentBonus].value} ${
        levels[level - 1].bonuses[currentBonus].type
      }`
    );
  }
};
/*
  функция moveSnake() изменяет координаты змейки
*/
const moveSnake = () => {
  if (stepX !== 0 || stepY !== 0) {
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
  }
};

const protocolExecutor = () => {
  const { value, event } = protocol[protocol.length - 1];
  switch (event) {
    case "food eaten":
      snakeBody.push([]);
      setFoodPosition();
      score += foodPoints;
      break;
    case "bonus eaten":
      if (!isBonusEaten) {
        isBonusEaten = true;
        const bonusType = levels[level - 1].bonuses[currentBonus].type;
        const bonusValue = levels[level - 1].bonuses[currentBonus].value;
        switch (bonusType) {
          case "lives":
            snakeLives += bonusValue;
            break;
          case "points":
            score += bonusValue;
            break;
          case "time":
            levelTime += bonusValue;
            break;
        }
      }
      break;
    case "start level":
      isLevelComplete = false;
      snakeX = 1;
      snakeY = 1;
      stepX = 0;
      stepY = 0;
      snakeBody = [[snakeX, snakeY]];
      obstaclesF = setObstaclePosition("fix");
      obstaclesX = setObstaclePosition("x");
      obstaclesY = setObstaclePosition("y");
      setFoodPosition();
      setIntervalId = setInterval(() => {
        // перемещение змейки по игровому полю
        moveSnake();
        // перемещение препятствий
        obstaclesX = moveObstacle("x");
        obstaclesY = moveObstacle("y");
        // проверка доступных игроку взаимодействий
        checkingInteractions();
        // проверка всех предусмотренных игрой ограничений
        checkingRestrictions();
        protocolExecutor();
        counter();
        // вывод текущего изображения игры
        render();
        // отсчет игрового времени
        timer();
      }, timeStep);
      break;
    case "level is complete":
      level++;
      isTime = false;
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
      setLevel();
      protocolExecutor();
      break;
    case "life lost":
      isMistake = true;
      alert(
        `You made a mistake ${value} here! Be careful! You only have ${snakeLives} lives left!`
      );
      stepX = 0;
      stepY = 0;
      let snakeLength = snakeBody.length;
      snakeX = snakeLength;
      snakeY = 1;
      snakeBody = [[snakeX, snakeY]];
      for (let i = 1; i < snakeLength; i++) snakeBody.push([snakeX - i, 1]);
      isTime = false;
      break;
    case "level continue":
      isMistake = false;
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
setLevel();
protocolExecutor();

document.addEventListener("keydown", changeDirection);
