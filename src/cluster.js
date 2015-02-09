var Cluster = function () {
    var _ = Object.create(null);

    // the points to define the geometry
    var points = [
        Vector2d.xy(-0.05, 0.05),
        Vector2d.xy(-0.05, -0.05),
        Vector2d.xy(0.10, 0.00)
    ];

    // how many polishing steps we want to take to allow the frame of reference
    // to be stabilized after applying forces
    _.subStepCount = 5;

    // incorporate the aggregate result of our particle cluster simulation to
    // show the larger object behavior. we include measuring velocities and
    // acceleration of the aggregate object
    _.updateFrameOfReference = function () {
        var scope = this;
        var particles = this.particles;

        // the frame of reference sets the position at the centroid of the
        // particle cluster
        var position = particles[0].position
            .add(particles[1].position)
            .add(particles[2].position)
            .scale(1.0 / 3.0);
        this.velocity = position
            .subtract(this.position)
            .scale(1.0 / deltaTime);
        this.position = position;

        // the frame of reference is computed as the line between [0,1] and
        // [2,midpoint(0,1)], we might need to do a "polish" step on this in
        // case those lines aren't actually perpendicular in the simulation
        var midpoint = particles[0].position
            .add(particles[1].position)
            .scale(0.5);
        var xAxis = particles[2].position
            .subtract(midpoint).normalized();
        var yAxis = xAxis.perpendicular();

        // the spin position has to be calculated carefully because of the
        // roll over of the coordinate system at pi/-pi, we assume that the
        // sampling rate is sufficient to never see the object rotating faster
        // than pi radians per frame in either direction
        var spinPosition = Math.atan2(xAxis.y, xAxis.x);
        var deltaSpinPosition = spinPosition - this.spinPosition;
    	while (deltaSpinPosition > Math.PI) {
            deltaSpinPosition -= (Math.PI * 2.0);
        }
        while (deltaSpinPosition < -Math.PI) {
            deltaSpinPosition += (Math.PI * 2.0);
        }
        this.spinVelocity = deltaSpinPosition / deltaTime;
        this.spinPosition = spinPosition;

        // reset the particles to be where they are supposed to be, this is
        // kind of cheating, but it resolves the drift problem that can only
        // be fixed by going to much higher simulation rates
        var resetParticle = function (i) {
            particles[i].position = scope.position
                .add(xAxis.scale(points[i].x))
                .add(yAxis.scale(points[i].y));
        }
        resetParticle(0);
        resetParticle(1);
        resetParticle(2);
    }

    _.reset = function (position, spinPosition) {
        var scope = this;

        // reset the particles
        var xAxis = Vector2d.angle(spinPosition);
        var yAxis = xAxis.perpendicular();
        var particle = function (i) {
            scope.particles[i].reset(position
                .add(xAxis.scale(points[i].x))
                .add(yAxis.scale(points[i].y))
                );
        }
        particle(0); particle(1); particle(2);

        // set the initial frame of reference
        this.position = position;
        this.velocity = Vector2d.zero();
        this.spinPosition = spinPosition;
        this.spinVelocity = 0;

        // update the frame of reference
        this.updateFrameOfReference();
    }

    _.init = function (name, position, spinPosition) {
        this.name = name;

        // create the particle list
        var particle = function (i) {
            var r = 0.01, d = 300;
            return Object.create(Particle).init(name + "-" + i, Vector2d.zero (), r, d);
        }
        this.particles = [particle(0), particle(1), particle(2)];
        this.mass = this.particles[0].mass + this.particles[1].mass + this.particles[2].mass;

        // create the constraint list
        var constrain = function (a, b) {
            return { "a": a, "b": b, "d": points[a].subtract(points[b]).norm() };
        }
        this.constraints = [constrain(0, 1), constrain(1, 2), constrain(2, 0)];

        // set everything for the first run
        this.reset(position, spinPosition);

        return this;
    }

    // XXX SERIOUS ISSUE
    // forces and other accumulation operations (like thrust) need to be applied
    // over the full timestep, not just over the sub steps - how to accomplish this...

    _.applyFunction = function (f) {
        f (this.particles[0]);
        f (this.particles[1]);
        f (this.particles[2]);
    }

    _.makeGeometry = function (container) {
        // add the particles so I can see them
        this.particles[0].makeGeometry(container);
        this.particles[1].makeGeometry(container);
        this.particles[2].makeGeometry(container);

        // add a ghost of my intended shape
        var points = this.particles[0].position.toString() + " " +
                     this.particles[1].position.toString() + " " +
                     this.particles[2].position.toString();
        this.svg = container.append("polygon")
            .attr("fill", "red")
            .attr("fill-opacity", 0.33)
            .attr("points", points);

        // add a line for the velocity vector
        this.svgLine = container.append("line")
            .attr("stroke", "blue")
            .attr("stroke-opacity", 0.33)
            .attr("stroke-width", 2.0 / scale);

        return this;
    };

    _.update = function (deltaTime) {
        var scope = this;
        var subStep = function (dT) {
            // resolve the constraints
            var resolveConstraint = function (c) {
                var constraint = scope.constraints[c];
                var a = scope.particles[constraint.a];
                var b = scope.particles[constraint.b];
                var delta = a.position.subtract(b.position);
                var d = delta.normalize();

                // compute the relative velocity damping to apply
                var relativeVelocity = a.velocity.subtract(b.velocity);
                var springVelocity = relativeVelocity.dot(delta);
                var velocityDampingForce = 0.5 * 0.5 * springVelocity * (a.mass + b.mass) / dT;

                // compute a spring force to make d be equal to constraint.d,
                // using Hooke's law
                // XXX this should be relative to dt and mass, I think
                var x = d - constraint.d;
                var k = 1;
                var springForce = k * x;

                // apply the forces
                var F = springForce + velocityDampingForce;
                a.applyForce(delta.scale(-F));
                b.applyForce(delta.scale(F))
            }
            resolveConstraint(0);
            resolveConstraint(1);
            resolveConstraint(2);

            // integrate the particles
            scope.particles[0].update(dT);
            scope.particles[1].update(dT);
            scope.particles[2].update(dT);
        }

        var dT = deltaTime / this.subStepCount;
        for (var i = 0; i < this.subStepCount; ++i) {
            subStep(dT);
        }
    };

    _.paint = function () {
        // update the frame of reference
        this.updateFrameOfReference();

        // update the ghost
        this.svg.attr("transform", "translate(" + this.position.x + "," + this.position.y + ") rotate(" + (this.spinPosition * (180.0 / Math.PI)) + ", 0, 0)");

        // update the velocity indicator
        this.svgLine
            .attr("transform", "translate(" + this.position.x + "," + this.position.y + ")")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", this.velocity.x)
            .attr("y2", this.velocity.y);

        // update the particles
        this.particles[0].paint();
        this.particles[1].paint();
        this.particles[2].paint();
    }

    return _;
}();
