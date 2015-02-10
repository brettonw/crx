var Game = function () {
    var _ = Object.create(null);

    _.playWithGravity = function (ship) {
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

        // gravity
        ship.applyFunction(function (particle) {
            var sgn = function (value) {
                return (value < 0.0) ? -1.0 : ((value > 0.0) ? 1.0 : 0.0);
            }
            var g = -9.8 * Cluster.getSubStepCount();
            var sy = sgn(particle.position.y);
            var y = sy * particle.position.y;
            var scale = Math.pow(Math.min(y / 0.25, 1.0), 2.0);
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
                particle.applyAcceleration(groundAccel.scale(Cluster.getSubStepCount()));
                particle.position.y = 0.0;
            }
        });
    }
    return _;
}();
