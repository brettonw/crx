let Ship = function () {
    let _ = Object.create(Thing);

    _.init = function (name, position, spinPosition) {
        // do the parental thing
        Object.getPrototypeOf(_).init.call(this, name, Vector2d.zero(), 0);

        // the ship should not be stunned to start
        this.stunnedTime = 0;

        // two engines capable of overcoming gravity applied to the particles 
        // making up the ship, want 110% of gravity
        // particle masses g * 5 / 2... = ...
        totalMass = 0;
        for (i = 0; i < this.particles.length; ++i) {
            totalMass += this.particles[i].mass;
        }
        this.thrustRatio = 1.9 * (totalMass * -Constants.G);
        // XXX I think this needs some work

        this.learn ();
        this.reset (position, spinPosition);

        return this;
    };

    _.learn = function () {
        this.reset(Vector2d.zero(), 0);
        let spinVelocity = this.spinVelocity;
        let accumulator = 0;
        let accumulatorCount = 0;
        let scope = this;
        let report = function () {
            let stabilizationFrames = 5;
            for (let i = 0; i < stabilizationFrames; ++i) {
                Manager.update();
            }
            let spinAcceleration = Math.abs(scope.spinVelocity - spinVelocity) / (deltaTime * stabilizationFrames);
            spinVelocity = scope.spinVelocity;
            LOG("Spin Velocity: " + spinVelocity.toPrecision(5) + ", Spin Acceleration: " + spinAcceleration.toPrecision(5) + "/sec");
            accumulator += spinAcceleration;
            ++accumulatorCount;
            return spinAcceleration;
        };

        this.thrust(-1, 1);
        report();

        this.thrust(-1, 1);
        report();

        this.thrust(-1, 1);
        report();

        this.thrust(1, -1);
        report();

        this.thrust(1, -1);
        report();

        this.thrust(1, -1);
        report();

        this.spinAcceleration = accumulator / accumulatorCount;
        LOG("Spin Acceleration: " + this.spinAcceleration);
    };

    _.thrust = function (left, right) {
        // don't do anything if the ship is stunned
        if (this.stunnedTime <= 0) {
            // thrusts will be applied at the beginning of each time step, treated
            // as a pulse value
            //let thrustScaling = this.thrustRatio * subStepCount;
            let thrustScaling = this.thrustRatio;

            let orientationVector = Vector2d.angle(this.spinPosition);
            let leftThrustVector = orientationVector.scale(thrustScaling * left);
            let rightThrustVector = orientationVector.scale(thrustScaling * right);

            // engines are assumed to be (left) particle 0, and (right) particle 2
            this.particles[0].applyAcceleration(leftThrustVector);
            this.particles[2].applyAcceleration(rightThrustVector);
        }
    };

    _.point = function (direction) {
        // compute the angle delta
        let targetSpinPosition = Math.atan2 (direction.y, direction.x);
        let deltaSpinPosition = targetSpinPosition - this.spinPosition
    	while (deltaSpinPosition > Math.PI) {
            deltaSpinPosition -= (Math.PI * 2.0);
        }
        while (deltaSpinPosition < -Math.PI) {
            deltaSpinPosition += (Math.PI * 2.0);
        }
        let deltaSpinPositionMagnitude = Math.abs (deltaSpinPosition);

        // just an empirical rate, this should probably come from a parameter
        // to the ship: max rotational velocity (radians/sec)
        let maxRotationVelocity = Math.PI * 2.0;
        let timeFactor = 1.0 / maxRotationVelocity;
        let timeToTargetSpinPosition = timeFactor * (1 + deltaSpinPositionMagnitude);
        let velocityToTargetSpinPosition = (deltaSpinPosition / timeToTargetSpinPosition);
        let deltaVelocityNeeded = velocityToTargetSpinPosition - this.spinVelocity;
        let thrustNeeded = deltaVelocityNeeded / (this.spinAcceleration * 0.5);
        let clampedThrust = Math.clamp(thrustNeeded, -1.0, 1.0);
        this.thrust (-clampedThrust, clampedThrust);

        // return how close the ship is to pointing in the right direction
        return deltaSpinPositionMagnitude;
    };

    _.pointAt = function (point) {
        let direction = point.subtract (this.position).normalized ();
        this.point (direction);
    };

    let shipGo = function (ship, targetVelocity, clamp, fudgeFactor, precisionExponent) {
        // compute the frame for calculations, our target speed is fudged to
        // allow for latency in the control system, i.e. having to turn around
        // to decelerate
        let speed = targetVelocity.norm () * fudgeFactor;
        //LOG ("Go speed = " + speed.toPrecision (5));
        let axis = (speed > 0) ?
            targetVelocity.scale (1.0 / speed) :
            (ship.velocity.normSq () > 0 ?
                ship.velocity.normalized () :
                Vector2d.angle (ship.spinPosition));
        let perp = axis.perpendicular ();

        // compute the velocity corrections needed, including a clamped axis
        // component (affects how the ship slows down), and a perpendicular
        // component doubled to catch the target vector
        let axisComponent = Math.max (clamp, speed - (axis.dot (ship.velocity)));
        let perpComponent = 2.0 * perp.dot (ship.velocity);

        // check to see if there's actually any work to do
        if ((Math.abs(axisComponent) > 0.001) || (Math.abs(perpComponent) > 0.001)) {
            // compute the target point direction and try to point there
            let pointDirection = axis.scale (axisComponent).add (perp.scale (-perpComponent));
            let deltaSpinPosition = ship.point (pointDirection);

            // if we are pointing the right way (within a few degrees), let's go...
            let thrustLevel = 1.0 - (deltaSpinPosition / (Math.PI * 60.0 / 180.0));
            if (thrustLevel > 0) {
                // we exponentiate the thrust level to increase the accuracy of
                // thrusting along the correcting vector, but the discrete nature of
                // time in this simulation and our general error tolerance means we
                // don't want to be too precise.
                thrustLevel = Math.pow (thrustLevel, precisionExponent);
                ship.thrust (thrustLevel, thrustLevel);
            }
        } else {
            ship.point (axis);
        }
    }

    _.go = function (targetVelocity) {
        shipGo (this, targetVelocity, 0.0, 1.0, 2.0);
    }

    _.goTo = function (targetPoint) {
        let targetVelocity = targetPoint.subtract (this.position);
        shipGo (this, targetVelocity, -1.0e3, 0.99, 2.0);
    }

    _.stop = function () {
        shipGo (this, Vector2d.zero (), -1.0e3, 1.0, 10.0);
    }

    _.stun = function (stunnedTime) {
        this.stunnedTime = Math.max(this.stunnedTime, stunnedTime);
        //LOG ("stunnedTime: " + stunnedTime);
    }

    _.update = function (deltaTime) {
        // do the parental thing
        Object.getPrototypeOf(_).update.call(this, deltaTime);

        // reduce the stunned time remaining
        this.stunnedTime -= deltaTime;
    }

    return _;
}();
