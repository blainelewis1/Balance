//TODO: add sliders to adjust things


var ARM_LENGTH = 150;
var STAGE_WIDTH = 800;
var STAGE_HEIGHT = ARM_LENGTH * 2 + 100;
var GRAVITY = 0.001;

function drawScene(context) {
  context.lineWidth = 5;
  context.strokeStyle = "#AAAAAA";
  context.lineCap = "round";

  context.beginPath();
  context.moveTo(0, STAGE_HEIGHT);
  context.lineTo(STAGE_WIDTH, STAGE_HEIGHT);

  context.moveTo(0,STAGE_HEIGHT);
  context.lineTo(0, STAGE_HEIGHT - 20);

  context.moveTo(STAGE_WIDTH, STAGE_HEIGHT);
  context.lineTo(STAGE_WIDTH, STAGE_HEIGHT - 20);

  context.stroke();
}

//0 degrees is actually Math.PI/2 to make the physics easier.
function Pendulum(number_of_axis) {
  this.x = STAGE_WIDTH / 2;
  this.axis = [];
  this.y = STAGE_HEIGHT;
  this.speed = 0.5;
  this.height = 10;
  this.width = 40;

  for(var i = 0; i < number_of_axis; i++) {
    this.axis.push({theta : Math.PI / 2, thetaVelocity : 0, v : 0, l : ARM_LENGTH});
  }
}

Pendulum.prototype.draw = function(context) {
  context.lineWidth = 5;
  context.strokeStyle = "#444444";
  context.lineCap = "round";
  context.fillStyle = "#444444";

  context.beginPath();
  context.fillRect(this.x - this.width / 2, STAGE_HEIGHT - this.height, this.width, this.height);

  context.fillStyle = "#AAAAAA";

  context.beginPath();
  context.arc(this.x - (this.width / 4), this.y - (this.height / 2), (this.height / 2), 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.arc(this.x + (this.width / 4), this.y - (this.height / 2), (this.height / 2), 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.moveTo(this.x, this.y);

  var curX = this.x;
  var curY = STAGE_HEIGHT;

  for(var i = 0; i < this.axis.length; i++) {
    curX += Math.cos(this.axis[i].theta + 3 * Math.PI / 2) * ARM_LENGTH;
    curY -= Math.sin(this.axis[i].theta + 3 * Math.PI / 2 ) * ARM_LENGTH;

    // curX += Math.cos(this.axis[i].theta) * ARM_LENGTH;
    // curY -= Math.sin(this.axis[i].theta) * ARM_LENGTH;

    context.lineTo(curX, curY);
  }

  context.stroke();
};

Pendulum.prototype.move = function(deltaTime, leftKeyDown, rightKeyDown) {
  if(leftKeyDown && this.x > this.width - this.speed * deltaTime) {
    this.x -= this.speed * deltaTime;
    //TODO: this needs to be acceleration so not addition
    this.axis[0].thetaVelocity += 0.0001;
  }

  if(rightKeyDown && this.x < STAGE_WIDTH - this.width + this.speed * deltaTime) {
    this.x += this.speed * deltaTime;
    this.axis[0].thetaVelocity -= 0.0001;
  }
};

Pendulum.prototype.applyPhysics = function(deltaTime) {
  for(var i = 0; i < this.axis.length; i++) {
    var axis = this.axis[i];
    //This is the second derivative of theta, which is actually the "acceleration of theta"

    //We take axis.theta * time  and add that to thetaVelocity, then take thetaVelocity * time and add that to the displacement. BAMMM
    //axis.theta += -GRAVITY / ARM_LENGTH * Math.sin(axis.theta);

    axis.thetaVelocity += -GRAVITY / ARM_LENGTH * Math.sin(axis.theta) * deltaTime;
    axis.thetaVelocity *= 0.995;
    axis.theta += axis.thetaVelocity * deltaTime;



    //axis.theta = axis.theta % (Math.PI * 2);
  }
};

var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");

canvas.width = STAGE_WIDTH;
canvas.height = STAGE_HEIGHT * 2;

var pendulum = new Pendulum(1);

var previousTime;
var playing = true;
var leftKeyDown = false;
var rightKeyDown = false;

function step(t) {
  if(playing) {
    var deltaTime = previousTime === undefined ? 0 : t - previousTime;

    pendulum.move(deltaTime, leftKeyDown, rightKeyDown);
    pendulum.applyPhysics(deltaTime);
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  pendulum.draw(context);
  drawScene(context);

  previousTime = t;
  window.requestAnimationFrame(step);
}

function handleMoveKeys(e) {
  var val;

  if(e.type === "keydown") {
    val = true;
  } else if(e.type === "keyup"){
    val = false;
  } else {
    return;
  }

  if (e.keyCode === 65) {
    leftKeyDown = val;
  } else if (e.keyCode === 68) {
    rightKeyDown = val;
  }
}

document.addEventListener("keydown", handleMoveKeys);
document.addEventListener("keyup", handleMoveKeys);

document.addEventListener("keypress", function(e) {
  if(e.keyCode === 32) {
    playing = !playing;
    e.preventDefault();
  }
});

step();
