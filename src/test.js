var Test = function () {
    var _ = Object.create(null);

    _["(A) Go To"] = function (ship) {
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
    }();

    _["(B) Go Toward"] = function (ship) {
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
    }();

    _["(C) Point At"] = function (ship) {
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
    }();

    _["(D) Key Controls"] = function (ship) {
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
    }();

    _["(E) Viewport"] = function (ship) {
        return {
            "setup": function (container) { },
            "play": function () { },
            "finish": function () { }
        };
    }();

    return _;
}();
