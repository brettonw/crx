var Manager = function () {
    var _ = Object.create(null);

    var particles = [];
    var nextParticle = 0;

    _.addParticle = function (particle) {
        var id = nextParticle++;
        particles.push(particle);
        return id;
    }

    _.removeParticle = function (id) {
        // we don't want to change the id of other objects, but we want to 
        // remove this particle from the store - this is not the classic 
        // javascript way to remove an element from an array
        delete particles[id];
    }

    var constraints = [];
    var nextConstraint = 0;

    _.addConstraint = function (a, b) {
        var id = nextConstraint++;
        var constraint = {
            "a": a,
            "b": b,
            "d": particles[a].position.subtract(particles[b].position).norm()
        }
        constraints.push(constraint);
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

    _.step = function (deltaTime) {
        // update all the particles
        for (particle in particles) {
            particle.update(deltaTime);
        }

        // update all the constraints
        for (constraint in constraints) {
            var a = particles[constraint.a];
            var b = particles[constraint.b];
            var delta = a.position.subtract(b.position);
            var d = delta.normalize();

            // compute the relative velocity damping to apply, the goal 
            // here is to halt all relative motion between the particles
            var relativeVelocity = a.velocity.subtract(b.velocity);
            var springVelocity = relativeVelocity.dot(delta);
            var totalMass = a.mass + b.mass;
            var velocityDampingForceA = 0.5 * (a.mass / totalMass) * springVelocity * totalMass / dT;
            var velocityDampingForceB = 0.5 * (b.mass / totalMass) * springVelocity * totalMass / dT;

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
        }
    }

    _.paint = function () {
        // paint all the things
        for (thing in things) {
            thing.paint();
        }
    }

    return _;
}();