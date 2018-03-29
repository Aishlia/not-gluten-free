function coord_generation(shapeList) {
    var converted_shapes = [];
    var new_shape;

    for (shape of shapeList) {
      var vertices = [];

      if (typeof shape.coordinates === 'undefined') {
        shape.coordinates = { x: 0, y: 0};
      }

      var center = {
        x: shape.coordinates.x,
        y: shape.coordinates.y
      }

      if (shape.dimensions['h'] && shape.dimensions['w']) {
        x_adjust = shape.dimensions['w']/2;
        y_adjust = shape.dimensions['h']/2;

        new_shape = {
            vertices: [
                {x: (center.x - x_adjust), y: (center.y - y_adjust)},
                {x: (center.x + x_adjust),  y: (center.y - y_adjust)},
                {x: (center.x + x_adjust),  y: (center.y + y_adjust)},
                {x: (center.x - x_adjust),  y: (center.y + y_adjust)}
            ],
            nodes: [{x: center.x, y: center.y, color: 1},
                    {x: center.x + 5, y: center.y + 5, color: 2}],
            pinned: shape.pinned
        };
      } else if (shape.dimensions['r']) {
          var radius = shape.dimensions['r'];
          var coordinates = shape.coordinates;
          var rotation = shape.rotation;
          var pinned = shape.pinned;
          var vertices = [];

          var sides = 30;
          var theta = 0;
          for (var i = 0; i < sides; i++) {
            theta += (2*Math.PI)/sides;
            vertices.push({x: (radius * Math.cos(theta)) + center.x,
                           y: radius * Math.sin(theta) + center.y})
          }

          new_shape = {
            vertices: vertices,
            nodes: [{x: center.x, y: center.y, color: 1},
                    {x: center.x + 5, y: center.y + 5, color: 2}],
            pinned: shape.pinned
          }
      }
      converted_shapes.push(new_shape);
    }
    return converted_shapes;
}

var shapeList = [
    {
        dimensions: { h: 50, w: 50}, // most likely assume in mm (1mm = 3.779528px)
        coordinates: { x: 50, y: 50}, // in px also may be undefined (when initializing)
        rotation: 90, // in degrees
        pinned: true,
    },
    {
        dimensions: { r: 20 },
        coordinates: undefined,
        rotation: 0,
        pinned: false,
    },
]

var shapes = coord_generation(shapeList);

var bounding_box = {
  vertices: [
      {x: -300, y: -300},
      {x: 300, y: -300},
      {x: 300, y: 100},
      {x: 0, y: 250},
      {x: -300, y: 100}
  ]
};

// ////////////////////////////////////////////////////////////////////////////////
// initialize data structure <shape-definition.js>
//
// exposes:
//   shapes: list of shape objects
//   grouped_nodes: color-indexed lists of nodes
//
var shapedata = new ShapeData(shapes);

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

    shapedata.shapes.forEach(function(n) {
      threshold = Math.max(threshold, Math.abs(n.lin_p.x));
      threshold = Math.max(threshold, Math.abs(n.lin_p.y));
      threshold = Math.max(threshold, Math.abs(n.rot_p));
    });

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

display.shape_click = function(d) {
    d.locked = this.locked ? true : false;
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
            // animate();
            window.requestAnimationFrame(animate);
        }
    }
}

function clickMe(){
  bullshit = document.getElementById("bullshit").value;
  console.log(bullshit)
}

animate();
