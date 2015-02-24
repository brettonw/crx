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

    _.addConstraint = function (a, b, d) {
        var id = nextConstraint++;
        constraints.push({ "a": a, "b": b, "d": d });
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
            var d = delta.normalize();

            // compute the relative velocity damping to apply, the goal 
            // here is to halt all relative motion between the particles
            var relativeVelocity = a.velocity.subtract(b.velocity);
            var springVelocity = relativeVelocity.dot(delta);
            var totalMass = a.mass + b.mass;
            var velocityDampingForceA = 0.5 * (a.mass / totalMass) * springVelocity * totalMass / deltaTime;
            var velocityDampingForceB = 0.5 * (b.mass / totalMass) * springVelocity * totalMass / deltaTime;

            // compute a spring force to make d be equal to constraint.d,
            // using Hooke's law
            var x = d - constraint.d;
            var k = 1;
            var springForce = k * x;

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