var Ship = function () {
    var _ = Object.create(Thing);

    _.init = function (name, position, spinPosition) {
        // do the parental thing
        Object.getPrototypeOf(_).init.call(this, name, Vector2d.zero(), 0);

        // the ship should not be stunned to start
        this.stunnedTime = 0;

        // two engines capable of overcoming gravity applied to three
        // particle masses g * 3 / 2... = 14.75
        this.thrustRatio = 15;

        this.learn ();
        this.reset (position, spinPosition);

        return this;
    }

    _.learn = function () {
        this.reset(Vector2d.zero(), 0);
        var spinVelocity = this.spinVelocity;
        var accumulator = 0;
        var accumulatorCount = 0;
        var scope = this;
        var report = function () {
            var stabilizationFrames = 5;
            for (var i = 0; i < stabilizationFrames; ++i) {
                Manager.update();
            }
            var spinAcceleration = Math.abs(scope.spinVelocity - spinVelocity) / (deltaTime * stabilizationFrames);
            spinVelocity = scope.spinVelocity;
            console.log("Spin Velocity: " + spinVelocity.toPrecision(5) + ", Spin Acceleration: " + spinAcceleration.toPrecision(5) + "/sec");
            accumulator += spinAcceleration;
            ++accumulatorCount;
            return spinAcceleration;
        }

        this.thrust(-1, 1);
        report();

        this.thrust(-1, 1);
        report();

        this.thrust(1, -1);
        report();

        this.spinAcceleration = accumulator / accumulatorCount;
        console.log("Spin Acceleration: " + this.spinAcceleration);
    }

    _.thrust = function (left, right) {
        // don't do anything if the ship is stunned
        if (this.stunnedTime <= 0) {
            // thrusts will be applied at the beginning of each time step, treated
            // as a pulse value
            var thrustScaling = this.thrustRatio * subStepCount;

            var orientationVector = Vector2d.angle(this.spinPosition);
            var leftThrustVector = orientationVector.scale(thrustScaling * left);
            var rightThrustVector = orientationVector.scale(thrustScaling * right);

            // engines are assumed to be (left) particle 0, and (right) particle 1
            this.particles[0].applyAcceleration(leftThrustVector);
            this.particles[1].applyAcceleration(rightThrustVector);
        }
    }

    _.point = function (direction) {
        // compute the angle delta
        var targetSpinPosition = Math.atan2 (direction.y, direction.x);
        var deltaSpinPosition = targetSpinPosition - this.spinPosition
    	while (deltaSpinPosition > Math.PI) {
            deltaSpinPosition -= (Math.PI * 2.0);
        }
        while (deltaSpinPosition < -Math.PI) {
            deltaSpinPosition += (Math.PI * 2.0);
        }
        var deltaSpinPositionMagnitude = Math.abs (deltaSpinPosition);

        // compute the desired change in rotational velocity, and the thrust
        // associated with that, then apply it
        var timeToTargetSpinPosition = 0.15 * (1 + deltaSpinPositionMagnitude);
        var velocityToTargetSpinPosition = (deltaSpinPosition / timeToTargetSpinPosition);
        var deltaVelocityNeeded = velocityToTargetSpinPosition - this.spinVelocity;
        var thrustNeeded = deltaVelocityNeeded / (this.spinAcceleration * 0.5); // conservative
        var clampedThrust = Math.min(Math.max(thrustNeeded, -1.0), 1.0);
        this.thrust (-clampedThrust, clampedThrust);
        //console.log ("thrust: " + clampedThrust);

        // return how close the ship is to pointing in the right direction
        return deltaSpinPositionMagnitude;
    }

    _.pointAt = function (point) {
        var direction = point.subtract (this.position).normalized ();
        this.point (direction);
    }

    var shipGo = function (ship, targetVelocity, clamp, fudgeFactor, precisionExponent) {
        // compute the frame for calculations, our target speed is fudged to
        // allow for latency in the control system, i.e. having to turn around
        // to decelerate
        var speed = targetVelocity.norm () * fudgeFactor;
        //console.log ("Go speed = " + speed.toPrecision (5));
        var axis = (speed > 0) ?
            targetVelocity.scale (1.0 / speed) :
            (ship.velocity.normSq () > 0 ?
                ship.velocity.normalized () :
                Vector2d.angle (ship.spinPosition));
        var perp = axis.perpendicular ();

        // compute the velocity corrections needed, including a clamped axis
        // component (affects how the ship slows down), and a doubled perp
        // component to help catch the target vector quicker
        var axisComponent = Math.max (clamp, speed - (axis.dot (ship.velocity)));
        var perpComponent = 2.0 * perp.dot (ship.velocity);

        // check to see if there's actually any work to do
        if ((Math.abs(axisComponent) > 0.001) || (Math.abs(perpComponent) > 0.001)) {
            // compute the target point direction and try to point there
            var pointDirection = axis.scale (axisComponent).add (perp.scale (-perpComponent));
            var deltaSpinPosition = ship.point (pointDirection);

            // if we are pointing the right way (within a few degrees), let's go...
            var thrustLevel = 1.0 - (deltaSpinPosition / (Math.PI * 0.5));
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
        var targetVelocity = targetPoint.subtract (this.position);
        shipGo (this, targetVelocity, -1.0e3, 0.99, 6.0);
    }

    _.stop = function () {
        shipGo (this, Vector2d.zero (), -1.0e3, 1.0, 5.0);
    }

    _.stun = function (stunnedTime) {
        this.stunnedTime = Math.max(this.stunnedTime, stunnedTime);
        //console.log ("stunnedTime: " + stunnedTime);
    }

    _.update = function (deltaTime) {
        // do the parental thing
        Object.getPrototypeOf(_).update.call(this, deltaTime);

        // reduce the stunned time remaining
        this.stunnedTime -= deltaTime;
    }

    return _;
}();
