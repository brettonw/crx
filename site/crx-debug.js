"use strict;"
Math.sgn = function (value) {
    return (value < 0.0) ? -1.0 : ((value > 0.0) ? 1.0 : 0.0);
}

Math.clamp = function (value, min, max) {
    return Math.max(Math.min(value, max), min);
}
var Constants = {
    G: -9.8
}
var Vector2d = function () {
    var _ = Object.create(null);

    var makeVector = function (x, y) {
        var vector = Object.create(_);
        vector.x = x;
        vector.y = y;
        return vector;
    };


    _.a = function (a) { return makeVector(a[0], a[1]); };
    _.xy = function (x, y) { return makeVector(x, y); };
    _.v = function (v) { return makeVector(v.x, v.y); };
    _.angle = function (a) { return makeVector(Math.cos(a), Math.sin(a)); };

    _.zero = function () { return makeVector(0, 0); };
    _.one = function () { return makeVector(1, 1); };


    _.add = function (b) { return makeVector(this.x + b.x, this.y + b.y); };
    _.subtract = function (b) { return makeVector(this.x - b.x, this.y - b.y); };
    _.scale = function (b) { return makeVector(this.x * b, this.y * b); };
    _.dot = function (b) { return (this.x * b.x) + (this.y * b.y); };
    _.cross = function (b) { return (this.x * b.y) - (this.y * b.x); };


    _.normSq = function () { return this.dot(this); };
    _.norm = function () { return Math.sqrt(this.normSq()); };
    _.normalize = function () { var norm = this.norm (); this.copy (this.scale(1.0 / norm)); return norm; }
    _.normalized = function () { return this.scale(1.0 / this.norm()); }


    _.perpendicular = function () { return makeVector(-this.y, this.x); }
    _.reflect = function (v, n) {

        return v.subtract (n.scale (v.dot(n) * 2.0));
    }


    _.toString = function () { return this.x + "," + this.y; }
    _.copy = function (v) { this.x = v.x; this.y = v.y; }

    return _;
}();
var Particle = function () {
    var _ = Object.create(null);

    _.reset = function (position) {
        this.position = position;
        this.velocity = Vector2d.zero();
        this.force = Vector2d.zero();
    }

    _.init = function (name, position, radius, density) {
        this.name = name;


        this.radius = radius;
        this.mass = Math.PI * radius * radius * density;
        this.reset(position);

        return this;
    }

    _.applyForce = function (force) {
        this.force = this.force.add(force);
    }

    _.applyAcceleration = function (acceleration) {
        var force = acceleration.scale(this.mass);
        this.applyForce(force);
    }

    _.applyDamping = function (damping) {


        this.applyAcceleration(this.velocity.scale(damping / deltaTime));
    }

    _.applyFunction = function (f) {
        f (this);
    }




    _.makeGeometry = function (container) {
        this.svg = container.append("circle")
            .attr("stroke-width", 2.0 / scale)
            .attr("fill", "red")
            .attr("fill-opacity", "1.0")
            .attr("stroke", "black")
            .attr("stroke-opacity", "1.0")
            .attr("r", this.radius);

        return this;
    };


    _.update = function (deltaTime) {

        var deltaVelocity = this.force.scale(deltaTime / this.mass);
        this.force = Vector2d.zero();


        this.position = this.position.add((deltaVelocity.scale(0.5).add(this.velocity)).scale(deltaTime));


        this.velocity = this.velocity.add(deltaVelocity);
    };


    _.paint = function () {
        this.svg
            .attr("cx", this.position.x)
            .attr("cy", this.position.y);
    }

    return _;
}();
var Thing = function () {
    var _ = Object.create(null);


    _.geometry = function () {
        var geometry = Object.create(null);

        geometry.density = 3183;

        var computeRadius = function (mass) {

            return Math.sqrt(mass / (Math.PI * geometry.density));
        }

        geometry.points = [
            { "pt": Vector2d.xy(-0.05, 0.05), "radius": computeRadius(1.0) },
            { "pt": Vector2d.zero(), "radius": computeRadius(1.0) },
            { "pt": Vector2d.xy(-0.05, -0.05), "radius": computeRadius(1.0) },
            { "pt": Vector2d.xy(0.10, 0.00), "radius": computeRadius(1.0) }
        ];
        geometry.constraints = [[0, 1], [1, 2], [2, 3], [3, 0], [3, 1]];

        geometry.computeXAxis = function (particles) {



            var midpoint = particles[0].position
                .add(particles[2].position)
                .scale(0.5);
            return particles[3].position
                .subtract(midpoint).normalized();
        }

        return geometry;
    }();




    _.updateFrameOfReference = function (deltaTime) {
        var particles = this.particles;
        var count = particles.length;
        var geometry = this.geometry;
        var points = geometry.points;



        var position = Vector2d.zero();
        for (var i = 0; i < count; ++i) {
            position = position.add (particles[i].position);
        };
        position = position.scale(1.0 / count);


        this.velocity = position
            .subtract(this.position)
            .scale(1.0 / deltaTime);
        this.position = position;


        var xAxis = geometry.computeXAxis (particles);





        var spinPosition = Math.atan2(xAxis.y, xAxis.x);
        var deltaSpinPosition = spinPosition - this.spinPosition;
     while (deltaSpinPosition > Math.PI) {
            deltaSpinPosition -= (Math.PI * 2.0);
        }
        while (deltaSpinPosition < -Math.PI) {
            deltaSpinPosition += (Math.PI * 2.0);
        }


        this.spinVelocity = deltaSpinPosition / deltaTime;
        this.spinPosition = spinPosition;




        var yAxis = xAxis.perpendicular();
        for (var i = 0; i < count; ++i) {
            particles[i].position = position
                .add(xAxis.scale(points[i].pt.x))
                .add(yAxis.scale(points[i].pt.y));
        }
    }

    _.reset = function (position, spinPosition) {
        var particles = this.particles;
        var count = particles.length;
        var points = this.geometry.points;


        var xAxis = Vector2d.angle(spinPosition);
        var yAxis = xAxis.perpendicular();
        for (var i = 0; i < count; ++i) {
            particles[i].reset(position
                .add(xAxis.scale(points[i].pt.x))
                .add(yAxis.scale(points[i].pt.y))
                );
        }


        this.position = position;
        this.velocity = Vector2d.zero();
        this.spinPosition = spinPosition;
        this.spinVelocity = 0;


        this.updateFrameOfReference(deltaTime);
    }

    _.init = function (name, position, spinPosition) {
        this.name = name;


        this.mass = 0;
        var particles = this.particles = [];
        var geometry = this.geometry;
        var points = geometry.points;
        for (var i = 0, count = points.length; i < count; ++i) {
            var particle = Object.create(Particle).init(name + "-" + i, Vector2d.zero(), points[i].radius, geometry.density);
            this.mass += particle.mass;
            particles.push(Manager.addParticle(particle));
        }


        var constraints = geometry.constraints;
        for (var i = 0, count = constraints.length; i < count; ++i) {
            var a = constraints[i][0];
            var b = constraints[i][1];
            var id_a = particles[a].id;
            var id_b = particles[b].id;
            Manager.addConstraint(id_a, id_b, points[a].pt.subtract(points[b].pt).norm(), 0.5, 2.0);
        }


        this.reset(position, spinPosition);

        Manager.addThing(this);

        return this;
    }

    _.makeGeometry = function (container) {
        var particles = this.particles;
        var count = particles.length;


        for (var i = 0; i < count; ++i) {
            particles[i].makeGeometry(container);
        }


        var pointsDesc = particles[0].position.toString();
        for (var i = 1; i < count; ++i) {
            pointsDesc += " " + particles[i].position.toString();
        }
        this.svg = container.append("polygon")
            .attr("fill", "red")
            .attr("fill-opacity", 0.33)
            .attr("points", pointsDesc);


        this.svgLine = container.append("line")
            .attr("stroke", "blue")
            .attr("stroke-opacity", 0.33)
            .attr("stroke-width", 2.0 / scale);

        return this;
    };

    _.update = function (deltaTime) {

        this.updateFrameOfReference(deltaTime);
    }

    _.paint = function () {

        this.svg.attr("transform", "translate(" + this.position.x + "," + this.position.y + ") rotate(" + (this.spinPosition * (180.0 / Math.PI)) + ", 0, 0)");


        this.svgLine
            .attr("transform", "translate(" + this.position.x + "," + this.position.y + ")")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", this.velocity.x)
            .attr("y2", this.velocity.y);


        var particles = this.particles;
        for (var i = 0, count = particles.length; i < count; ++i) {
            particles[i].paint();
        }
    }

    return _;
}();
var Ship = function () {
    var _ = Object.create(Thing);

    _.init = function (name, position, spinPosition) {

        Object.getPrototypeOf(_).init.call(this, name, Vector2d.zero(), 0);


        this.stunnedTime = 0;




        this.thrustRatio = 1.1 * ((this.particles.length * -Constants.G) / 2.0);

        this.learn ();
        this.reset (position, spinPosition);

        return this;
    }

    _.learn = function () {
        this.reset(Vector2d.zero(), 0);
        var spinVelocity = this.spinVelocity;
        var accumulator = 0;
        var accumulatorCount = 0;
        var scope = this;
        var report = function () {
            var stabilizationFrames = 5;
            for (var i = 0; i < stabilizationFrames; ++i) {
                Manager.update();
            }
            var spinAcceleration = Math.abs(scope.spinVelocity - spinVelocity) / (deltaTime * stabilizationFrames);
            spinVelocity = scope.spinVelocity;
            console.log("Spin Velocity: " + spinVelocity.toPrecision(5) + ", Spin Acceleration: " + spinAcceleration.toPrecision(5) + "/sec");
            accumulator += spinAcceleration;
            ++accumulatorCount;
            return spinAcceleration;
        }

        this.thrust(-1, 1);
        report();

        this.thrust(-1, 1);
        report();

        this.thrust(-1, 1);
        report();

        this.thrust(1, -1);
        report();

        this.thrust(1, -1);
        report();

        this.thrust(1, -1);
        report();

        this.spinAcceleration = accumulator / accumulatorCount;
        console.log("Spin Acceleration: " + this.spinAcceleration);
    }

    _.thrust = function (left, right) {

        if (this.stunnedTime <= 0) {


            var thrustScaling = this.thrustRatio * subStepCount;

            var orientationVector = Vector2d.angle(this.spinPosition);
            var leftThrustVector = orientationVector.scale(thrustScaling * left);
            var rightThrustVector = orientationVector.scale(thrustScaling * right);


            this.particles[0].applyAcceleration(leftThrustVector);
            this.particles[2].applyAcceleration(rightThrustVector);
        }
    }

    _.point = function (direction) {

        var targetSpinPosition = Math.atan2 (direction.y, direction.x);
        var deltaSpinPosition = targetSpinPosition - this.spinPosition
     while (deltaSpinPosition > Math.PI) {
            deltaSpinPosition -= (Math.PI * 2.0);
        }
        while (deltaSpinPosition < -Math.PI) {
            deltaSpinPosition += (Math.PI * 2.0);
        }
        var deltaSpinPositionMagnitude = Math.abs (deltaSpinPosition);



        var maxRotationVelocity = Math.PI * 2.0;
        var timeFactor = 1.0 / maxRotationVelocity;
        var timeToTargetSpinPosition = timeFactor * (1 + deltaSpinPositionMagnitude);
        var velocityToTargetSpinPosition = (deltaSpinPosition / timeToTargetSpinPosition);
        var deltaVelocityNeeded = velocityToTargetSpinPosition - this.spinVelocity;
        var thrustNeeded = deltaVelocityNeeded / (this.spinAcceleration * 0.5);
        var clampedThrust = Math.clamp(thrustNeeded, -1.0, 1.0);
        this.thrust (-clampedThrust, clampedThrust);


        return deltaSpinPositionMagnitude;
    }

    _.pointAt = function (point) {
        var direction = point.subtract (this.position).normalized ();
        this.point (direction);
    }

    var shipGo = function (ship, targetVelocity, clamp, fudgeFactor, precisionExponent) {



        var speed = targetVelocity.norm () * fudgeFactor;

        var axis = (speed > 0) ?
            targetVelocity.scale (1.0 / speed) :
            (ship.velocity.normSq () > 0 ?
                ship.velocity.normalized () :
                Vector2d.angle (ship.spinPosition));
        var perp = axis.perpendicular ();




        var axisComponent = Math.max (clamp, speed - (axis.dot (ship.velocity)));
        var perpComponent = 2.0 * perp.dot (ship.velocity);


        if ((Math.abs(axisComponent) > 0.001) || (Math.abs(perpComponent) > 0.001)) {

            var pointDirection = axis.scale (axisComponent).add (perp.scale (-perpComponent));
            var deltaSpinPosition = ship.point (pointDirection);


            var thrustLevel = 1.0 - (deltaSpinPosition / (Math.PI * 60.0 / 180.0));
            if (thrustLevel > 0) {




                thrustLevel = Math.pow (thrustLevel, precisionExponent);
                ship.thrust (thrustLevel, thrustLevel);
            }
        } else {
            ship.point (axis);
        }
    }

    _.go = function (targetVelocity) {
        shipGo (this, targetVelocity, 0.0, 1.0, 2.0);
    }

    _.goTo = function (targetPoint) {
        var targetVelocity = targetPoint.subtract (this.position);
        shipGo (this, targetVelocity, -1.0e3, 0.99, 2.0);
    }

    _.stop = function () {
        shipGo (this, Vector2d.zero (), -1.0e3, 1.0, 10.0);
    }

    _.stun = function (stunnedTime) {
        this.stunnedTime = Math.max(this.stunnedTime, stunnedTime);

    }

    _.update = function (deltaTime) {

        Object.getPrototypeOf(_).update.call(this, deltaTime);


        this.stunnedTime -= deltaTime;
    }

    return _;
}();
var Manager = function () {
    var _ = Object.create(null);

    var particles = [];
    var nextParticle = 0;

    _.addParticle = function (particle) {
        var id = nextParticle++;
        particles.push(particle);
        particle.id = id;
        return particle;
    }

    _.removeParticle = function (id) {



        delete particles[id];
    }

    var constraints = [];
    var nextConstraint = 0;

    _.addConstraint = function (a, b, length, damping, k) {
        var id = nextConstraint++;

        constraints.push({ "a": a, "b": b, "length": length, "damping": damping, "k":k });
        return id;
    }

    _.removeConstraint = function (id) {



        delete constraints[id];
    }

    var things = []
    var nextThing = 0;

    _.addThing = function (thing) {
        var id = nextThing++;
        things.push(thing);
        return id;
    }

    _.removeThing = function (id) {



        delete things[id];
    }

    _.updateParticles = function (deltaTime) {

        particles.forEach(function (particle, index, array) {
            particle.update(deltaTime);
        });


        constraints.forEach(function (constraint, index, array) {
            var a = particles[constraint.a];
            var b = particles[constraint.b];
            var delta = a.position.subtract(b.position);
            var length = delta.normalize();



            var relativeVelocity = a.velocity.subtract(b.velocity);
            var springVelocity = relativeVelocity.dot(delta);
            var totalMass = a.mass + b.mass;
            var velocityDampingForceA = constraint.damping * (a.mass / totalMass) * springVelocity * totalMass / deltaTime;
            var velocityDampingForceB = constraint.damping * (b.mass / totalMass) * springVelocity * totalMass / deltaTime;



            var springForce = constraint.k * (length - constraint.length);


            var FA = springForce + velocityDampingForceA;
            var FB = springForce + velocityDampingForceB;
            a.applyForce(delta.scale(-FA));
            b.applyForce(delta.scale(FB))
        });
    }

    _.updateThings = function (deltaTime) {
        things.forEach(function (thing, index, array) {
            thing.update(deltaTime);
        });
    }



    var gravity = null;

    _.setGravity = function (g) {
        gravity = g;
    }

    _.applyGravity = function (deltaTime) {
        if (gravity !== null) {
            particles.forEach(function (particle, index, array) {
                gravity(particle, deltaTime);
            });
        }
    }


    _.update = function () {
        for (var i = 0; i < subStepCount; ++i) {
            this.updateParticles(subDeltaTime);
            this.applyGravity(subDeltaTime);
        }
        this.updateThings(deltaTime);
    }

    _.paint = function () {

        things.forEach(function (thing, index, array) {
            thing.paint();
        });
    }

    return _;
}();
var GameKeys = function () {
    var _ = Object.create(null);

    _.codes = {
        "backspace": 8,
        "tab": 9,
        "enter": 13,
        "shift": 16,
        "ctrl": 17,
        "alt": 18,
        "pause": 19,
        "break": 19,
        "capsLock": 20,
        "escape": 27,
        "pageUp": 33,
        "pageDown": 34,
        "end": 35,
        "home": 36,
        "leftArrow": 37,
        "upArrow": 38,
        "rightArrow": 39,
        "downArrow": 40,
        "insert": 45,
        "delete": 46,
        "0": 48,
        "1": 49,
        "2": 50,
        "3": 51,
        "4": 52,
        "5": 53,
        "6": 54,
        "7": 55,
        "8": 56,
        "9": 57,
        "a": 65,
        "b": 66,
        "c": 67,
        "d": 68,
        "e": 69,
        "f": 70,
        "g": 71,
        "h": 72,
        "i": 73,
        "j": 74,
        "k": 75,
        "l": 76,
        "m": 77,
        "n": 78,
        "o": 79,
        "p": 80,
        "q": 81,
        "r": 82,
        "s": 83,
        "t": 84,
        "u": 85,
        "v": 86,
        "w": 87,
        "x": 88,
        "y": 89,
        "z": 90,
        "leftWindow": 91,
        "rightWindow": 92,
        "select": 93,
        "numpad0": 96,
        "numpad1": 97,
        "numpad2": 98,
        "numpad3": 99,
        "numpad4": 100,
        "numpad5": 101,
        "numpad6": 102,
        "numpad7": 103,
        "numpad8": 104,
        "numpad9": 105,
        "multiply": 106,
        "add": 107,
        "subtract": 109,
        "decimalPoint": 110,
        "divide": 111,
        "f1": 112,
        "f2": 113,
        "f3": 114,
        "f4": 115,
        "f5": 116,
        "f6": 117,
        "f7": 118,
        "f8": 119,
        "f9": 120,
        "f10": 121,
        "f11": 122,
        "f12": 123,
        "numLock": 144,
        "scrollLock": 145,
        "colon": 186,
        "equalSign": 187,
        "comma": 188,
        "dash": 189,
        "period": 190,
        "forwardSlash": 191,
        "graveAccent": 192,
        "openBracket": 219,
        "backSlash": 220,
        "closeBracket": 221,
        "quote": 222
    }

    _.init = function () {

        this.down = Object.create(null);


        var body = document.body;
        var scope = this;
        body.onkeydown = function (e) {
            scope.down[e.keyCode] = true;
        }
        body.onkeyup = function (e) {
            scope.down[e.keyCode] = false;
        }
    }

    _.isDown = function (code) {
        return (code in this.down) ? this.down[code] : false;
    }

    return _;
}();

var Container = function () {
    var _ = Object.create(null);

    _.addGame = function (name, game) {
        if (("games" in this) == false) {
            this.games = Object.create(null);
            this.prefix = "A".charCodeAt(0);
        }
        name = "(" + String.fromCharCode(this.prefix++) + ") " + name;
        this.games[name] = game;
    }

    _.getGameNames = function () {
        var gameNames = [];
        for (var gameName in this.games) {
            gameNames.push(gameName);
        }
        gameNames.sort();
        return gameNames;
    }

    _.getGame = function (name) {
        return this.games[name];
    }

    return _;
}();
var scale = 1.0;
var deltaTime = 1.0 / 60.0;
var subStepCount = 4;
var subDeltaTime = deltaTime / subStepCount;

function preInitGame(container) {

    var gameNames = container.getGameNames ();


    var location = new String(window.location);
    console.log("URL (" + location + ")");
    var targetIndex = location.search("#");
    if (targetIndex >= 0) {
        var target = location.substring(targetIndex + 1);
        var targetGameIndex = target.toLowerCase().charCodeAt(0) - "a".charCodeAt(0);
        if ((targetGameIndex >= 0) && (targetGameIndex < gameNames.length)) {
            console.log("URL (" + location + ") Target (" + target + ") at index (" + targetGameIndex + ")");
            gameNames = [gameNames[targetGameIndex]];
        }
    }


    if (gameNames.length > 1) {
        var gameList = document.createElement ("div");
        gameList.className = "gameList";
        gameList.id = "gameList";
        for (var i = 0; i < gameNames.length; ++i) {
            var link = document.createElement ("div");
            link.innerHTML = gameNames[i];
            link.onclick = function () {
                this.parentNode.parentNode.removeChild (this.parentNode);
                initGame(container.getGame (this.innerHTML));
            };
            gameList.appendChild (link);
        }
        var display = document.getElementById ("display");
        display.appendChild (gameList);
    } else {
        initGame(container.getGame (gameNames[0]));
    }
}

function initGame(game) {

    GameKeys.init();




    var target = d3.select("#display");
    var svg = target.append("svg").attr("class", "gameDisplay");



    svg.append("rect")
        .attr("class", "gameBackground")
        .attr("width", "100%")
        .attr("height", "100%");


    var child = svg.append("g").attr("class", "gameDisplay");
    svg.call(d3.behavior.zoom()
        .translate([0, 0])
        .scale(1.0)
        .scaleExtent([0.125, 8.0])
        .on("zoom", function () {

            child

                .attr("transform",
                    "translate(" + d3.event.translate[0] + "," + d3.event.translate[1] + ") " +
                    "scale(" + d3.event.scale + ")"
                );

        })
    );


    var fps = svg.append("text")
        .attr("x", 5)
        .attr("y", 20)
        .attr("font-family", "sans-serif")
        .attr("font-size", "20px")
        .attr("fill", "black")
        .text("123");



    svg = child.append("g").attr("class", "gameDisplay");
    var xScale = target[0][0].clientWidth;
    var yScale = target[0][0].clientHeight;
    scale = Math.min(xScale, yScale);
    svg.attr("transform", "translate(" + (xScale / 2.0) + "," + (yScale / 2.0) + ") scale(" + scale + "," + -scale + ")");


    GameKeys.targetPt = Vector2d.xy(0, 1);
    svg.on("mousemove", function () {

        var point = d3.mouse(this);
        GameKeys.targetPt = Vector2d.a(point);
        mouse
            .attr("cx", GameKeys.targetPt.x)
            .attr("cy", GameKeys.targetPt.y);
    });


    svg = svg.append("g").attr("class", "gameDisplay");



    svg.append("rect")
        .attr("x", -10)
        .attr("y", -2)
        .attr("width", 20)
        .attr("height", 12)
        .attr("fill", "white")
        .attr("fill-opacity", "0.5");


    var gridLines = [0.0];
    var gridMin = -5.0;
    var gridMax = 5.0;

    svg.selectAll(".xTicks")
        .data(gridLines)
        .enter().append("line").attr("class", "xTicks")
        .attr("x1", function (d) { return d; })
        .attr("y1", gridMin)
        .attr("x2", function (d) { return d; })
        .attr("y2", gridMax)
        .attr("stroke", "rgba(0, 0, 0, 0.20)")
        .attr("stroke-width", 1 / scale);

    svg.selectAll(".yTicks")
        .data(gridLines)
        .enter().append("line").attr("class", "yTicks")
        .attr("x1", gridMin)
        .attr("y1", function (d) { return d; })
        .attr("x2", gridMax)
        .attr("y2", function (d) { return d; })
        .attr("stroke", "rgba(0, 0, 0, 0.20)")
        .attr("stroke-width", 1 / scale);


    var mouse = svg.append("circle")
        .attr("stroke-width", 2.0 / scale)
        .attr("fill", "green")
        .attr("fill-opacity", "1.0")
        .attr("stroke", "black")
        .attr("stroke-opacity", "1.0")
        .attr("r", 0.01);


    game.setup(svg);


    var frameCount = 30;
    var frameTimes = Array.apply(null, new Array(frameCount)).map(Number.prototype.valueOf,0);
    var frameIndex = 0;
    var frameSum = 0;
    var lastTime = new Date().valueOf ();
    var gametimer = setInterval(function () {

        var nowTime = new Date().valueOf();
        frameSum -= frameTimes[frameIndex];
        frameTimes[frameIndex] = nowTime - lastTime;
        frameSum += frameTimes[frameIndex];
        frameIndex = (frameIndex + 1) % frameCount;
        lastTime = nowTime;
        var frameRate = frameCount / (frameSum / 1000);
        fps.text(frameRate.toPrecision(5) + " fps");


        game.play();


        Manager.update();
        Manager.paint();

    }, 1000 * deltaTime);





}
var GameContainer = function () {
    var _ = Object.create(Container);

    _.addGame ("Play with Gravity", function () {

        var ship;
        return {
            "setup": function (container) {


                ship = Object.create(Ship).init("Player 1", Vector2d.zero(), 0).makeGeometry(container);


                Manager.setGravity(function (particle, deltaTime) {
                    if (particle.position.y > 0.0) {
                        var scale = Math.pow(Math.min(particle.position.y / 0.25, 1.0), 0.5);
                        particle.applyAcceleration(Vector2d.xy(0, Constants.G * scale));
                    } else {
                        var groundAccel = Vector2d.xy((-0.5 / deltaTime) * particle.velocity.x, 0);
                        if (particle.velocity.y < 0) {
                            var elasticity = 0.8;
                            groundAccel.y = (particle.velocity.y * -(1.0 + elasticity)) / deltaTime;


                            var impact = particle.velocity.norm() - 0.5;
                            if (impact > 0) {
                                ship.stun(impact * 0.5);
                            }
                        }
                        particle.applyAcceleration(groundAccel);
                        particle.position.y = 0.0;
                    }
                });
            },

            "play": function () {
                var deltaSpinPosition = ship.pointAt(GameKeys.targetPt);
                if (GameKeys.isDown(GameKeys.codes.upArrow)) {
                    var targetGo = GameKeys.targetPt.subtract(ship.position);






                    ship.thrust(1.0, 1.0);
                }
            },

            "finish": function () {
                Manager.setGravity(null);
            }
        }
    }());

    return _;
}();
var TestContainer = function () {
    var _ = Object.create(Container);


    var gameNames = GameContainer.getGameNames();
    for (var i = 0, count = gameNames.length; i < count; ++i) {
        var gameName = gameNames[i];
        var game = GameContainer.getGame(gameName);
        _.addGame(gameName.substring(4), game);
    }

    return _;
}();
TestContainer.addGame("Viewport", function (ship) {
        return {
            "setup": function (container) { },
            "play": function () { },
            "finish": function () { }
        };
    }());
TestContainer.addGame("Simple Particle", function (ship) {
        var particle;
        return {
            "setup": function (container) {

                particle = Manager.addParticle(function () {
                    var r = 0.01, d = 300;
                    return Object.create(Particle).init("Particle", Vector2d.zero(), r, d).
                        makeGeometry(container);
                }());
            },

            "play": function () {

                particle.paint();


                if (GameKeys.isDown(GameKeys.codes.rightArrow)) {
                    particle.applyAcceleration(Vector2d.xy (1, 0));
                }
                if (GameKeys.isDown(GameKeys.codes.leftArrow)) {
                    particle.applyAcceleration(Vector2d.xy(-1, 0));
                }
                if (GameKeys.isDown(GameKeys.codes.upArrow)) {
                    particle.applyAcceleration(Vector2d.xy(0, 1));
                }
                if (GameKeys.isDown(GameKeys.codes.downArrow)) {
                    particle.applyAcceleration(Vector2d.xy(0, -1));
                }
            },
            "finish": function () { }
        };
    }());
TestContainer.addGame("Gravity Particle", function (ship) {
        var particle;
        return {
            "setup": function (container) {

                particle = Manager.addParticle(function () {
                    var r = 0.01, d = 300;
                    return Object.create(Particle).init("Particle", Vector2d.zero(), r, d).
                        makeGeometry(container);
                }());


                Manager.setGravity(function (particle, deltaTime) {
                    var gravityVector = GameKeys.targetPt.subtract(particle.position);
                    particle.applyAcceleration(gravityVector);
                });
            },

            "play": function () {

                particle.paint();
            },
            "finish": function () { }
        };
    }());
TestContainer.addGame("Simple Constraints", function (ship) {
        var particles;
        var svg;
        return {
            "setup": function (container) {
                var points = [
                    Vector2d.xy(-0.05, 0.05),
                    Vector2d.xy(-0.05, -0.05),
                    Vector2d.xy(0.10, 0.00)
                ];


                var particle = function (i) {
                    var r = 0.01, d = 300;
                    return Object.create(Particle).init("Point-" + i, points[i], r, d).makeGeometry(container);
                }
                particles = [
                     Manager.addParticle(particle(0)),
                     Manager.addParticle(particle(1)),
                     Manager.addParticle(particle(2)),
                ];


                var constrain = function (a, b) {
                    var id_a = particles[a].id;
                    var id_b = particles[b].id;
                    Manager.addConstraint(id_a, id_b, points[a].subtract(points[b]).norm(), 0.5, 2.0);
                }
                constrain(0, 1); constrain(1, 2); constrain(2, 0);


                var points = particles[0].position.toString() + " " +
                             particles[1].position.toString() + " " +
                             particles[2].position.toString();
                svg = container.append("polygon")
                    .attr("fill", "red")
                    .attr("fill-opacity", 0.33)
                    .attr("points", points);
            },

            "play": function () {

                var position = particles[0].position
                    .add(particles[1].position)
                    .add(particles[2].position)
                    .scale(1.0 / 3.0);
                var midpoint = particles[0].position
                    .add(particles[1].position)
                    .scale(0.5);
                var xAxis = particles[2].position
                    .subtract(midpoint).normalized();
                var spinPosition = Math.atan2(xAxis.y, xAxis.x);
                svg.attr("transform", "translate(" + position.x + "," + position.y + ") rotate(" + (spinPosition * (180.0 / Math.PI)) + ", 0, 0)");


                particles[0].paint();
                particles[1].paint();
                particles[2].paint();
                if (GameKeys.isDown(GameKeys.codes.rightArrow)) {
                    particles[0].applyAcceleration(xAxis.scale(2));
                    particles[1].applyAcceleration(xAxis.scale(-2));
                }
                if (GameKeys.isDown(GameKeys.codes.leftArrow)) {
                    particles[0].applyAcceleration(xAxis.scale(-2));
                    particles[1].applyAcceleration(xAxis.scale(2));
                }
            },
            "finish": function () { }
        };
    }());
TestContainer.addGame("More Constraints", function (ship) {
        var particles;
        var svg;
        return {
            "setup": function (container) {
                var points = [
                    Vector2d.xy(-0.05, 0.05),
                    Vector2d.xy(0, 0),
                    Vector2d.xy(-0.05, -0.05),
                    Vector2d.xy(0.10, 0.00)
                ];


                var particle = function (i) {
                    var r = 0.01, d = 300;
                    return Object.create(Particle).init("Point-" + i, points[i], r, d).makeGeometry(container);
                }
                particles = [
                     Manager.addParticle(particle(0)),
                     Manager.addParticle(particle(1)),
                     Manager.addParticle(particle(2)),
                     Manager.addParticle(particle(3)),
                ];


                var constrain = function (a, b) {
                    var id_a = particles[a].id;
                    var id_b = particles[b].id;
                    Manager.addConstraint(id_a, id_b, points[a].subtract(points[b]).norm(), 0.5, 2.0);
                }
                constrain(0, 1); constrain(1, 2); constrain(0, 2); constrain(2, 3); constrain(3, 0); constrain(1, 3);


                var points = particles[0].position.toString() + " " +
                             particles[1].position.toString() + " " +
                             particles[2].position.toString() + " " +
                             particles[3].position.toString();
                svg = container.append("polygon")
                    .attr("fill", "red")
                    .attr("fill-opacity", 0.33)
                    .attr("points", points);
            },

            "play": function () {

                var position = particles[0].position
                    .add(particles[1].position)
                    .add(particles[2].position)
                    .add(particles[3].position)
                    .scale(1.0 / particles.length);
                var midpoint = particles[0].position
                    .add(particles[2].position)
                    .scale(0.5);
                var xAxis = particles[3].position
                    .subtract(midpoint).normalized();
                var spinPosition = Math.atan2(xAxis.y, xAxis.x);
                svg.attr("transform", "translate(" + position.x + "," + position.y + ") rotate(" + (spinPosition * (180.0 / Math.PI)) + ", 0, 0)");


                particles[0].paint();
                particles[1].paint();
                particles[2].paint();
                particles[3].paint();
                if (GameKeys.isDown(GameKeys.codes.rightArrow)) {
                    particles[0].applyAcceleration(xAxis.scale(2));
                    particles[2].applyAcceleration(xAxis.scale(-2));
                }
                if (GameKeys.isDown(GameKeys.codes.leftArrow)) {
                    particles[0].applyAcceleration(xAxis.scale(-2));
                    particles[2].applyAcceleration(xAxis.scale(2));
                }
            },
            "finish": function () { }
        };
    }());
TestContainer.addGame("Key Controls", function (ship) {
        var ship;
        return {
            "setup": function (container) {
                ship = Object.create(Ship).init("Player 1", Vector2d.zero(), 0).makeGeometry(container);
            },
            "play": function () {
                var leftThrust = 0.0;
                var rightThrust = 0.0;
                if (GameKeys.isDown(GameKeys.codes.upArrow)) { leftThrust += 1.0; rightThrust += 1.0; }
                if (GameKeys.isDown(GameKeys.codes.downArrow)) { leftThrust += -0.5; rightThrust += -0.5; }
                if (GameKeys.isDown(GameKeys.codes.rightArrow)) { leftThrust += 0.5; rightThrust += -0.5; }
                if (GameKeys.isDown(GameKeys.codes.leftArrow)) { leftThrust += -0.5; rightThrust += 0.5; }
                leftThrust = Math.max(-1.0, leftThrust); leftThrust = Math.min(1.0, leftThrust);
                rightThrust = Math.max(-1.0, rightThrust); rightThrust = Math.min(1.0, rightThrust);
                ship.thrust(leftThrust, rightThrust);
            },
            "finish": function () { }
        };
    }());
TestContainer.addGame("Point At", function (ship) {
        var ship;
        return {
            "setup": function (container) {
                ship = Object.create(Ship).init("Player 1", Vector2d.zero(), 0).makeGeometry(container);
            },
            "play": function () {
                if (GameKeys.isDown(GameKeys.codes.upArrow)) {
                    var deltaSpinPosition = ship.pointAt(GameKeys.targetPt);
                }
            },
            "finish": function () { }
        };
    }());
TestContainer.addGame("Go Toward", function (ship) {
        var ship;
        return {
            "setup": function (container) {
                ship = Object.create(Ship).init("Player 1", Vector2d.zero(), 0).makeGeometry(container);
            },
            "play": function () {
                if (GameKeys.isDown(GameKeys.codes.upArrow)) {
                    var targetGo = GameKeys.targetPt.subtract(ship.position);
                    ship.go(targetGo);
                } else {
                    ship.stop();
                }
            },
            "finish": function () { }
        };
    }());
TestContainer.addGame("Go To", function (ship) {
        var ship;
        return {
            "setup": function (container) {
                ship = Object.create(Ship).init("Player 1", Vector2d.zero(), 0).makeGeometry(container);
            },
            "play": function () {
                if (GameKeys.isDown(GameKeys.codes.upArrow)) {
                    ship.goTo(GameKeys.targetPt);
                } else {
                    ship.stop();
                }
            },
            "finish": function () { }
        };
    }());
