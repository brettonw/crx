var TestContainer = function () {
    var _ = Object.create(Container);

    _.addGame("Go To", function (ship) {
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

    _.addGame("Go Toward", function (ship) {
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

    _.addGame("Point At", function (ship) {
        var ship;
        return {
            "setup": function (container) {
                ship = Object.create(Ship).init("Player 1", Vector2d.zero(), 0).makeGeometry(container);
            },
            "play": function () {
                var deltaSpinPosition = ship.pointAt(GameKeys.targetPt);
                if (GameKeys.isDown(GameKeys.codes.upArrow)) {
                    ship.thrust(1.0, 1.0);
                }
            },
            "finish": function () { }
        };
    }());

    _.addGame("Key Controls", function (ship) {
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

    _.addGame("Simple Constraints", function (ship) {
        var particles;
        var svg;
        return {
            "setup": function (container) {
                var points = [
                    Vector2d.xy(-0.05, 0.05),
                    Vector2d.xy(-0.05, -0.05),
                    Vector2d.xy(0.10, 0.00)
                ];

                // create the particle list
                var particle = function (i) {
                    var r = 0.01, d = 300;
                    return Object.create(Particle).init("Point-" + i, points[i], r, d).makeGeometry(container);
                }
                particles = [
                     Manager.addParticle(particle(0)),
                     Manager.addParticle(particle(1)),
                     Manager.addParticle(particle(2)),
                ];

                // create the constraint list
                var constrain = function (a, b) {
                    var id_a = particles[a].id;
                    var id_b = particles[b].id;
                    Manager.addConstraint(id_a, id_b, points[a].subtract(points[b]).norm());
                }
                constrain(0, 1); constrain(1, 2); constrain(2, 0);

                // add a ghost of my intended shape
                var points = particles[0].position.toString() + " " +
                             particles[1].position.toString() + " " +
                             particles[2].position.toString();
                svg = container.append("polygon")
                    .attr("fill", "red")
                    .attr("fill-opacity", 0.33)
                    .attr("points", points);
            },

            "play": function () {
                // update the display frame of reference
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

                // update the particles
                particles[0].paint();
                particles[1].paint();
                particles[2].paint();

                if (GameKeys.isDown(GameKeys.codes.rightArrow)) {
                    particles[0].applyAcceleration(xAxis.scale(1));
                    particles[1].applyAcceleration(xAxis.scale(-1));
                }
                if (GameKeys.isDown(GameKeys.codes.leftArrow)) {
                    particles[0].applyAcceleration(xAxis.scale(-1));
                    particles[1].applyAcceleration(xAxis.scale(1));
                }
            },
            "finish": function () { }
        };
    }());

    _.addGame("Viewport", function (ship) {
        return {
            "setup": function (container) { },
            "play": function () { },
            "finish": function () { }
        };
    }());

    return _;
}();
