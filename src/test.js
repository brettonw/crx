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
                    return Object.create(Particle).init("Point-" + i, points[i], r, d);
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
            },

            "play": function () {
                if (GameKeys.isDown(GameKeys.codes.leftArrow)) {
                    var midpoint = particles[0].position
                        .add(particles[1].position)
                        .scale(0.5);
                    var xAxis = particles[2].position
                        .subtract(midpoint).normalized();
                    particles[0].applyAcceleration(xAxis.scale (1));
                    particles[1].applyAcceleration(xAxis.scale(-1));
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
