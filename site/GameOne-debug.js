"use strict";



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
var Cluster = function () {
    var _ = Object.create(null);


    var points = [
        Vector2d.xy(-0.05, 0.05),
        Vector2d.xy(-0.05, -0.05),
        Vector2d.xy(0.10, 0.00)
    ];



    _.subStepCount = 5;




    _.updateFrameOfReference = function () {
        var scope = this;
        var particles = this.particles;



        var position = particles[0].position
            .add(particles[1].position)
            .add(particles[2].position)
            .scale(1.0 / 3.0);
        this.velocity = position
            .subtract(this.position)
            .scale(1.0 / deltaTime);
        this.position = position;




        var midpoint = particles[0].position
            .add(particles[1].position)
            .scale(0.5);
        var xAxis = particles[2].position
            .subtract(midpoint).normalized();
        var yAxis = xAxis.perpendicular();





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




        var resetParticle = function (i) {
            particles[i].position = scope.position
                .add(xAxis.scale(points[i].x))
                .add(yAxis.scale(points[i].y));
        }
        resetParticle(0);
        resetParticle(1);
        resetParticle(2);
    }

    _.reset = function (position, spinPosition) {
        var scope = this;


        var xAxis = Vector2d.angle(spinPosition);
        var yAxis = xAxis.perpendicular();
        var particle = function (i) {
            scope.particles[i].reset(position
                .add(xAxis.scale(points[i].x))
                .add(yAxis.scale(points[i].y))
                );
        }
        particle(0); particle(1); particle(2);


        this.position = position;
        this.velocity = Vector2d.zero();
        this.spinPosition = spinPosition;
        this.spinVelocity = 0;


        this.updateFrameOfReference();
    }

    _.init = function (name, position, spinPosition) {
        this.name = name;


        var particle = function (i) {
            var r = 0.01, d = 300;
            return Object.create(Particle).init(name + "-" + i, Vector2d.zero (), r, d);
        }
        this.particles = [particle(0), particle(1), particle(2)];
        this.mass = this.particles[0].mass + this.particles[1].mass + this.particles[2].mass;


        var constrain = function (a, b) {
            return { "a": a, "b": b, "d": points[a].subtract(points[b]).norm() };
        }
        this.constraints = [constrain(0, 1), constrain(1, 2), constrain(2, 0)];


        this.reset(position, spinPosition);

        return this;
    }





    _.applyFunction = function (f) {
        f (this.particles[0]);
        f (this.particles[1]);
        f (this.particles[2]);
    }

    _.makeGeometry = function (container) {

        this.particles[0].makeGeometry(container);
        this.particles[1].makeGeometry(container);
        this.particles[2].makeGeometry(container);


        var points = this.particles[0].position.toString() + " " +
                     this.particles[1].position.toString() + " " +
                     this.particles[2].position.toString();
        this.svg = container.append("polygon")
            .attr("fill", "red")
            .attr("fill-opacity", 0.33)
            .attr("points", points);


        this.svgLine = container.append("line")
            .attr("stroke", "blue")
            .attr("stroke-opacity", 0.33)
            .attr("stroke-width", 2.0 / scale);

        return this;
    };

    _.update = function (deltaTime) {
        var scope = this;
        var subStep = function (dT) {

            var resolveConstraint = function (c) {
                var constraint = scope.constraints[c];
                var a = scope.particles[constraint.a];
                var b = scope.particles[constraint.b];
                var delta = a.position.subtract(b.position);
                var d = delta.normalize();


                var relativeVelocity = a.velocity.subtract(b.velocity);
                var springVelocity = relativeVelocity.dot(delta);
                var velocityDampingForce = 0.5 * 0.5 * springVelocity * (a.mass + b.mass) / dT;




                var x = d - constraint.d;
                var k = 1;
                var springForce = k * x;


                var F = springForce + velocityDampingForce;
                a.applyForce(delta.scale(-F));
                b.applyForce(delta.scale(F))
            }
            resolveConstraint(0);
            resolveConstraint(1);
            resolveConstraint(2);


            scope.particles[0].update(dT);
            scope.particles[1].update(dT);
            scope.particles[2].update(dT);
        }

        var dT = deltaTime / this.subStepCount;
        for (var i = 0; i < this.subStepCount; ++i) {
            subStep(dT);
        }
    };

    _.paint = function () {

        this.updateFrameOfReference();


        this.svg.attr("transform", "translate(" + this.position.x + "," + this.position.y + ") rotate(" + (this.spinPosition * (180.0 / Math.PI)) + ", 0, 0)");


        this.svgLine
            .attr("transform", "translate(" + this.position.x + "," + this.position.y + ")")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", this.velocity.x)
            .attr("y2", this.velocity.y);


        this.particles[0].paint();
        this.particles[1].paint();
        this.particles[2].paint();
    }

    return _;
}();
var Thing = function () {
    var _ = Object.create(Particle);

    _.init = function (name, position, spinPosition) {

        Object.getPrototypeOf(Thing).init.call(this, name, position, 1.0, 1.0);



        this.spinMass = this.mass;
        this.spinPosition = spinPosition;
        this.spinVelocity = 0.0;
        this.spinForce = 0.0;

        return this;
    }

    _.applySpinForce = function (spinForce) {
        this.spinForce += spinForce;
    }

    _.applySpinAcceleration = function (spinAcceleration) {
        var spinForce = spinAcceleration * this.spinMass;
        this.applySpinForce(spinForce);
    }

    _.applySpinDamping = function (spinDamping) {


        this.applySpinAcceleration(this.spinVelocity * spinDamping / deltaTime);

    }

    _.makeGeometry = function (container) {
        var geometry = [
            Vector2d.xy(0.00, 0.00),
            Vector2d.xy(-0.05, 0.05),
            Vector2d.xy(0.10, 0.00),
            Vector2d.xy(-0.05, -0.05)
        ];
        var points = geometry[0].toString ();
        for (var i = 1; i < geometry.length; ++i) {
            points += " " + geometry[i].toString ();
        }
        this.svg = container.append("polygon")
        .attr("stroke-width", 2.0 / scale)
        .attr("fill", "red")
        .attr("fill-opacity", "1.0")
        .attr("stroke", "black")
        .attr("stroke-opacity", "1.0")
        .attr("stroke-linejoin", "round")
        .attr("points", points);

        return this;
    };

    _.update = function (deltaTime) {

        Object.getPrototypeOf(Thing).update.call(this);


        var deltaSpinVelocity = this.spinForce * (deltaTime / this.spinMass);
        this.spinForce = 0.0;


        this.spinPosition = this.spinPosition + (((deltaSpinVelocity * 0.5) + this.spinVelocity) * deltaTime);


        this.spinVelocity = this.spinVelocity + deltaSpinVelocity;


        var TWO_PI = Math.PI * 2;
        while (this.spinPosition >= TWO_PI)
            this.spinPosition -= TWO_PI;
        while (this.spinPosition < 0)
            this.spinPosition += TWO_PI;
    };

    _.paint = function () {
        this.svg.attr("transform", "translate(" + this.position.x + "," + this.position.y + ") rotate(" + (this.spinPosition * (180.0 / Math.PI)) + ", 0, 0)");
    }

    return _;
}();
var Ship = function () {
    var _ = Object.create(Cluster);

    _.learn = function () {
        var substepCount = Cluster.subStepCount;
        Cluster.subStepCount = 20;

        this.reset (Vector2d.zero (), 0);
        var spinVelocity = this.spinVelocity;
        var accumulator = 0;
        var accumulatorCount = 0;
        var scope = this;
        var report = function () {
            scope.update (deltaTime);
            scope.updateFrameOfReference();
            var spinAcceleration = Math.abs (scope.spinVelocity - spinVelocity) / deltaTime;
            spinVelocity = scope.spinVelocity;
            console.log ("Velocity: " + spinVelocity.toPrecision (5) + ", Spin Acceleration: " + spinAcceleration.toPrecision (5) + "/frame");
            accumulator += spinAcceleration;
            ++accumulatorCount;
            return spinAcceleration;
        }

        report ();

        this.thrust (-1, 1);
        report ();
        report ();
        report ();
        report ();

        this.thrust (-1, 1);
        report ();
        report ();
        report ();
        report ();

        this.thrust (1, -1);
        report ();
        report ();
        report ();
        report ();

        this.spinAcceleration = accumulator / accumulatorCount;
        console.log ("Spin Acceleration: " + this.spinAcceleration);

        Cluster.subStepCount = substepCount;
    }

    _.init = function (name, position, spinPosition) {

        Object.getPrototypeOf(Ship).init.call(this, name, Vector2d.zero (), 0);

        this.thrustRatio = 16.0;
        this.rotateRatio = 5.0;

        this.learn ();
        this.reset (position, spinPosition);

        return this;
    }

    _.thrust = function (left, right) {
        var orientationVector = Vector2d.angle(this.spinPosition);
        var leftThrustVector = orientationVector.scale(this.thrustRatio * left);
        var rightThrustVector = orientationVector.scale(this.thrustRatio * right);


        this.particles[0].applyAcceleration(leftThrustVector);
        this.particles[1].applyAcceleration(rightThrustVector);
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



        var timeToTargetSpinPosition = 0.15 * (1 + deltaSpinPositionMagnitude);
        var velocityToTargetSpinPosition = (deltaSpinPosition / timeToTargetSpinPosition);
        var deltaVelocityNeeded = velocityToTargetSpinPosition - this.spinVelocity;
        var thrustNeeded = deltaVelocityNeeded / this.spinAcceleration;
        var clampedThrust = Math.min(Math.max(thrustNeeded, -1.0), 1.0);
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


            var thrustLevel = 1.0 - (deltaSpinPosition / (Math.PI * 0.5));
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
        shipGo (this, targetVelocity, -1.0e3, 0.9, 4.0);
    }

    _.stop = function () {
        shipGo (this, Vector2d.zero (), -1.0e3, 1.0, 5.0);
    }

    return _;
}();
var scale = 1.0;
var deltaTime = 1.0 / 60.0;

var leftkeydown = false;
var upkeydown = false;
var rightkeydown = false;
var downkeydown = false;

function initPage() {

    var body = document.body;
    body.onkeydown = function (e) {
        if (e.keyCode == 37) leftkeydown = true;
        if (e.keyCode == 38) upkeydown = true;
        if (e.keyCode == 39) rightkeydown = true;
        if (e.keyCode == 40) downkeydown = true;
    }
    body.onkeyup = function (e) {
        if (e.keyCode == 37) leftkeydown = false;
        if (e.keyCode == 38) upkeydown = false;
        if (e.keyCode == 39) rightkeydown = false;
        if (e.keyCode == 40) downkeydown = false;
    }
    var target = d3.select("#display");
    var svg = target.append("svg").attr("class", "gameDisplay");


    svg.style("opacity", 1.0e-6)
        .transition().duration(1000)
        .style("opacity", 1.0);



    svg.append("rect")
        .attr("class", "gameBackground")
        .attr("width", "100%")
        .attr("height", "100%");


    var child = svg.append("g").attr("class", "gameDisplay");
    svg.call (d3.behavior.zoom()
        .translate ([0, 0])
        .scale (1.0)
        .scaleExtent([0.125, 8.0])
        .on("zoom", function() {
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
    scale = Math.min (xScale, yScale);
    svg.attr ("transform", "translate(" + (xScale / 2.0) + "," + (yScale / 2.0) + ") scale(" + scale + "," + -scale + ")");


    var targetPt = Vector2d.xy(0, 1);
    svg.on("mousemove", function () {

        var point = d3.mouse(this);
        targetPt = Vector2d.a(point);
        target
            .attr("cx", targetPt.x)
            .attr("cy", targetPt.y);

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
    var gridMin;
    var gridMax;
    for (var i = 1; i < 25; ++i) {
        var value = 0.05 * i;
        gridMin = -value;
        gridMax = value
        gridLines = [gridMin].concat (gridLines).concat ([gridMax]);
    }
    svg.selectAll(".xTicks")
        .data(gridLines)
        .enter().append("line").attr("class", "xTicks")
        .attr("x1", function(d) { return d; })
        .attr("y1", gridMin)
        .attr("x2", function(d) { return d; })
        .attr("y2", gridMax)
        .attr("stroke", "rgba(0, 0, 0, 0.20)")
        .attr("stroke-width", 1 / scale);

    svg.selectAll(".yTicks")
        .data(gridLines)
        .enter().append("line").attr("class", "yTicks")
        .attr("x1", gridMin)
        .attr("y1", function(d) { return d; })
        .attr("x2", gridMax)
        .attr("y2", function(d) { return d; })
        .attr("stroke", "rgba(0, 0, 0, 0.20)")
        .attr("stroke-width", 1 / scale);


    var target = svg.append("circle")
        .attr("stroke-width", 2.0 / scale)
        .attr("fill", "green")
        .attr("fill-opacity", "1.0")
        .attr("stroke", "black")
        .attr("stroke-opacity", "1.0")
        .attr("r", 0.01);

    var ship = Object.create(Ship).init("Ship 1", Vector2d.zero(), 0).makeGeometry(svg);

    var frameCounter = 0;
    var startTime;
    var gametimer = setInterval(function () {

        if (frameCounter++ == 0) {
            startTime = new Date ();
            fps.text ("0 fps");
        } else {
            var now = new Date ();
            var delta = now.valueOf () - startTime.valueOf ();
            var seconds = delta / 1000;
            var frames_per_second = frameCounter / seconds;
            fps.text(frames_per_second.toPrecision(5) + " fps");
        }
        if (upkeydown) {
            var targetGo = targetPt.subtract (ship.position);




            ship.go (targetGo);
        } else if (downkeydown) {
            ship.applyFunction (function (particle) {
                particle.applyDamping(-0.5);
            });
        } else {
            ship.stop ();
        }


        if (false) {
            ship.applyFunction (function (particle) {
                if (particle.position.y > 0.5) {
                    particle.applyAcceleration(Vector2d.xy(0, -9.8));
                } else if (particle.position.y > 0.0) {
                    var scale = 0.5 - particle.position.y;
                    particle.applyAcceleration(Vector2d.xy(0, -9.8 * scale));
                    particle.applyDamping(-scale);
                } else {
                    particle.applyAcceleration(Vector2d.xy(0, -5.0 * particle.position.y));
                    particle.applyDamping(-0.5);
                }
            });
        }
        ship.update(deltaTime);
        ship.paint();
    }, 1000 * deltaTime);


}
