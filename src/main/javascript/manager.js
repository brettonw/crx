let Manager = function () {
    let _ = Object.create(null);

    let particles = [];
    let nextParticle = 0;

    // parameters for the constraint solver
    let maxIterations = 50;
    let stiffness = 0.95;
    let maxConstraintError = 1.0e-5;

    _.addParticle = function (particle) {
        let id = nextParticle++;
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

    let constraints = [];
    let nextConstraint = 0;

    _.addConstraint = function (a, b, length, damping, k) {
        let id = nextConstraint++;
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

    let things = [];
    let nextThing = 0;

    _.addThing = function (thing) {
        let id = nextThing++;
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
        let i = 0;
        let averageError = 0;
        do {
            i++;
            let totalError = 0;
            constraints.forEach (function (constraint, index, array) {
                let a = particles[constraint.a];
                let b = particles[constraint.b];
                let delta = a.position.subtract (b.position);
                let deltaLength = constraint.length - delta.normalize ();
                totalError += Math.abs(deltaLength / constraint.length);

                // for Verlet (position-based) integration, we simply move the particles to where they
                // should be according to the constraint and the relative mass of the two particles. the
                // state information contained in the particles maintains basic laws, conservation of
                // momentum, etc.
                let totalMass = a.mass + b.mass;
                a.position = a.position.add (delta.scale (stiffness * deltaLength * (a.mass / totalMass)));
                b.position = b.position.add (delta.scale (-stiffness * deltaLength * (b.mass / totalMass)));
            });
            averageError = totalError / constraints.length;
            //LOG("Iteration: " + i + ", Avg. Error: " + averageError.toFixed(5));
        } while ((i < maxIterations) && (averageError > maxConstraintError));
        LOG ("Iteration: " + i + ", Avg. Error: " + averageError.toFixed(5));
    }

    _.updateThings = function (deltaTime) {
        things.forEach(function (thing, index, array) {
            thing.update(deltaTime);
        });
    }

    // gravity, if present, is just a function that gets applied to all
    // particles every update
    let gravity = null;

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
        for (let i = 0; i < subStepCount; ++i) {
            this.applyGravity(subDeltaTime);
            this.updateParticles(subDeltaTime);
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
