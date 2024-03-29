TestContainer.addGame("Point At", function () {
        return {
            "setup": function (container) {
                ship = Object.create(Ship).init("Player 1", Vector2d.zero(), 0).makeGeometry(container);
            },
            "play": function () {
                if (GameKeys.isDown(GameKeys.codes.upArrow)) {
                    let deltaSpinPosition = ship.pointAt(GameKeys.targetPt);
                }
            },
            "finish": function () { }
        };
    }());
