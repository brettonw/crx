let GameContainer = function () {
    let _ = Object.create(Container);

    _.addGame ("Play with Gravity", function () {
        // the ship we want to play the game with
        let ship;
        return {
            "setup": function (container) {
                // create the ships before we implement gravity so they learn 
                // their capabilities in a vaccuum
                ship = Object.create(Ship).init("Player 1", Vector2d.zero(), 0).makeGeometry(container);

                // gravity
                Manager.setGravity(function (particle, deltaTime) {
                    if (particle.position.y > 0.0) {
                        let scale = Math.pow(Math.min(particle.position.y / 0.25, 1.0), 0.5);
                        particle.applyAcceleration(Vector2d.xy(0, Constants.G * scale));
                    } else {
                        // in verlet integration (position-based), we just need to set the particle
                        // to be where it should be, this action will conserve momentum. we do this
                        // by projecting the position back along the velocity vector
                        // XXX it might be nice to account for a little bit of friction

                        // punish a hard hit with disabled controls
                        if (particle.velocity.y < -1) {
                            ship.stun (3);
                        }
                        if (particle.lastPosition.y > 1.0e-2) {
                            particle.position = particle.lastPosition.add (particle.velocity.scale (particle.position.y / particle.velocity.y));
                        } else {
                            particle.position.x = particle.lastPosition.x;
                            particle.position.y = particle.position.y / 2;
                        }

                    }
                });
            },

            "play": function () {
                let deltaSpinPosition = ship.pointAt(GameKeys.targetPt);
                if (GameKeys.isDown(GameKeys.codes.upArrow)) {
                    let targetGo = GameKeys.targetPt.subtract(ship.position);
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
