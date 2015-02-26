var GameContainer = function () {
    var _ = Object.create(Container);

    _.addGame ("Play with Gravity", function () {
        // the ship we want to play the game with
        var ship;
        return {
            "setup": function (container) {
                ship = Object.create(Ship).init("Player 1", Vector2d.zero(), 0).makeGeometry(container);

                // gravity
                Manager.setGravity(function (particle, deltaTime) {
                    var g = -9.8;
                    var sy = Math.sgn(particle.position.y);
                    var y = sy * particle.position.y;
                    var scale = Math.pow(Math.min(y / 0.25, 1.0), 0.5);
                    if (particle.position.y > 0.0) {
                        particle.applyAcceleration(Vector2d.xy(0, g * sy * scale));
                    } else {
                        var groundAccel = Vector2d.xy((-0.5 / deltaTime) * particle.velocity.x, 0);
                        if (particle.velocity.y < 0) {
                            var elasticity = 0.8;
                            groundAccel.y = (particle.velocity.y * -(1.0 + elasticity)) / deltaTime;

                            // punish a hard hit with disabled controls
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
                    //console.log ("targetGoSpeed = " + targetGoSpeed.toPrecision (5));
                    // the 0.1 forces the ship to always stay focused forwards - it adds a
                    // missile-like component to the ship behavior, which will also be good
                    // for path-tracking operations
                    //ship.go (targetGo);

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
