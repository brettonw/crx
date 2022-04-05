TestContainer.addGame("More Constraints", function () {
        let particles;
        let svg;
        return {
            "setup": function (container) {
                let points = [
                    Vector2d.xy(-0.05, 0.05),
                    Vector2d.xy(0, 0),
                    Vector2d.xy(-0.05, -0.05),
                    Vector2d.xy(0.10, 0.00)
                ];

                // create the particle list
                let particle = function (i) {
                    let r = 0.01, d = 300;
                    return Object.create(Particle).init("Point-" + i, points[i], r, d).makeGeometry(container);
                }
                particles = [
                     Manager.addParticle(particle(0)),
                     Manager.addParticle(particle(1)),
                     Manager.addParticle(particle(2)),
                     Manager.addParticle(particle(3)),
                ];

                // create the constraint list
                let constrain = function (a, b) {
                    let id_a = particles[a].id;
                    let id_b = particles[b].id;
                    Manager.addConstraint(id_a, id_b, points[a].subtract(points[b]).norm(), 0.5, 2.0);
                }
                constrain(0, 1); constrain(1, 2); constrain(0, 2); constrain(2, 3); constrain(3, 0); constrain(1, 3);

                // add a ghost of my intended shape
                let ghostPoints = particles[0].position.toString() + " " +
                             particles[1].position.toString() + " " +
                             particles[2].position.toString() + " " +
                             particles[3].position.toString();
                svg = container.append("polygon")
                    .attr("fill", "red")
                    .attr("fill-opacity", 0.33)
                    .attr("points", ghostPoints);
            },

            "play": function () {
                // update the display frame of reference
                let position = particles[0].position
                    .add(particles[1].position)
                    .add(particles[2].position)
                    .add(particles[3].position)
                    .scale(1.0 / particles.length);
                let midpoint = particles[0].position
                    .add(particles[2].position)
                    .scale(0.5);
                let xAxis = particles[3].position
                    .subtract(midpoint).normalized();
                let spinPosition = Math.atan2(xAxis.y, xAxis.x);
                svg.attr("transform", "translate(" + position.x + "," + position.y + ") rotate(" + (spinPosition * (180.0 / Math.PI)) + ", 0, 0)");

                // update the particles
                particles[0].paint();
                particles[1].paint();
                particles[2].paint();
                particles[3].paint();
                if (GameKeys.isDown(GameKeys.codes.rightArrow)) {
                    particles[0].applyAcceleration(xAxis.scale(2));
                    particles[2].applyAcceleration(xAxis.scale(-2));
                }
                if (GameKeys.isDown(GameKeys.codes.leftArrow)) {
                    particles[0].applyAcceleration(xAxis.scale(-2));
                    particles[2].applyAcceleration(xAxis.scale(2));
                }
            },
            "finish": function () { }
        };
    }());
