let Particle = function () {
    let _ = Object.create(null);

    _.reset = function (position) {
        this.position = position;
        this.lastPosition = position;
        this.lastDeltaTime = 1.0e-3;
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
        let force = acceleration.scale(this.mass);
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
        // use Verlet integration (position-based dynamics) to compute the next position
        // pos = pos + (pos - lastPos) + (accel * deltaTime^2)

        // compute the velocity term, scaled to account for changes in the deltaTime value
        let velocityTerm = this.position.subtract (this.lastPosition).scale (deltaTime / this.lastDeltaTime);

        // compute the acceleration term from the accumulated forces, and then clear them out so we
        // don't keep applying them
        let accelerationTerm = this.force.scale (deltaTime * deltaTime / this.mass);
        this.force = Vector2d.zero();

        // compute the deltaPosition and add it to the position
        let deltaPosition = velocityTerm.add (accelerationTerm);
        let nextPosition = this.position.add (deltaPosition);

        // update the velocity vector for giggles
        this.velocity = deltaPosition.scale (1.0 / deltaTime);

        // save the position for the next iteration
        this.lastDeltaTime = deltaTime;
        this.lastPosition = this.position;
        this.position = nextPosition;
    };

    // update the drawing parameters
    _.paint = function () {
        this.svg
            .attr("cx", this.position.x)
            .attr("cy", this.position.y);
    }

    return _;
}();
