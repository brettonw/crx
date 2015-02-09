var scale = 1.0;
var deltaTime = 1.0 / 60.0;

var leftkeydown = false;
var upkeydown = false;
var rightkeydown = false;
var downkeydown = false;

function initPage() {
    // add a keypress handler to the body
    var body = document.body;
    body.onkeydown = function (e) {
        if (e.keyCode == 37) leftkeydown = true;
        if (e.keyCode == 38) upkeydown = true;
        if (e.keyCode == 39) rightkeydown = true;
        if (e.keyCode == 40) downkeydown = true;
    }
    body.onkeyup = function (e) {
        if (e.keyCode == 37) leftkeydown = false;
        if (e.keyCode == 38) upkeydown = false;
        if (e.keyCode == 39) rightkeydown = false;
        if (e.keyCode == 40) downkeydown = false;
    }
    var target = d3.select("#display");
    var svg = target.append("svg").attr("class", "gameDisplay");

    // fade the display in
    svg.style("opacity", 1.0e-6)
        .transition().duration(1000)
        .style("opacity", 1.0);

    // add a background object so the base transform handler will always receive
    // the pan and zoom interactions
    svg.append("rect")
        .attr("class", "gameBackground")
        .attr("width", "100%")
        .attr("height", "100%");

    // create a child g element to receive the zoom/pan transformation
    var child = svg.append("g").attr("class", "gameDisplay");
    svg.call (d3.behavior.zoom()
        .translate ([0, 0])
        .scale (1.0)
        .scaleExtent([0.125, 8.0])
        .on("zoom", function() {
            child
                //.transition().duration(100)
                .attr("transform",
                    "translate(" + d3.event.translate[0] + "," +  d3.event.translate[1] + ") " +
                    "scale(" +  d3.event.scale + ")"
                );
        })
    );

    // add a block of text we'll use to display the frame rate
    var fps = svg.append("text")
        .attr("x", 5)
        .attr("y", 20)
        .attr("font-family", "sans-serif")
        .attr("font-size", "20px")
        .attr("fill", "black")
        .text("123");


    // create a child g element to receive the universe transform (invert y and scale the view to [0..1, 0..1])
    svg = child.append("g").attr("class", "gameDisplay");
    var xScale = target[0][0].clientWidth;
    var yScale = target[0][0].clientHeight;
    scale = Math.min (xScale, yScale);
    svg.attr ("transform", "translate(" + (xScale / 2.0) + "," + (yScale / 2.0) + ") scale(" + scale + "," + -scale + ")");

    // set up the svg event handler for mouse moves
    var targetPt = Vector2d.xy(0, 1);
    svg.on("mousemove", function () {
        // extract the click location
        var point = d3.mouse(this);
        targetPt = Vector2d.a(point);
        target
            .attr("cx", targetPt.x)
            .attr("cy", targetPt.y);
        //console.log ("XY (" + targetPt.toString() + ")");
    });

    // create a child g element to contain the world
    svg = svg.append("g").attr("class", "gameDisplay");

    // add a big rectangle to the background of the world so I can get mouse events
    // XXX need to get D3 the fuck out of this so I can actually do smart things
    svg.append("rect")
        .attr("x", -10)
        .attr("y", -2)
        .attr("width", 20)
        .attr("height", 12)
        .attr("fill", "white")
        .attr("fill-opacity", "0.5");

    // add a grid
    var gridLines = [0.0];
    var gridMin;
    var gridMax;
    for (var i = 1; i < 25; ++i) {
        var value = 0.05 * i;
        gridMin = -value;
        gridMax = value
        gridLines = [gridMin].concat (gridLines).concat ([gridMax]);
    }
    svg.selectAll(".xTicks")
        .data(gridLines)
        .enter().append("line").attr("class", "xTicks")
        .attr("x1", function(d) { return d; })
        .attr("y1", gridMin)
        .attr("x2", function(d) { return d; })
        .attr("y2", gridMax)
        .attr("stroke", "rgba(0, 0, 0, 0.20)")
        .attr("stroke-width", 1 / scale);

    svg.selectAll(".yTicks")
        .data(gridLines)
        .enter().append("line").attr("class", "yTicks")
        .attr("x1", gridMin)
        .attr("y1", function(d) { return d; })
        .attr("x2", gridMax)
        .attr("y2", function(d) { return d; })
        .attr("stroke", "rgba(0, 0, 0, 0.20)")
        .attr("stroke-width", 1 / scale);

    // add the target circle
    var target = svg.append("circle")
        .attr("stroke-width", 2.0 / scale)
        .attr("fill", "green")
        .attr("fill-opacity", "1.0")
        .attr("stroke", "black")
        .attr("stroke-opacity", "1.0")
        .attr("r", 0.01);

    var ship = Object.create(Ship).init("Ship 1", Vector2d.zero(), 0).makeGeometry(svg);

    var frameCounter = 0;
    var startTime;
    var gametimer = setInterval(function () {
        // update the clock display
        if (frameCounter++ == 0) {
            startTime = new Date ();
            fps.text ("0 fps");
        } else {
            var now = new Date ();
            var delta = now.valueOf () - startTime.valueOf ();
            var seconds = delta / 1000;
            var frames_per_second = frameCounter / seconds;
            fps.text(frames_per_second.toPrecision(5) + " fps");
        }

        // play the game
        /*
        var leftThrust = 0.0;
        var rightThrust = 0.0;
        if (upkeydown) { leftThrust += 1.0; rightThrust += 1.0; }
        if (downkeydown) { leftThrust += -0.5; rightThrust += -0.5; }
        if (rightkeydown) { leftThrust += 0.5; rightThrust += -0.5; }
        if (leftkeydown) { leftThrust += -0.5; rightThrust += 0.5; }
        leftThrust = Math.max(-1.0, leftThrust); leftThrust = Math.min(1.0, leftThrust);
        rightThrust = Math.max(-1.0, rightThrust); rightThrust = Math.min(1.0, rightThrust);
        ship.thrust (leftThrust, rightThrust);
        */

        if (upkeydown) {
            var targetGo = targetPt.subtract (ship.position);
            //console.log ("targetGoSpeed = " + targetGoSpeed.toPrecision (5));
            // the 0.1 forces the ship to always stay focused forwards - it adds a
            // missile-like component to the ship behavior, which will also be good
            // for path-tracking operations
            ship.go (targetGo);
        } else if (downkeydown) {
            ship.applyFunction (function (particle) {
                particle.applyDamping(-0.5);
            });
        } else {
            ship.stop ();
        }

        // gravity
        if (false) {
            ship.applyFunction (function (particle) {
                if (particle.position.y > 0.5) {
                    particle.applyAcceleration(Vector2d.xy(0, -9.8));
                } else if (particle.position.y > 0.0) {
                    var scale = 0.5 - particle.position.y;
                    particle.applyAcceleration(Vector2d.xy(0, -9.8 * scale));
                    particle.applyDamping(-scale);
                } else {
                    particle.applyAcceleration(Vector2d.xy(0, -5.0 * particle.position.y));
                    particle.applyDamping(-0.5);
                }
            });
        }
        ship.update(deltaTime);
        ship.paint();
    }, 1000 * deltaTime);

    // need a pause time button
}

