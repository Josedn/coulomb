var map = {
    cols: 20,
    rows: 20,
    tsize: 32
};

function writePosition(str) {
  document.getElementById('text-output').innerHTML = str;
}

function writeField(str) {
  document.getElementById('text-output-field').innerHTML = str;
}

function onNewCharge() {
  var q = document.getElementsByName("carga")[0];
  var qNumeric = parseFloat(q.value);
  Game.addHero(qNumeric, 160, 160);
}

function onEditCharge() {
  var q = document.getElementsByName("cargaEdit")[0];
  var qNumeric = parseFloat(q.value);
  Game.selectedHero.q = qNumeric;
}

function setEditCharge(value) {
  var q = document.getElementsByName("cargaEdit")[0];
  q.value = value;
}

function Camera(map, width, height) {
    this.x = 0;
    this.y = 0;
    this.width = width;
    this.height = height;
    this.maxX = map.cols * map.tsize - width;
    this.maxY = map.rows * map.tsize - height;
}

Camera.SPEED = 256; // pixels per second

Camera.prototype.move = function (delta, dirx, diry) {
    // move camera
    this.x += dirx * Camera.SPEED * delta;
    this.y += diry * Camera.SPEED * delta;
    // clamp values
    this.x = Math.max(0, Math.min(this.x, this.maxX));
    this.y = Math.max(0, Math.min(this.y, this.maxY));
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

Game._distance = function(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

Game._normalize = function(x, y) {
  var dist = this._distance(x, y, 0, 0);
  return {x: (x / dist), y: (y / dist)};
}

Game._drawArrow = function(fromx, fromy, tox, toy) {
  //variables to be used when creating the arrow
  var ctx = this.ctx;
  var headlen = 5;

  var angle = Math.atan2(toy-fromy,tox-fromx);

  //starting path of the arrow from the start square to the end square and drawing the stroke
  ctx.beginPath();
  ctx.moveTo(fromx, fromy);
  ctx.lineTo(tox, toy);
  //ctx.strokeStyle = "#cc0000";
  //ctx.lineWidth = 22;
  ctx.stroke();

  //starting a new path from the head of the arrow to one of the sides of the point
  ctx.beginPath();
  ctx.moveTo(tox, toy);
  ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/7),toy-headlen*Math.sin(angle-Math.PI/7));

  //path from the side point of the arrow, to the other side point
  ctx.lineTo(tox-headlen*Math.cos(angle+Math.PI/7),toy-headlen*Math.sin(angle+Math.PI/7));

  //path from the side point back to the tip of the arrow, and then again to the opposite side point
  ctx.lineTo(tox, toy);
  ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/7),toy-headlen*Math.sin(angle-Math.PI/7));

  //draws the paths created above
  //ctx.strokeStyle = "#cc0000";
  //ctx.lineWidth = 22;
  ctx.stroke();
  //ctx.fillStyle = "#cc0000";
  ctx.fill();
}

Game._resetStyle = function() {

}

Game._getFieldFor = function(x, y) {
  var ke = 9 * Math.pow(10, 9)
  var totalX = 0;
  var totalY = 0;
  for (var i = 0; i < this.heroes.length; i++) {
    var currentHero = this.heroes[i];
    var directionX = x- currentHero.x;
    var directionY = y- currentHero.y;

    var normalizedDirection = this._normalize(directionX, directionY);
    var field = ke * (currentHero.q /
                   Math.pow(this._distance(x, y, currentHero.x, currentHero.y), 3));
    totalX +=(field * normalizedDirection.x);
    totalY +=(field * normalizedDirection.y);
  }
  return {x: totalX, y: totalY, normalized: this._normalize(totalX, totalY)};
}

Game._getForceFor = function(pos){
  var ke = 9 * Math.pow(10, 9)
  var currentHero = this.heroes[pos]
  var totalX = 0;
  var totalY = 0;
  for (var i = 0; i < this.heroes.length; i++) {
    if(i != pos) {
      var currentHeroFrom = this.heroes[i];
      var directionX = currentHero.x - currentHeroFrom.x;
      var directionY = currentHero.y - currentHeroFrom.y;

      var normalizedDirection = this._normalize(directionX, directionY);
      var field = ke * Math.abs((currentHeroFrom.q * currentHero.q) /
                     Math.pow(this._distance(currentHero.x, currentHero.y, currentHeroFrom.x, currentHeroFrom.y), 3));
      totalX +=(field * normalizedDirection.x);
      totalY +=(field * normalizedDirection.y);
    }
  }
  return {x: totalX, y: totalY, normalized: this._normalize(totalX, totalY)};

}


Game.onMouseMove = function (x, y, isDrag) {
  if (Game.camera == undefined)
  {
    return;
  }
  x = Math.floor(x);
  y = Math.floor(y);
  var field = this._getFieldFor((this.camera.x + x), (this.camera.y + y));
  writeField("Valor del campo en (" + (this.camera.x + x) + ", " + (this.camera.y + y) +  "): (" + field.x.toFixed(4) + "i + " + field.y.toFixed(4) + "j) N / C");
  if (isDrag)
  {
    this.onMouseClick(x, y);
    if (this.selectedHero == null) {
      var diffX = x - this.selectedScreenX;
      var diffY = y - this.selectedScreenY;
      this.camera.x -= diffX;
      this.camera.y -= diffY;
    } else {
      var diffX = this.selectedScreenX - x;
      var diffY = this.selectedScreenY - y;
      this.selectedHero.x -= diffX;
      this.selectedHero.y -= diffY;
    }
  }
  this.selectedScreenX = x;
  this.selectedScreenY = y;
};

Game.onMouseClick = function (x, y) {
  //console.log("Click!: " + x + ", " + y);
  var hero =  this._getHeroFor(x, y);
  if (hero != null) {
    this.selectedHero = hero;
    setEditCharge(hero.q);
  } else {
    this.selectedHero = null;
    setEditCharge("");
  }
};

Game._getHeroFor = function(x, y) {
  x = this.camera.x + x;
  y = this.camera.y + y;

  var radius = 32;
  for (var i = 0; i < this.heroes.length; i++) {
    var currentHero = this.heroes[i];
    if (x > this.heroes[i].x - radius && x < this.heroes[i].x + radius && y > this.heroes[i].y - radius && y < this.heroes[i].y + radius) {
      return currentHero;
    }
  }
  return null;
};

Game.init = function () {
    Keyboard.listenForEvents(
        [Keyboard.LEFT, Keyboard.RIGHT, Keyboard.UP, Keyboard.DOWN]);
    this.tileAtlas = Loader.getImage('tiles');

    this.heroes = [];
    this.camera = new Camera(map, 512, 512);

    //this.addHero(-0.001, 160, 160);
    //this.addHero(0.001, 160 + 256, 160);
    //this.selectedHero = this.heroes[1];

    this.selectedScreenX = 0;
    this.selectedScreenY = 0;

    this.positiveImage = Loader.getImage('positive');
    this.negativeImage = Loader.getImage('negative');
};

Game.addHero = function(q, x, y) {
  this.heroes.push(new Hero(map, x, y, q));
};

Game.update = function (delta) {
    // handle hero movement with arrow keys
    var dirx = 0;
    var diry = 0;
    if (Keyboard.isDown(Keyboard.LEFT)) { dirx = -1; }
    else if (Keyboard.isDown(Keyboard.RIGHT)) { dirx = 1; }
    else if (Keyboard.isDown(Keyboard.UP)) { diry = -1; }
    else if (Keyboard.isDown(Keyboard.DOWN)) { diry = 1; }

    this.camera.move(delta, dirx, diry);
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

Game._drawVectors=function(){
  var ARROW_MAX_LENGTH = 26;
  this.ctx.fillStyle = "black";
  var x, y;
  for (var i = 0; i < map.rows; i++){
    for(var j = 0; j < map.cols; j++){
      x = (i * map.tsize);
      y = (j * map.tsize);
      var fieldVector = this._getFieldFor(x, y);
      x = x - this.camera.x;
      y = y - this.camera.y;
      this._drawArrow(x, y, x + ARROW_MAX_LENGTH*fieldVector.normalized.x, y + ARROW_MAX_LENGTH*fieldVector.normalized.y);
    }
  }

  x = (this.selectedScreenX + this.camera.x);
  y = (this.selectedScreenY + this.camera.y);
  var fieldVector = this._getFieldFor(x, y);
  x = x - this.camera.x;
  y = y - this.camera.y;
  this._drawArrow(x, y, x + ARROW_MAX_LENGTH*fieldVector.normalized.x, y + ARROW_MAX_LENGTH*fieldVector.normalized.y);

}

Game._drawHeroes = function() {
  var positions = "";

  for (var i = 0; i < this.heroes.length; i++) {
    if (this.heroes[i].q > 0) {
      this.ctx.drawImage(
          this.positiveImage,
          this.heroes[i].x - this.camera.x - this.heroes[i].width / 2,
          this.heroes[i].y - this.camera.y - this.heroes[i].height / 2);
    } else {
      this.ctx.drawImage(
          this.negativeImage,
          this.heroes[i].x - this.camera.x - this.heroes[i].width / 2,
          this.heroes[i].y - this.camera.y - this.heroes[i].height / 2);
    }
    this.ctx.font = "bold 15px Ubuntu"
    this.ctx.textBaseline = "middle";
    this.ctx.fillStyle = "white";
    this.ctx.fillText(this.heroes[i].q, this.heroes[i].x - this.camera.x, this.heroes[i].y - this.camera.y + this.heroes[i].height / 2);
    force = this._getForceFor(i);
    positions += "X: " + this.heroes[i].x.toFixed(3) + ", Y: " + this.heroes[i].y.toFixed(3)
    +", Q: "+this.heroes[i].q.toFixed(6)+ ", valor de la fuerza: (" + force.x.toFixed(4) + "i + " + force.y.toFixed(4) + "j) N <br>";
  }

  writePosition(positions);
}

Game.render = function () {
  this._drawVectors();
  this._drawHeroes();
  this._drawGrid();
};
