const canvas = document.getElementById("game"); // получаем canvas по id
const gameMenu = document.getElementById("menu"); // получаем меню по id
const playButton = document.getElementById("play-button"); // получаем кнопку старта по id
const loadingScreen = document.getElementById("loading-h1"); // загрузочный экран
let statusOfLoad = false; //статус загрузки содержимого игры

class SnakeGame {
  //Класс нашей игры
  constructor(canvas, gridSize) {
    this.canvas = canvas;
    this.gridSize = gridSize; //размер поля
    this.snake = {
      // Массив с блоками змейки
      cells: [
        { x: 8, y: 8 },
        { x: 7, y: 8 },
        { x: 6, y: 8 },
        { x: 5, y: 8 },
      ],
      direction: "right",
    };
    this.apple = { x: 10, y: 10 };
    this.appleImage = document.getElementById("appleTexture"); // добавляем текстуру яблоку
    this.snakeHeadImage = document.getElementById("snakeHead"); // текстура головы змеи
    this.snakeBodyImage = document.getElementById("snakeBody"); // текстура тела змеи
    this.snakeTurnLeftImage = document.getElementById("snakeTurnLeft"); // текстура хвоста змеи left
    this.snakeTurnRightImage = document.getElementById("snakeTurnRight"); // текстура хвоста змеи
    this.snakeTileImage = document.getElementById("snakeTile"); // текстура поворота змеи
    //логика передвижения для мобилы
    this.touchY = "";
    this.touchX = "";
    this.touchTreshold = 50;

    //звуки
    this.soundSnakeEat1 = document.getElementById("snakeEat1");
    this.soundSnakeEat1.playbackRate = 1.5;
    this.soundSnakeEat2 = document.getElementById("snakeEat2");

    this.soundSnakeDeath1 = document.getElementById("snakeDeath1");
    this.soundSnakeDeath1.playbackRate = 0.5;

    this.soundMelody1 = document.getElementById("melody1");
    this.soundMelody1.volume = 0.5;
    this.soundMelody1.loop = true;
    //статы
    this.score = 0;
    this.gameOver = false; //статус игры
    this.speed = 180; //скорость змейки
  }

  init() {
    this.soundMelody1.play();
    //подключаем сервис обработки нажатий
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    // подключаем мобильное управление
    document.addEventListener("touchstart", this.handleTouchStart.bind(this));
    document.addEventListener("touchmove", this.handleTouchMove.bind(this));

    //подключаем старт игры к кнопке старт в меню
    document
      .getElementById("play-button")
      .addEventListener("click", this.startGame.bind(this));
    this.loop(); // запускаем метод отрисовки игры
  }

  startGame() {
    this.snake = {
      cells: [
        { x: 8, y: 8 },
        { x: 7, y: 8 },
        { x: 6, y: 8 },
        { x: 5, y: 8 },
      ],
      direction: "right",
    };
    this.apple = this.generateNewApple(); // начальная координата яблока
    this.score = 0; //начальный счёт
    this.gameOver = false; // начальное значение - игра идет
  }

  loop() {
    const context = this.canvas.getContext("2d"); // получаем доступ к контенту canvas
    const grid = this.canvas.width / this.gridSize; //устанавливаем соотношение сетки

    if (this.gameOver) {
      // при проигрыше

      this.soundSnakeDeath1.play();
      this.soundMelody1.currentTime = 0;
      this.soundMelody1.pause();
      document.getElementById("bodyGame").style.cursor = "auto"; //скрываем курсор при игре

      context.clearRect(0, 0, this.canvas.width, this.canvas.height); // очищаем canvas
      document.getElementById("nameMenu").textContent = "Вы проиграли!"; //сообщение о проигрыше
      document.getElementById("score").textContent = "Ваш счёт:" + this.score;
      document.getElementById("score").style.display = "block"; // показываем счёт
      document.getElementById("play-button").textContent = "Играть снова"; //меняем текст кнопки
      document.getElementById("menu").style.display = "block"; //вновь показываем меню
      return; // обрываем отрисовку змейки
    }

    this.updateSnake(); // обновляем позицию змейки
    this.checkCollisions(); // проверяем не столкнулась ли змейка с препятствием

    context.clearRect(0, 0, this.canvas.width, this.canvas.height); // очищаем старые кадры
    this.drawApple(context, grid); // отрисовываем яблоко
    this.drawSnake(context, grid); // отрисовываем змейку
    this.drawScore(context); // отрисовываем счет

    setTimeout(() => {
      //устанавливаем скорость игры которая зависит от SnakeGame.speed
      window.requestAnimationFrame(this.loop.bind(this));
    }, this.speed);
  }

  updateSnake() {
    // метод обновления позициии змейки
    //принимаем части тела змейки и выделяем голову
    const head = { ...this.snake.cells[0] };

    switch (this.snake.direction) {
      case "up": // если игрок нажал вверх
        head.y--; //меняем позицию змейки
        break; //прекращаем метод
      case "down": // если игрок нажал вниз
        head.y++; //меняем позицию змейки
        break;
      case "left": // если игрок нажал влево
        head.x--; //меняем позицию змейки
        break;
      case "right": // если игрок нажал вправо
        head.x++; //меняем позицию змейки
        break;
    }

    this.snake.cells.unshift(head);

    if (head.x === this.apple.x && head.y === this.apple.y) {
      this.score += 10;
      if (this.score % 40 === 0) {
        this.speed -= 10; // ускоряем игру после каждых съеденных 4-х яблок
      }
      this.generateNewApple(); // генерируем новое яблоко
      const random = Math.random();
      if (random > 0.5) this.soundSnakeEat1.play();
      else if (random < 0.5) this.soundSnakeEat2.play();
    } else {
      this.snake.cells.pop();
    }
  }

  checkCollisions() {
    // коллизия
    // получаем голову змеи
    const head = this.snake.cells[0];

    if (
      //проверка не сталкивается ли змейка с концом игровой области
      head.x < 0 ||
      head.x >= this.gridSize ||
      head.y < 0 ||
      head.y >= this.gridSize
    ) {
      this.gameOver = true; //если сталкивается, то игра проиграна
    }

    for (let i = 1; i < this.snake.cells.length; i++) {
      //проверка - сталкивается ли змейка со своими же частями
      if (
        head.x === this.snake.cells[i].x &&
        head.y === this.snake.cells[i].y
      ) {
        this.gameOver = true; //если да, - то игра проиграна
        break; // остановка цикла for
      }
    }
  }

  generateNewApple() {
    // создание нового яблока
    const newApple = {
      // задаем структуру нового яблока
      x: Math.floor(Math.random() * this.gridSize),
      y: Math.floor(Math.random() * this.gridSize),
    };

    for (let i = 0; i < this.snake.cells.length; i++) {
      // проверяем сьела ли змейка яблоко
      if (
        newApple.x === this.snake.cells[i].x &&
        newApple.y === this.snake.cells[i].y
      ) {
        return this.generateNewApple(); //если сьела то создаем новое
      }
    }

    this.apple = newApple; // обновляем зависимости
  }

  drawSnake(context, grid) {
    // Проходим по каждой клетке змейки
    for (let i = 0; i < this.snake.cells.length; i++) {
      // Сохраняем текущее состояние контекста
      context.save();

      // Перемещаем координату отсчета в центр текущей клетки
      context.translate(
        this.snake.cells[i].x * grid + grid / 2,
        this.snake.cells[i].y * grid + grid / 2
      );

      // Вычисляем угол поворота для текущей части змейки
      let rotation = 0;
      if (i === 0) {
        // Это голова змейки, поворот зависит от ее направления
        switch (this.snake.direction) {
          case "up":
            rotation = 0;
            break;
          case "down":
            rotation = Math.PI;
            break;
          case "left":
            rotation = (3 * Math.PI) / 2;
            break;
          case "right":
            rotation = Math.PI / 2;
            break;
        }
      } else {
        // Это тело или хвост змейки, поворот зависит от положения предыдущей и текущей клетки
        const prevCell = this.snake.cells[i - 1];
        const currCell = this.snake.cells[i];
        const nextCell = this.snake.cells[i - 1];
        if (prevCell.x < currCell.x) {
          rotation = (3 * Math.PI) / 2;
        } else if (prevCell.x < currCell.x) {
          rotation = 0;
        } else if (prevCell.x > currCell.x) {
          rotation = Math.PI / 2;
        } else if (prevCell.y < currCell.y) {
          rotation = 0;
        } else if (prevCell.y > currCell.y) {
          rotation = Math.PI;
        }
      }

      // Поворачиваем контекст на вычисленный угол
      context.rotate(rotation);

      // Рисуем текущую часть змейки
      if (i === 0) {
        // Это голова змейки, рисуем изображение головы
        context.drawImage(
          this.snakeHeadImage,
          -grid / 2,
          -grid / 2,
          grid,
          grid
        );
      } else if (i > 0 && i !== this.snake.cells.length - 1) {
        let _snakeBodyNew; // место хранения текстуры для отрисовки
        const nextCell = this.snake.cells[i + 1]; // следующий блок который будет отрисован
        const prevCell = this.snake.cells[i - 1]; // предыдущий отрисованный блок
        const currCell = this.snake.cells[i]; // текущий отрисовывающийся блок

        if (prevCell.x < currCell.x || prevCell.x > currCell.x) {
          // поворот по диагонали x
          // движение вниз
          if (
            nextCell.x === currCell.x &&
            prevCell.y > nextCell.y &&
            prevCell.x < nextCell.x
          )
            _snakeBodyNew = this.snakeTurnRightImage; //поворот влево
          else if (
            nextCell.x === currCell.x &&
            prevCell.y > nextCell.y &&
            prevCell.x > nextCell.x
          )
            _snakeBodyNew = this.snakeTurnLeftImage; //поворот вправо
          // движение вверх
          else if (
            nextCell.x === currCell.x &&
            prevCell.y < nextCell.y &&
            prevCell.x < nextCell.x
          )
            _snakeBodyNew = this.snakeTurnLeftImage; // поворот  влево
          else if (
            nextCell.x === currCell.x &&
            prevCell.y < nextCell.y &&
            prevCell.x > nextCell.x
          )
            _snakeBodyNew = this.snakeTurnRightImage; // поворот вправо
          else _snakeBodyNew = this.snakeBodyImage;
        } else {
          // Этот блок тела не поворачивается, используем стандартную текстуру
          _snakeBodyNew = this.snakeBodyImage;
        }

        if (
          prevCell.y < currCell.y ||
          prevCell.y > currCell.y ||
          prevCell.x < currCell.x ||
          prevCell.x > currCell.x
        ) {
          // поворот по диагонали y
          // движение вправо
          if (
            nextCell.y === currCell.y &&
            prevCell.x > nextCell.x &&
            prevCell.y < nextCell.y
          )
            _snakeBodyNew = this.snakeTurnLeftImage; //поворот вверх
          else if (
            nextCell.y === currCell.y &&
            prevCell.x > nextCell.x &&
            prevCell.y > nextCell.y
          )
            _snakeBodyNew = this.snakeTurnRightImage; //поворот вниз
          // движение влево
          else if (
            nextCell.y === currCell.y &&
            prevCell.x < nextCell.x &&
            prevCell.y < nextCell.y
          )
            _snakeBodyNew = this.snakeTurnRightImage; // поворот  вверх
          else if (
            nextCell.y === currCell.y &&
            prevCell.x < nextCell.x &&
            prevCell.y > nextCell.y
          )
            _snakeBodyNew = this.snakeTurnLeftImage; // поворот вниз
        } else {
          // Этот блок тела не поворачивается, используем стандартную текстуру
          _snakeBodyNew = this.snakeBodyImage;
        }

        context.drawImage(_snakeBodyNew, -grid / 2, -grid / 2, grid, grid);
      } else if (i === this.snake.cells.length - 1) {
        // Это хвост змейки, рисуем изображение хвоста
        context.drawImage(
          this.snakeTileImage, // Здесь должно быть изображение хвоста змейки
          -grid / 2,
          -grid / 2,
          grid,
          grid
        );
      }

      // Восстанавливаем состояние контекста
      context.restore();
    }
  }

  drawApple(context, grid) {
    // отрисовка яблока
    context.drawImage(
      this.appleImage,
      this.apple.x * grid,
      this.apple.y * grid,
      grid,
      grid
    );
  }

  drawScore(context) {
    // отрисовка счета
    context.fillStyle = "black";
    context.font = "20px Source Code Pro, monospace";
    context.fillText(`Текущий счет: ${this.score}`, 10, 25);
  }

  handleKeyDown(event) {
    // обработка нажатий
    switch (event.key) {
      case "ArrowUp": // нажатие вверх
        if (
          this.snake.direction !== "down" &&
          this.snake.cells[0].y === this.snake.cells[1].y
        ) {
          this.snake.direction = "up";
        }
        break;
      case "ArrowDown": // нажатие вниз
        if (
          this.snake.direction !== "up" &&
          this.snake.cells[0].y === this.snake.cells[1].y
        ) {
          this.snake.direction = "down";
        }
        break;
      case "ArrowLeft": // нажатие влево
        if (
          this.snake.direction !== "right" &&
          this.snake.cells[0].x === this.snake.cells[1].x
        ) {
          this.snake.direction = "left";
        }
        break;
      case "ArrowRight": // нажатие вправо
        if (
          this.snake.direction !== "left" &&
          this.snake.cells[0].x === this.snake.cells[1].x
        ) {
          this.snake.direction = "right";
        }
        break;
    }
  }

  handleTouchStart(event) {
    // Запоминаем начальную точку касания
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  handleTouchMove(event) {
    // Определяем направление движения
    const deltaX = event.touches[0].clientX - this.touchStartX;
    const deltaY = event.touches[0].clientY - this.touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Движение по горизонтали
      if (deltaX > 0) {
        // Движение вправо
        if (
          this.snake.direction !== "left" &&
          this.snake.cells[0].x === this.snake.cells[1].x
        ) {
          this.snake.direction = "right";
        }
      } else {
        // Движение влево
        if (
          this.snake.direction !== "right" &&
          this.snake.cells[0].x === this.snake.cells[1].x
        ) {
          this.snake.direction = "left";
        }
      }
    } else {
      // Движение по вертикали
      if (deltaY > 0) {
        // Движение вниз
        if (
          this.snake.direction !== "up" &&
          this.snake.cells[0].y === this.snake.cells[1].y
        ) {
          this.snake.direction = "down";
        }
      } else {
        // Движение вверх
        if (
          this.snake.direction !== "down" &&
          this.snake.cells[0].y === this.snake.cells[1].y
        ) {
          this.snake.direction = "up";
        }
      }
    }
  }
}


setInterval(() => { //во время загрузки
  if (statusOfLoad === true) return;
  if(loadingScreen.textContent.length === 11) loadingScreen.textContent = "Загрузка..";
  else if (loadingScreen.textContent.length === 10) loadingScreen.textContent = "Загрузка.";
  else if(loadingScreen.textContent.length === 9) loadingScreen.textContent = "Загрузка...";
}, 350)

window.onload = () => { // после загрузки
statusOfLoad = true;
loadingScreen.style.display = "none";
canvas.style.display = "flex";
gameMenu.style.display = "block";

playButton.addEventListener("click", () => {
  //при нажатии кнопки старта меню будет скрыто
  gameMenu.style.display = "none"; //скрываем меню
  const game = new SnakeGame(canvas, 16); // создаем новый обьект игры
  document.getElementById("bodyGame").style.cursor = "none"; //скрываем курсор при игре
  game.init();
});
}
