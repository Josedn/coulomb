var map = {
    cols: 10,
    rows: 10,
    tsize: 64
};

function writePosition(str) {
  document.getElementById('text-output').innerHTML = str;
}

function onNewCharge() {
  var q = document.getElementsByName("carga")[0];
  var qNumeric = parseFloat(q.value);
  Game.addHero(qNumeric, 160, 160);
}

function Camera(map, width, height) {
    this.x = 0;
    this.y = 0;
    this.width = width;
    this.height = height;
    this.maxX = map.cols * map.tsize - width;
    this.maxY = map.rows * map.tsize - height;
}

Camera.prototype.follow = function (sprite) {
    this.following = sprite;
    sprite.screenX = 0;
    sprite.screenY = 0;
};

Camera.prototype.update = function () {
  if (this.following == undefined)
  {
    return;
  }
    // assume followed sprite should be placed at the center of the screen
    // whenever possible
    this.following.screenX = this.width / 2;
    this.following.screenY = this.height / 2;

    // make the camera follow the sprite
    this.x = this.following.x - this.width / 2;
    this.y = this.following.y - this.height / 2;
    // clamp values
    this.x = Math.max(0, Math.min(this.x, this.maxX));
    this.y = Math.max(0, Math.min(this.y, this.maxY));

    // in map corners, the sprite cannot be placed in the center of the screen
    // and we have to change its screen coordinates

    // left and right sides
    if (this.following.x < this.width / 2 ||
        this.following.x > this.maxX + this.width / 2) {
        this.following.screenX = this.following.x - this.x;
    }
    // top and bottom sides
    if (this.following.y < this.height / 2 ||
        this.following.y > this.maxY + this.height / 2) {
        this.following.screenY = this.following.y - this.y;
    }
};

function Hero(map, x, y, q) {
    this.map = map;
    this.x = x;
    this.y = y;
    this.width = map.tsize;
    this.height = map.tsize;
    this.q = q;

    if (q >= 0) {
      this.image = Loader.getImage('positive');
    } else {
      this.image = Loader.getImage('negative');
    }
}

Hero.SPEED = 256; // pixels per second

Hero.prototype.move = function (delta, dirx, diry) {
    // move hero
    this.x += dirx * Hero.SPEED * delta;
    this.y += diry * Hero.SPEED * delta;

    // clamp values
    var maxX = this.map.cols * this.map.tsize;
    var maxY = this.map.rows * this.map.tsize;
    this.x = Math.max(0, Math.min(this.x, maxX));
    this.y = Math.max(0, Math.min(this.y, maxY));
};

Game.load = function () {
    return [
        Loader.loadImage('tiles', 'assets/tiles.png'),
        Loader.loadImage('negative', 'assets/electron.png'),
        Loader.loadImage('positive', 'assets/proton.png')
    ];
};

Game.init = function () {
    Keyboard.listenForEvents(
        [Keyboard.LEFT, Keyboard.RIGHT, Keyboard.UP, Keyboard.DOWN]);
    this.tileAtlas = Loader.getImage('tiles');

    this.heroes = [];
    this.camera = new Camera(map, 512, 512);

    this.addHero(1, 160, 160);
    this.addHero(1, 160 + 256, 160);
};

Game.addHero = function(q, x, y) {
  this.heroes.push(new Hero(map, x, y, q));
  this.camera.follow(this.heroes[this.heroes.length - 1]);
};

Game.update = function (delta) {
    // handle hero movement with arrow keys
    var dirx = 0;
    var diry = 0;
    if (Keyboard.isDown(Keyboard.LEFT)) { dirx = -1; }
    else if (Keyboard.isDown(Keyboard.RIGHT)) { dirx = 1; }
    else if (Keyboard.isDown(Keyboard.UP)) { diry = -1; }
    else if (Keyboard.isDown(Keyboard.DOWN)) { diry = 1; }
    if (this.heroes[this.heroes.length - 1] != undefined)
    {
      this.heroes[this.heroes.length - 1].move(delta, dirx, diry);
    }
    this.camera.update();
};

Game._drawGrid = function () {
    var width = map.cols * map.tsize;
    var height = map.rows * map.tsize;
    var x, y;
    for (var r = 0; r < map.rows; r++) {
        x = - this.camera.x;
        y = r * map.tsize - this.camera.y;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(width, y);
        this.ctx.stroke();
    }
    for (var c = 0; c < map.cols; c++) {
        x = c * map.tsize - this.camera.x;
        y = - this.camera.y;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, height);
        this.ctx.stroke();
    }
};

Game._drawNegativeFieldLine = function(startX, startY, endX, endY, curvature) {
  var ctrl1X = startX;
  var ctrl1Y = startY - curvature;

  var ctrl2X =  endX;
  var ctrl2Y = endY - curvature;

  this.ctx.beginPath();
  this.ctx.moveTo(startX, startY);
  this.ctx.bezierCurveTo(ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY);
  this.ctx.stroke();

  var ctrl1X = startX;
  var ctrl1Y = startY + curvature;

  var ctrl2X =  endX;
  var ctrl2Y = endY + curvature;

  this.ctx.beginPath();
  this.ctx.moveTo(startX, startY);
  this.ctx.bezierCurveTo(ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY);
  this.ctx.stroke();
}

Game._drawLines = function () {
  var drawn = {};
  //for (var i = 0; i < this.heroes.length; i++) {
  for (var i = 0; i < 1; i++) {
    var currentHero = this.heroes[i];

    var otherHero = this.heroes[i + 1];
    var startX = currentHero.x - this.camera.x;
    var startY = currentHero.y - this.camera.y;

    var endX = otherHero.x - this.camera.x;
    var endY = otherHero.y - this.camera.y;

    this._drawNegativeFieldLine(startX, startY, endX, endY, 0);
    this._drawNegativeFieldLine(startX, startY, endX, endY, 32);
    this._drawNegativeFieldLine(startX, startY, endX, endY, 64);
    this._drawNegativeFieldLine(startX, startY, endX, endY, 128);

  }
}

Game.render = function () {
    var positions = "";

    this._drawLines();

    for (var i = 0; i < this.heroes.length; i++) {
      if (this.camera.following == this.heroes[i]) {
        this.ctx.drawImage(
            this.heroes[i].image,
            this.heroes[i].screenX - this.heroes[i].width / 2,
            this.heroes[i].screenY - this.heroes[i].height / 2);
      } else {
        this.ctx.drawImage(
            this.heroes[i].image,
            this.heroes[i].x - this.camera.x - this.heroes[i].width / 2,
            this.heroes[i].y - this.camera.y - this.heroes[i].height / 2);
      }
      positions += "X: " + this.heroes[i].x.toFixed(3) + ", Y: " + this.heroes[i].y.toFixed(3)
      +", Q: "+this.heroes[i].q.toFixed(3) +"<br>";
    }

    writePosition(positions);

    this._drawGrid();
};
