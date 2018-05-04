var shapeList = [
    {
        dimensions: { h: 60, w: 90}, // most likely assume in mm (1mm = 3.779528px)
        coordinates: { x: 10, y: 100}, // in px also may be undefined (when initializing)
        rotation: 90, // in degrees
        pinned: true,
        nodes: [ // defined in relation to the center of the shape
        {x: 0, y: 20, color: 1},
        {x: 20, y: 0, color: 0},
    ]
    },
    {
        dimensions: { r: 20 },
        coordinates: undefined,
        rotation: 0,
        pinned: false,
        nodes: [
        {x: 15, y: 0, color: 1},
        {x: -15, y: 0, color: 0},
    ]
    },
    {
        dimensions: { r: 30 },
        coordinates: undefined,
        rotation: 0,
        pinned: false,
        nodes: [
        {x: 15, y: 0, color: 1},
        {x: -15, y: 0, color: 0},
    ]
    },
    {
        dimensions: { r: 40 },
        coordinates: undefined,
        rotation: 0,
        pinned: false,
        nodes: [
        {x: 15, y: 0, color: 1},
        {x: -15, y: 0, color: 0},
    ]
    },
    {
        dimensions: { h: 50, w: 50}, // most likely assume in mm (1mm = 3.779528px)
        coordinates: { x: 80, y: 50}, // in px also may be undefined (when initializing)
        rotation: 90, // in degrees
        pinned: true,
        nodes: [ // defined in relation to the center of the shape
        {x: 0, y: 20, color: 1},
        {x: 20, y: 0, color: 0},
    ]
    }
]

var boundingBox = {
  vertices: [
      {x: -300, y: -300},
      {x: 300, y: -300},
      {x: 300, y: 100},
      {x: 0, y: 250},
      {x: -300, y: 100}
  ]
};

// Converting from input shapes to usable SAT shapes
function generate_rectangle(shape, center) {
  x_adjust = shape.dimensions['w']/2;
  y_adjust = shape.dimensions['h']/2;

  // Adjust nodes to be defined from center of shape
  for (i of shape.nodes) {
    i['x'] += center.x
    i['y'] += center.y
  }

  var vertices = [
      {x: (center.x - x_adjust), y: (center.y - y_adjust)},
      {x: (center.x + x_adjust),  y: (center.y - y_adjust)},
      {x: (center.x + x_adjust),  y: (center.y + y_adjust)},
      {x: (center.x - x_adjust),  y: (center.y + y_adjust)}
  ]

  new_shape = {
      vertices: vertices,
      nodes: shape.nodes,
      pinned: shape.pinned
  };

  return new_shape;
}

function generate_circle(shape, center) {
  var radius = shape.dimensions['r'];
  var rotation = shape.rotation;
  var pinned = shape.pinned;
  var vertices = [];

  // Approximate the circle with a polygon
  var sides = 30; // Number of sides for the polygon approximation
  var theta = 0;
  for (var i = 0; i < sides; i++) {
    theta += (2*Math.PI)/sides;
    vertices.push({x: (radius * Math.cos(theta)) + center.x,
                   y: radius * Math.sin(theta) + center.y})
  }

  // Adjust nodes to be defined from center of shape
  for (i of shape.nodes) {
    i['x'] += center.x
    i['y'] += center.y
  }

  new_shape = {
    vertices: vertices,
    nodes: shape.nodes,
    pinned: shape.pinned
  }

  return new_shape;
}

function convert_shape(shape) {
    var converted_shape; // Shape in usable format

    if (typeof shape.coordinates === 'undefined') {
        shape.coordinates = { x: 0, y: 0};
     }

     // Centroid of shape
     var center = {
         x: shape.coordinates.x,
         y: shape.coordinates.y
      }

      if (shape.dimensions['h'] && shape.dimensions['w']) // Rectangle definition
          converted_shape = generate_rectangle(shape, center);
      else if (shape.dimensions['r']) // Circle definition
          converted_shape = generate_circle(shape, center);

      return converted_shape;
}

function convert_shape_list(shapeList) {
    var converted_shape_list = [];
    var converted_shape;

    for (shape of shapeList) {
        converted_shape = convert_shape(shape)
        converted_shape_list.push(converted_shape);
    }

    return converted_shape_list
}

function generate_shapedata(shapeList) {
  var shapes = convert_shape_list(shapeList);
  // var shapedata = new ShapeData(shapes);
  return (new ShapeData(shapes)) //shapedata
}

function moving_shapes_to_coords(shapedata, shapeList) {
    for (var i = 0; i < shapedata.shapes.length; i++) {
        var shape = shapedata.shapes[i];

        shape.pos.x += shapeList[i].coordinates.x;
        shape.pos.y += shapeList[i].coordinates.y;
        shape.setAngle(shapeList[i].rotation*(180/Math.PI));
    }
}

////////////////////////////////////////////////////////////////////////////////

var iters = 0,
    threshold = 0,
    max_iters = 1000,
    done = false;

function iterate_sim(shapedata, sim) {
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
    return !(threshold > 0.1 && iters < max_iters); // *note* originally &&
}

function generate_output_coords(shapedata, shapeList) {
    output_coords = [];

    for (s in shapedata.shapes) {
        new_shape = shapeList[s]
        new_shape.coordinates = {x: shapedata.shapes[s].pos.x, y: shapedata.shapes[s].pos.y}
        new_shape.rotation = shapedata.shapes[s].angle * 180 / Math.PI
        output_coords.push(new_shape)
    }

    return output_coords
}

function animate(shapedata, shapeList) {
    done = iterate_sim(shapedata, sim);

    if (done) {
        result = generate_output_coords(shapedata, shapeList);
        write_cost(shapedata); // d3
        display.rerender(); // d3
    } else {
        animate(shapedata, shapeList);
    }

    return result;
  }

// ////////////////////////////////////////////////////////////////////////////////
var sim = new Simulation();

var shapedata = generate_shapedata(shapeList)

moving_shapes_to_coords(shapedata, shapeList)

function main(shapeList, boudingBox) {
    output_coords = animate(shapedata, shapeList, sim)

    return output_coords
}

// start
var svg = d3.select("#display").append("svg")
    .attr("width", window.innerWidth)
    .attr("height", window.innerHeight)
  .append("g")
    .attr("transform", "translate(" + window.innerWidth / 2 + ", " +
                                      window.innerHeight / 2 + ")");

var display = new ShapeSVG(shapedata, svg);

function write_cost(shapedata) {
    d3.select("#cost").text(shapedata.get_cost().toPrecision(3));
}
// stop

output_coords = main(shapeList, boundingBox)
console.log(output_coords)
