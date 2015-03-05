var Thing = function () {
    var _ = Object.create(null);

    // define the geometry
    _.geometry = function () {
        var geometry = Object.create(null);

        geometry.density = 3183;

        var computeRadius = function (mass) {
            // m = pi r^2 d
            return Math.sqrt(mass / (Math.PI * geometry.density));
        }

        geometry.points = [
            { "pt": Vector2d.xy(-0.05, 0.05), "radius": computeRadius(1.0) },
            { "pt": Vector2d.zero(), "radius": computeRadius(1.0) },
            { "pt": Vector2d.xy(-0.05, -0.05), "radius": computeRadius(1.0) },
            { "pt": Vector2d.xy(0.10, 0.00), "radius": computeRadius(1.0) }
        ];
        geometry.constraints = [[0, 1], [1, 2], [2, 3], [3, 0], [3, 1]];

        geometry.computeXAxis = function (particles) {
            // the frame of reference is computed as the line between [0,2] and
            // [3,midpoint(0,2)], we might need to do a "polish" step on this in
            // case those lines aren't actually perpendicular in the simulation
            var midpoint = particles[0].position
                .add(particles[2].position)
                .scale(0.5);
            return particles[3].position
                .subtract(midpoint).normalized();
        }

        return geometry;
    }();

    // incorporate the aggregate result of our particle cluster simulation to
    // show the larger object behavior. we include measuring velocities and
    // acceleration of the aggregate object
    _.updateFrameOfReference = function (deltaTime) {
        var particles = this.particles;
        var count = particles.length;
        var geometry = this.geometry;
        var points = geometry.points;

        // the frame of reference sets the position at the centroid of the
        // particle cluster
        var position = Vector2d.zero();
        for (var i = 0; i < count; ++i) {
            position = position.add (particles[i].position);
        };
        position = position.scale(1.0 / count);

        // the velocity is measured as the delta from the last update
        this.velocity = position
            .subtract(this.position)
            .scale(1.0 / deltaTime);
        this.position = position;

        // compute the axis vectors
        var xAxis = geometry.computeXAxis (particles);

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

        // the spin velocity is measured as the delta from the last update
        this.spinVelocity = deltaSpinPosition / deltaTime;
        this.spinPosition = spinPosition;

        // reset the particles to be where they are supposed to be, this is
        // kind of cheating, but it resolves the drift problem that can only
        // be fixed by going to much higher simulation rates
        var yAxis = xAxis.perpendicular();
        for (var i = 0; i < count; ++i) {
            particles[i].position = position
                .add(xAxis.scale(points[i].pt.x))
                .add(yAxis.scale(points[i].pt.y));
        }
    }

    _.reset = function (position, spinPosition) {
        var particles = this.particles;
        var count = particles.length;
        var points = this.geometry.points;

        // reset the particles
        var xAxis = Vector2d.angle(spinPosition);
        var yAxis = xAxis.perpendicular();
        for (var i = 0; i < count; ++i) {
            particles[i].reset(position
                .add(xAxis.scale(points[i].pt.x))
                .add(yAxis.scale(points[i].pt.y))
                );
        }

        // set the initial frame of reference
        this.position = position;
        this.velocity = Vector2d.zero();
        this.spinPosition = spinPosition;
        this.spinVelocity = 0;

        // update the frame of reference
        this.updateFrameOfReference(deltaTime);
    }

    _.init = function (name, position, spinPosition) {
        this.name = name;

        // create the particle list
        this.mass = 0;
        var particles = this.particles = [];
        var geometry = this.geometry;
        var points = geometry.points;
        for (var i = 0, count = points.length; i < count; ++i) {
            var particle = Object.create(Particle).init(name + "-" + i, Vector2d.zero(), points[i].radius, geometry.density);
            this.mass += particle.mass;
            particles.push(Manager.addParticle(particle));
        }

        // create the constraint list
        var constraints = geometry.constraints;
        for (var i = 0, count = constraints.length; i < count; ++i) {
            var a = constraints[i][0];
            var b = constraints[i][1];
            var id_a = particles[a].id;
            var id_b = particles[b].id;
            Manager.addConstraint(id_a, id_b, points[a].pt.subtract(points[b].pt).norm(), 0.5, 2.0);
        }

        // set everything for the first run
        this.reset(position, spinPosition);

        Manager.addThing(this);

        return this;
    }

    _.makeGeometry = function (container) {
        var particles = this.particles;
        var count = particles.length;

        // add the particles so I can see them
        for (var i = 0; i < count; ++i) {
            particles[i].makeGeometry(container);
        }

        // add a ghost of my intended shape
        var pointsDesc = particles[0].position.toString();
        for (var i = 1; i < count; ++i) {
            pointsDesc += " " + particles[i].position.toString();
        }
        this.svg = container.append("polygon")
            .attr("fill", "red")
            .attr("fill-opacity", 0.33)
            .attr("points", pointsDesc);

        // add a line for the velocity vector
        this.svgLine = container.append("line")
            .attr("stroke", "blue")
            .attr("stroke-opacity", 0.33)
            .attr("stroke-width", 2.0 / scale);

        return this;
    };

    _.update = function (deltaTime) {
        // update the frame of reference
        this.updateFrameOfReference(deltaTime);
    }

    _.paint = function () {
        // update the ghost
        this.svg.attr("transform", "translate(" + this.position.x + "," + this.position.y + ") rotate(" + (this.spinPosition * (180.0 / Math.PI)) + ", 0, 0)");

        // update the velocity indicator
        this.svgLine
            .attr("transform", "translate(" + this.position.x + "," + this.position.y + ")")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", this.velocity.x)
            .attr("y2", this.velocity.y);

        // paint the particles so I can see them
        var particles = this.particles;
        for (var i = 0, count = particles.length; i < count; ++i) {
            particles[i].paint();
        }
    }

    return _;
}();
