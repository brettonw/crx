let ShipPID = function () {
    let _ = Object.create(Ship);

    if (! ("TWO_PI" in Math)) {
        Math.TWO_PI = Math.PI * 2.0;
    }

    _.init = function (name, position, spinPosition) {
        // do the parental thing
        Object.getPrototypeOf(_).init.call(this, name, Vector2d.zero(), 0);

        this.last = { p: 0.0, i: 0.0 };
        this.gain = { p: 6.0, i: 0.025, d: 40.0 };

        return this;
    };

    _.point = function (direction) {
        let conditionAngle = function (angle) {
            while (angle > Math.PI) {
                angle -= (Math.TWO_PI);
            }
            while (angle < -Math.PI) {
                angle += (Math.TWO_PI);
            }
            return angle;
        };

        let targetPosition = Math.atan2 (direction.y, direction.x);
        let currentPosition = this.spinPosition;
        let p = conditionAngle (targetPosition - currentPosition) / Math.PI;
        let last = this.last;
        let i = last.i + p;
        let d = p - last.p;
        //LOG ("p = " + p.toFixed(4) + ", i = " + i.toFixed(4) + ", d = " + d.toFixed(4));
        this.last = { p: p, i: i };

        let thrustNeeded = (p * this.gain.p) + (i * this.gain.i) + (d * this.gain.d);
        let clampedThrust = Math.clamp(thrustNeeded, -1.0, 1.0);
        this.thrust (-clampedThrust, clampedThrust);

        return Math.abs (p);
    };

    return _;
}();
