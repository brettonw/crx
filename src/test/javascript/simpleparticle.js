TestContainer.addGame("Simple Particle", function () {
        let particle;
        return {
            "setup": function (container) {
                // create the particle
                particle = Manager.addParticle(function () {
                    let r = 0.01, d = 300;
                    return Object.create(Particle).init("Particle", Vector2d.zero(), r, d).
                        makeGeometry(container);
                }());
            },

            "play": function () {
                // update the particle
                particle.paint();

                // do something to the particle to move it around
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
