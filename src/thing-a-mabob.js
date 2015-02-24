var Thing = function () {
    var _ = Object.create(Particle);

    _.init = function (name, position, spinPosition) {
        // do the parental thing
        Object.getPrototypeOf(Thing).init.call(this, name, position, 1.0, 1.0);

        // rotational parameters of a physical body in 2 dimensions, e.g. it can only
        // rotate around an axis that is perpendicular to the 2D plane
        this.spinMass = this.mass;
        this.spinPosition = spinPosition;
        this.spinVelocity = 0.0;
        this.spinForce = 0.0;

        return this;
    }

    _.applySpinForce = function (spinForce) {
        this.spinForce += spinForce;
    }

    _.applySpinAcceleration = function (spinAcceleration) {
        var spinForce = spinAcceleration * this.spinMass;
        this.applySpinForce(spinForce);
    }

    _.applySpinDamping = function (spinDamping) {
        // compute force due to damping, this is computed on a frame by frame
        // basis, as opposed to over some time period (like 1 second)
        this.applySpinAcceleration(this.spinVelocity * spinDamping / deltaTime);

    }

    _.makeGeometry = function (container) {
        var geometry = [
            Vector2d.xy(0.00, 0.00),
            Vector2d.xy(-0.05, 0.05),
            Vector2d.xy(0.10, 0.00),
            Vector2d.xy(-0.05, -0.05)
        ];
        var points = geometry[0].toString ();
        for (var i = 1; i < geometry.length; ++i) {
            points += " " + geometry[i].toString ();
        }
        this.svg = container.append("polygon")
        .attr("stroke-width", 2.0 / scale)
        .attr("fill", "red")
        .attr("fill-opacity", "1.0")
        .attr("stroke", "black")
        .attr("stroke-opacity", "1.0")
        .attr("stroke-linejoin", "round")
        .attr("points", points);

        return this;
    };

    _.update = function (deltaTime) {
        // do the parental thing
        Object.getPrototypeOf(Thing).update.call(this);

        // compute acceleration from the force, then clear out the force
        var deltaSpinVelocity = this.spinForce * (deltaTime / this.spinMass);
        this.spinForce = 0.0;

        // using the midpoint method, compute the position change
        this.spinPosition = this.spinPosition + (((deltaSpinVelocity * 0.5) + this.spinVelocity) * deltaTime);

        // update the velocity from the delta
        this.spinVelocity = this.spinVelocity + deltaSpinVelocity;

        // keep the spin position in a math friendly range
        var TWO_PI = Math.PI * 2;
        while (this.spinPosition >= TWO_PI)
            this.spinPosition -= TWO_PI;
        while (this.spinPosition < 0)
            this.spinPosition += TWO_PI;
    };

    _.paint = function () {
        this.svg.attr("transform", "translate(" + this.position.x + "," + this.position.y + ") rotate(" + (this.spinPosition * (180.0 / Math.PI)) + ", 0, 0)");
    }

    return _;
}();
