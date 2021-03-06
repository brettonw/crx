var Manager = function () {
    var _ = Object.create(null);

    var particles = [];
    var nextParticle = 0;

    _.addParticle = function (particle) {
        var id = nextParticle++;
        particles.push(particle);
        particle.id = id;
        return particle;
    }

    _.removeParticle = function (id) {
        // we don't want to change the id of other objects, but we want to
        // remove this particle from the store - this is not the classic
        // javascript way to remove an element from an array
        delete particles[id];
    }

    var constraints = [];
    var nextConstraint = 0;

    _.addConstraint = function (a, b, length, damping, k) {
        var id = nextConstraint++;
        // good defaults, damping: 0.5, k: 2.0
        constraints.push({ "a": a, "b": b, "length": length, "damping": damping, "k":k });
        return id;
    }

    _.removeConstraint = function (id) {
        // we don't want to change the id of other objects, but we want to
        // remove this constraint from the store - this is not the classic
        // javascript way to remove an element from an array
        delete constraints[id];
    }

    var things = []
    var nextThing = 0;

    _.addThing = function (thing) {
        var id = nextThing++;
        things.push(thing);
        return id;
    }

    _.removeThing = function (id) {
        // we don't want to change the id of other objects, but we want to
        // remove this thing from the store - this is not the classic
        // javascript way to remove an element from an array
        delete things[id];
    }

    _.updateParticles = function (deltaTime) {
        // update all the particles
        particles.forEach(function (particle, index, array) {
            particle.update(deltaTime);
        });

        // update all the constraints
        constraints.forEach(function (constraint, index, array) {
            var a = particles[constraint.a];
            var b = particles[constraint.b];
            var delta = a.position.subtract(b.position);
            var length = delta.normalize();

            // compute the relative velocity damping to apply, the goal
            // here is to halt all relative motion between the particles
            var relativeVelocity = a.velocity.subtract(b.velocity);
            var springVelocity = relativeVelocity.dot(delta);
            var totalMass = a.mass + b.mass;
            var velocityDampingForceA = constraint.damping * (a.mass / totalMass) * springVelocity * totalMass / deltaTime;
            var velocityDampingForceB = constraint.damping * (b.mass / totalMass) * springVelocity * totalMass / deltaTime;

            // compute a spring force to make length be equal to constraint.length,
            // using Hooke's law, 2.0 seems to work well
            var springForce = constraint.k * (length - constraint.length);

            // apply the forces
            var FA = springForce + velocityDampingForceA;
            var FB = springForce + velocityDampingForceB;
            a.applyForce(delta.scale(-FA));
            b.applyForce(delta.scale(FB))
        });
    }

    _.updateThings = function (deltaTime) {
        things.forEach(function (thing, index, array) {
            thing.update(deltaTime);
        });
    }

    // gravity, if present, is just a function that gets applied to all
    // particles every update
    var gravity = null;

    _.setGravity = function (g) {
        gravity = g;
    }

    _.applyGravity = function (deltaTime) {
        if (gravity !== null) {
            particles.forEach(function (particle, index, array) {
                gravity(particle, deltaTime);
            });
        }
    }

    // a standard update, separate from painting
    _.update = function () {
        for (var i = 0; i < subStepCount; ++i) {
            this.updateParticles(subDeltaTime);
            this.applyGravity(subDeltaTime);
        }
        this.updateThings(deltaTime);
    }

    _.paint = function () {
        // paint all the things
        things.forEach(function (thing, index, array) {
            thing.paint();
        });
    }

    return _;
}();
