TestContainer.addGame("Simple Constraints", function (ship) {
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
                    Manager.addConstraint(id_a, id_b, points[a].subtract(points[b]).norm(), 0.5, 2.0);
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
                    particles[0].applyAcceleration(xAxis.scale(2));
                    particles[1].applyAcceleration(xAxis.scale(-2));
                }
                if (GameKeys.isDown(GameKeys.codes.leftArrow)) {
                    particles[0].applyAcceleration(xAxis.scale(-2));
                    particles[1].applyAcceleration(xAxis.scale(2));
                }
            },
            "finish": function () { }
        };
    }());
