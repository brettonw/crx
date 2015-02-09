var Vector2d = function () {
    var _ = Object.create(null);

    var makeVector = function (x, y) {
        var vector = Object.create(_);
        vector.x = x;
        vector.y = y;
        return vector;
    };

    // constructors
    _.a = function (a) { return makeVector(a[0], a[1]); };
    _.xy = function (x, y) { return makeVector(x, y); };
    _.v = function (v) { return makeVector(v.x, v.y); };
    _.angle = function (a) { return makeVector(Math.cos(a), Math.sin(a)); };

    _.zero = function () { return makeVector(0, 0); };
    _.one = function () { return makeVector(1, 1); };

    // operators
    _.add = function (b) { return makeVector(this.x + b.x, this.y + b.y); };
    _.subtract = function (b) { return makeVector(this.x - b.x, this.y - b.y); };
    _.scale = function (b) { return makeVector(this.x * b, this.y * b); };
    _.dot = function (b) { return (this.x * b.x) + (this.y * b.y); };
    _.cross = function (b) { return (this.x * b.y) - (this.y * b.x); };

    // length related methods
    _.normSq = function () { return this.dot(this); };
    _.norm = function () { return Math.sqrt(this.normSq()); };
    _.normalize = function () { var norm = this.norm (); this.copy (this.scale(1.0 / norm)); return norm; }
    _.normalized = function () { return this.scale(1.0 / this.norm()); }

    // frame related methods
    _.perpendicular = function () { return makeVector(-this.y, this.x); }
    _.reflect = function (v, n) {
    //	return v - (n * (R(2.0) * (v | n))); //	return the computed vector
        return v.subtract (n.scale (v.dot(n) * 2.0));
    }

    // utility methods
    _.toString = function () { return this.x + "," + this.y; }
    _.copy = function (v) { this.x = v.x; this.y = v.y; }

    return _;
}();
