// demonstrating with hard-coded shapes
// all coordinates relative to shape's local coordinates
// vertices ordered counter-clockwise
// colors are numbers starting at 0

var A = {
    vertices: [ // assumed convex for now. In future allow multiple shapes
        {x: -50, y: -50},
        {x: 50,  y: -50},
        {x: 50,  y: 50},
        {x: -50, y: 50}
    ],
    nodes: [
        {x: 30, y: 30, color: 1},
        {x: 30, y: -30, color: 0},
    ]
};
var B = {
    vertices: [
        {x: -50, y: -50},
        {x: 50,  y: -50},
        {x: 50,  y: 50},
        {x: -50, y: 50}
    ],
    nodes: [
        {x: 30, y: 30, color: 0},
        {x: 30, y: -30, color: 1}
    ]
};
var C = {
    vertices: [
        {x: -50, y: -100},
        {x: 50,  y: -100},
        {x: 50,  y: 100},
        {x: -50, y: 100}
    ],
    nodes: [
        {x: 5, y: 80, color: 0},
        {x: 30, y: -20, color: 1}
    ]
};
var D = {
    vertices: [
        {x: -50, y: -100},
        {x: 50,  y: -100},
        {x: 50,  y: 100},
        {x: -50, y: 50}
    ],
    nodes: [
        {x: 5, y: 40, color: 1},
        {x: 30, y: -20, color: 0}
    ]
};
var shapes = [A, B, C, D];

////////////////////////////////////////////////////////////////////////////////

// initialize data structure <shape-definition.js>
//
// exposes:
//   shapes: list of shape objects
//   grouped_nodes: color-indexed lists of nodes
//
var shapedata = new ShapeData(shapes);

// random initial placement
for (var i = 0; i < shapedata.shapes.length; i++) {
    var s = shapedata.shapes[i];

    s.pos.x += (Math.random() - 0.5) * window.innerWidth;
    s.pos.y += (Math.random() - 0.5) * window.innerHeight;
    s.setAngle(Math.random() * 2 * Math.PI);
}

// setup simulation engine <shape-physics.js>
//
// exposes:
//   [all simulation parameters]
//
//   step(shapedata): applies dt time interval to shapedata
//
var sim = new Simulation();

// create svg
var svg = d3.select("#display").append("svg")
    .attr("width", window.innerWidth)
    .attr("height", window.innerHeight)
  .append("g")
    .attr("transform", "translate(" + window.innerWidth / 2 + ", " +
                                      window.innerHeight / 2 + ")");

// create handles for animation <shape-animation.js>
//
// exposes:
//   rerender: updates the SVG
//
var display = new ShapeSVG(shapedata, svg);



////////////////////////////////////////////////////////////////////////////////

var iters = 0,
    threshold = 0,
    max_iters = 1000,
    done = false;

function iterate_sim(shapedata, display, interactive) {
    // Early termination or recursion
    iters += 1;
    threshold = 0; // maximum component of momentum

    sim.step(shapedata);

    for (i = 0; i < shapedata.shapes.length; i++) {
        threshold = Math.max(threshold, Math.abs(shapedata.shapes[i].lin_p.x));
        threshold = Math.max(threshold, Math.abs(shapedata.shapes[i].lin_p.y));
        threshold = Math.max(threshold, Math.abs(shapedata.shapes[i].rot_p));
    }

    // returns true when finished
    return !(threshold > 0.1 && iters < max_iters);
}

function write_cost(shapedata) { 
    d3.select("#cost").text(shapedata.get_cost().toPrecision(3));
}

// allow interaction to continue the simulation, and freeze interaction when
// done
display.shape_drag_started = function(d) {
    iters = 0;
};
display.shape_dragged = function(d) {
    if (!done) {
        d.pos.x = d3.event.x;
        d.pos.y = d3.event.y;
        d3.select(this)
            .attr("transform", this.affine_shape_update);
    }
};
display.shape_drag_ended = function(d) {
    iters = 0;
};

// fastest -> simulate up to maxiters then paint
// interactive -> simulate and paint each step
var animation_mode = 'interactive'; // 'fastest'; // 'interactive';

function animate() {

    done = iterate_sim(shapedata, sim, display);

    if (done) {
        write_cost(shapedata);
        display.rerender();
    } else {
        if (animation_mode == 'fastest') {
            animate();
        } else {
            display.rerender();
            write_cost(shapedata);
            window.requestAnimationFrame(animate);
        }
    }
}

animate();
