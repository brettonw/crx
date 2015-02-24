var scale = 1.0;
var deltaTime = 1.0 / 60.0;
var subStepCount = 4;
var subDeltaTime = deltaTime / subStepCount;

function preInitGame(gameObject) {
    // get the game functions list, sorted alphabetically
    var gameFunctionNames = [];
    for (var gameFunctionName in gameObject) {
        gameFunctionNames.push (gameFunctionName);
    }
    gameFunctionNames.sort ();

    // display a list...
    if (gameFunctionNames.length > 1) {
        var gameList = document.createElement ("div");
        gameList.className = "gameList";
        gameList.id = "gameList";
        for (var i = 0; i < gameFunctionNames.length; ++i) {
            var link = document.createElement ("div");
            link.innerHTML=gameFunctionNames[i];
            link.onclick = function () {
                this.parentNode.parentNode.removeChild (this.parentNode);
                initGame (gameObject[this.innerHTML]);
            };
            gameList.appendChild (link);
        }
        var display = document.getElementById ("display");
        display.appendChild (gameList);
    } else {
        initGame (gameObject[gameFunctionNames[0]]);
    }
}

function initGame(gameFunction) {
    // add a keypress handler to the body
    GameKeys.init();

    // almost all of this is d3 crap that I want to get rid of and replace with
    // straight SVG...

    var target = d3.select("#display");
    var svg = target.append("svg").attr("class", "gameDisplay");

    // add a background object so the base transform handler will always receive
    // the pan and zoom interactions
    svg.append("rect")
        .attr("class", "gameBackground")
        .attr("width", "100%")
        .attr("height", "100%");

    // create a child g element to receive the zoom/pan transformation
    var child = svg.append("g").attr("class", "gameDisplay");
    svg.call(d3.behavior.zoom()
        .translate([0, 0])
        .scale(1.0)
        .scaleExtent([0.125, 8.0])
        .on("zoom", function () {

            child
                //.transition().duration(100)
                .attr("transform",
                    "translate(" + d3.event.translate[0] + "," + d3.event.translate[1] + ") " +
                    "scale(" + d3.event.scale + ")"
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
    scale = Math.min(xScale, yScale);
    svg.attr("transform", "translate(" + (xScale / 2.0) + "," + (yScale / 2.0) + ") scale(" + scale + "," + -scale + ")");

    // set up the svg event handler for mouse moves
    GameKeys.targetPt = Vector2d.xy(0, 1);
    svg.on("mousemove", function () {
        // extract the click location
        var point = d3.mouse(this);
        GameKeys.targetPt = Vector2d.a(point);
        mouse
            .attr("cx", GameKeys.targetPt.x)
            .attr("cy", GameKeys.targetPt.y);
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
    var gridMin = -5.0;
    var gridMax = 5.0;

    svg.selectAll(".xTicks")
        .data(gridLines)
        .enter().append("line").attr("class", "xTicks")
        .attr("x1", function (d) { return d; })
        .attr("y1", gridMin)
        .attr("x2", function (d) { return d; })
        .attr("y2", gridMax)
        .attr("stroke", "rgba(0, 0, 0, 0.20)")
        .attr("stroke-width", 1 / scale);

    svg.selectAll(".yTicks")
        .data(gridLines)
        .enter().append("line").attr("class", "yTicks")
        .attr("x1", gridMin)
        .attr("y1", function (d) { return d; })
        .attr("x2", gridMax)
        .attr("y2", function (d) { return d; })
        .attr("stroke", "rgba(0, 0, 0, 0.20)")
        .attr("stroke-width", 1 / scale);

    // add the mouse circle
    var mouse = svg.append("circle")
        .attr("stroke-width", 2.0 / scale)
        .attr("fill", "green")
        .attr("fill-opacity", "1.0")
        .attr("stroke", "black")
        .attr("stroke-opacity", "1.0")
        .attr("r", 0.01);

    // create the ship, it adds itself to the manager
    var ship = Object.create(Ship).init("Ship 1", Vector2d.zero(), 0);
    Manager.makeGeometry(svg);

    // track and average the frame rate over the last n frames
    var frameCount = 30;
    var frameTimes = Array.apply(null, new Array(frameCount)).map(Number.prototype.valueOf,0);
    var frameIndex = 0;
    var frameSum = 0;
    var lastTime = new Date().valueOf ();
    var gametimer = setInterval(function () {
        // update the clock display
        var nowTime = new Date().valueOf();
        frameSum -= frameTimes[frameIndex];
        frameTimes[frameIndex] = nowTime - lastTime;
        frameSum += frameTimes[frameIndex];
        frameIndex = (frameIndex + 1) % frameCount;
        lastTime = nowTime;
        var frameRate = frameCount / (frameSum / 1000);
        fps.text(frameRate.toPrecision(5) + " fps");

        // play the game
        gameFunction(ship);

        // update the world, and then paint
        Manager.update();
        Manager.paint();

    }, 1000 * deltaTime);

    // need a pause time button
}