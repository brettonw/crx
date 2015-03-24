TestContainer.addGame("Gravity Particle", function (ship) {
        var particle;
        return {
            "setup": function (container) {
                // create the particle
                particle = Manager.addParticle(function () {
                    var r = 0.01, d = 300;
                    return Object.create(Particle).init("Particle", Vector2d.zero(), r, d).
                        makeGeometry(container);
                }());

                // gravity toward the pointer
                Manager.setGravity(function (particle, deltaTime) {
                    var gravityVector = GameKeys.targetPt.subtract(particle.position);
                    particle.applyAcceleration(gravityVector);
                });
            },

            "play": function () {
                // update the particle
                particle.paint();
            },
            "finish": function () { }
        };
    }());
