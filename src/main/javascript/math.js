Math.sgn = function (value) {
    return (value < 0.0) ? -1.0 : ((value > 0.0) ? 1.0 : 0.0);
}

Math.clamp = function (value, min, max) {
    return Math.max(Math.min(value, max), min);
}
