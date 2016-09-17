(function() {
    var config = {};
    //TODO: inverted flag to make scales flip, then friction increases to the right for example.
    //TODO: combine with schools controls
    //TODO: I could do config.add_configurable(obj, prop, min, max, scale, default); update_value then uses an id or something.

    config.arm_length = {
        value: 150,
        min: 1,
        max: 500,
        scale: 1
    };
    config.gravity = {
        value: 0.001,
        min: 0.0001,
        max: 0.01,
        scale: 10000
    };
    config.friction = {
        value: 0.995,
        min: 0.9,
        max: 0.999,
        scale: 100
    };
    config.cart_speed = {
        value: 0.5,
        min: 0.1,
        max: 1,
        scale: 10
    };

    var control_box = document.createElement("div");
    control_box.classList.add("controls");
    for (var prop in config) {
        if (config.hasOwnProperty(prop)) {
            var elem = document.createElement("input");
            elem.type = "range";
            elem.id = prop;
            elem.value = config[prop].value * config[prop].scale;
            elem.min = config[prop].min * config[prop].scale;
            elem.max = config[prop].max * config[prop].scale;
            elem.step = (config[prop].max - config[prop].min) / 20 * config[prop].scale;
            elem.addEventListener("input", update_value);

            var label = document.createElement("label");
            label.innerHTML = prop;

            control_box.appendChild(label);
            control_box.appendChild(elem);
        }
    }

    //document.body.appendChild(control_box);

    function update_value(e) {
        config[e.target.id].value = e.target.value / config[e.target.id].scale;
    }


    var EDGE_OFFSET = 10;

    function draw_scene(context, canvas, score, max_score) {
        context.lineWidth = 5;
        context.strokeStyle = "#666666";
        context.lineCap = "round";


        context.beginPath();
        context.moveTo(EDGE_OFFSET, canvas.height / 2);
        context.lineTo(canvas.width - EDGE_OFFSET, canvas.height / 2);

        context.moveTo(EDGE_OFFSET, canvas.height / 2);
        context.lineTo(EDGE_OFFSET, (canvas.height / 2) - 20);

        context.moveTo(canvas.width - EDGE_OFFSET, canvas.height / 2);
        context.lineTo(canvas.width - EDGE_OFFSET, (canvas.height / 2) - 20);

        context.stroke();
        context.font = "30px Arial";
        context.textBaseline = "bottom";
        context.textAlign = "left";
        context.fillText(score.toFixed(0), 10, canvas.height - 10);
        context.textAlign = "right";
        context.fillText(max_score.toFixed(0), canvas.width - 10, canvas.height - 10);
    }

    //0 degrees is actually Math.PI/2 to make the physics easier.
    function Pendulum(number_of_axis) {

        this.axis = [];

        this.height = 10;
        this.width = 40;

        this.x = canvas.width / 2;
        this.y = canvas.height / 2 - this.height / 2;

        for (var i = 0; i < number_of_axis; i++) {
            this.axis.push({
                theta: Math.PI / 2,
                thetaVelocity: 0,
                v: 0,
                l: config.arm_length.value
            });
        }
    }

    Pendulum.prototype.resize = function() {
        this.y = canvas.height / 2 - this.height / 2;
    };

    Pendulum.prototype.draw = function(context) {
        // Body

        context.lineWidth = 5;
        context.strokeStyle = "#666666";
        context.lineCap = "round";
        context.fillStyle = "#666666";

        context.beginPath();
        context.fillRect(this.x - this.width / 2, this.y - this.height, this.width, this.height);

        // Wheels

        context.fillStyle = "#E8E830";

        context.beginPath();
        context.arc(this.x - (this.width / 4), this.y - (this.height / 4), (this.height / 2), 0, Math.PI * 2);
        context.fill();

        context.beginPath();
        context.arc(this.x + (this.width / 4), this.y - (this.height / 4), (this.height / 2), 0, Math.PI * 2);
        context.fill();

        //Arms
        context.strokeStyle = "#E8E830";

        context.beginPath();
        context.moveTo(this.x, this.y - this.height / 2);

        var curX = this.x;
        var curY = this.y;

        for (var i = 0; i < this.axis.length; i++) {
            curX += Math.cos(this.axis[i].theta + 3 * Math.PI / 2) * config.arm_length.value;
            curY -= Math.sin(this.axis[i].theta + 3 * Math.PI / 2) * config.arm_length.value;

            // curX += Math.cos(this.axis[i].theta) * config.arm_length.value;
            // curY -= Math.sin(this.axis[i].theta) * config.arm_length.value;

            context.lineTo(curX, curY);
        }

        context.stroke();
    };

    Pendulum.prototype.is_above = function() {
        return this.axis[0].theta >= Math.PI / 2 && this.axis[0].theta <= 3 * Math.PI / 2;
    };

    Pendulum.prototype.move = function(deltaTime, direction, canvas) {
        var move_amount = config.cart_speed.value * deltaTime * direction;

        if (direction === -1 && this.x + move_amount - (this.width / 2) > EDGE_OFFSET) {
            this.x += move_amount;
            //TODO: this needs to be acceleration so not addition
            this.axis[0].thetaVelocity -= move_amount / 100000;
        }

        if (direction === 1 && this.x + move_amount + (this.width / 2) < canvas.width - EDGE_OFFSET) {
            this.x += move_amount;
            this.axis[0].thetaVelocity -= move_amount / 100000;
        }
    };

    Pendulum.prototype.applyPhysics = function(delta_time) {
        for (var i = 0; i < this.axis.length; i++) {
            var axis = this.axis[i];
            //This is the second derivative of theta, which is actually the "acceleration of theta"

            //We take axis.theta * time  and add that to thetaVelocity, then take thetaVelocity * time and add that to the displacement. BAMMM
            //axis.theta += -GRAVITY / config.arm_length.value * Math.sin(axis.theta);

            axis.thetaVelocity += -config.gravity.value / config.arm_length.value * Math.sin(axis.theta) * delta_time;
            axis.thetaVelocity *= config.friction.value;
            axis.theta += axis.thetaVelocity * delta_time;

            axis.theta = mod(axis.theta, Math.PI * 2);
        }
    };

    function mod(n, m) {
        return ((n % m) + m) % m;
    }

    var canvas = document.getElementsByTagName("canvas")[0];
    var context = canvas.getContext("2d");

    window.addEventListener("resize", resize);

    var pendulum = new Pendulum(1);

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        pendulum.resize();
    }

    resize();

    var previous_time;
    var left_key_down = false;
    var right_key_down = false;
    var was_hidden = false;
    var score = 0;
    var max_score = 0;

    function step(t) {
        var delta_time = previous_time === undefined ? 0 : t - previous_time;

        if (was_hidden) {
            delta_time = 0;
            was_hidden = false;
        }

        var direction = 0;
        direction += left_key_down ? -1 : 0;
        direction += right_key_down ? 1 : 0;

        if (direction) {
            pendulum.move(delta_time, direction, canvas);
        }

        pendulum.applyPhysics(delta_time);

        if (pendulum.is_above()) {
            score += delta_time;
        }

        max_score = Math.max(score, max_score);

        if (!pendulum.is_above()) {
            score = 0;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        draw_scene(context, canvas, score, max_score);
        pendulum.draw(context);

        previous_time = t;
        window.requestAnimationFrame(step);
    }

    //TODO: I could instead use keys[e.keyCode] = val. and then use the keys to get the value
    function handle_move_keys(e) {
        var val = e.type === "keydown";

        if (e.keyCode === 65) {
            left_key_down = val;
        } else if (e.keyCode === 68) {
            right_key_down = val;
        }
    }

    document.addEventListener("keydown", handle_move_keys);
    document.addEventListener("keyup", handle_move_keys);

    document.addEventListener("visibilitychange", function() {
        if (document.hidden) {
            was_hidden = true;
        }
    });


    var touch;

    function touchStart(e) {
        if (!touch) {
            touch = e.changedTouches[0];
            right_key_down = false;
            left_key_down = false;
            if (touch.screenX > window.innerWidth / 2) {
                right_key_down = true;
            } else {
                left_key_down = true;
            }
        }

        e.preventDefault();
    }

    function touchMove(e) {
        if (!touch) {
            return;
        }

        for (var i = 0; i < e.changedTouches.length; i++) {
            var changedTouch = e.changedTouches[i];

            if (changedTouch.id === touch.id) {
                touch = changedTouch;
                right_key_down = false;
                left_key_down = false;
                if (touch.screenX > window.innerWidth / 2) {
                    right_key_down = true;
                } else {
                    left_key_down = true;
                }
            }
        }

        e.preventDefault();
    }

    function touchEnd(e) {
        if (!touch) {
            return;
        }

        for (var i = 0; i < e.changedTouches.length; i++) {
            var changedTouch = e.changedTouches[i];
            if (changedTouch.id === touch.id) {
                touch = undefined;
                left_key_down = false;
                right_key_down = false;
            }
        }

        e.preventDefault();
    }

    document.addEventListener("touchstart", touchStart);
    document.addEventListener("touchmove", touchMove);

    document.addEventListener("touchend", touchEnd);
    document.addEventListener("touchcancel", touchEnd);


    step();
})();