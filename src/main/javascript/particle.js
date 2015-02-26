var Particle = function () {
    var _ = Object.create(null);

    _.reset = function (position) {
        this.position = position;
        this.velocity = Vector2d.zero();
        this.force = Vector2d.zero();
    }

    _.init = function (name, position, radius, density) {
        this.name = name;

        // parameters of a physical body in
        this.radius = radius;
        this.mass = Math.PI * radius * radius * density;
        this.reset(position);

        return this;
    }

    _.applyForce = function (force) {
        this.force = this.force.add(force);
    }

    _.applyAcceleration = function (acceleration) {
        var force = acceleration.scale(this.mass);
        this.applyForce(force);
    }

    _.applyDamping = function (damping) {
        // compute force due to damping, this is computed on a frame by frame
        // basis, as opposed to over some time period (like 1 second)
        this.applyAcceleration(this.velocity.scale(damping / deltaTime));
    }

    _.applyFunction = function (f) {
        f (this);
    }

    // geometry is used for bounding the object, for collision detection, for drawing,
    // and for creating the visual representation, computed values assume a homo-
    // genous object with geometry centered (the CG is located at the origin)
    _.makeGeometry = function (container) {
        this.svg = container.append("circle")
            .attr("stroke-width", 2.0 / scale)
            .attr("fill", "red")
            .attr("fill-opacity", "1.0")
            .attr("stroke", "black")
            .attr("stroke-opacity", "1.0")
            .attr("r", this.radius);

        return this;
    };

    // update the particle position and physical state for the specified timestep
    _.update = function (deltaTime) {
        // compute acceleration from the forces, then clear out the forces
        var deltaVelocity = this.force.scale(deltaTime / this.mass);
        this.force = Vector2d.zero();

        // using the midpoint method, compute the position change
        this.position = this.position.add((deltaVelocity.scale(0.5).add(this.velocity)).scale(deltaTime));

        // update the velocity from the delta
        this.velocity = this.velocity.add(deltaVelocity);
    };

    // update the drawing parameters
    _.paint = function () {
        this.svg
            .attr("cx", this.position.x)
            .attr("cy", this.position.y);
    }

    return _;
}();
