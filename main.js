// Test Shape List
var shapeList = [
  {
    dimensions: { h: 60, w: 90}, // most likely assume in mm (1mm = 3.779528px)
    coordinates: { x: -100, y: 30}, // in px also may be undefined (when initializing)
    rotation: 90, // in degrees
    pinned: true,
    nodes: [ // defined in relation to the center of the shape
      {x: 0, y: 20, color: 1},
      {x: 20, y: 0, color: 0},
    ]
  },
  {
    dimensions: { h: 50, w: 50}, // most likely assume in mm (1mm = 3.779528px)
    coordinates: { x: 100, y: 100}, // in px also may be undefined (when initializing)
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
    coordinates: undefined, // in px also may be undefined (when initializing)
    rotation: 90, // in degrees
    pinned: false,
    nodes: [ // defined in relation to the center of the shape
      {x: 0, y: 20, color: 1},
      {x: 20, y: 0, color: 0},
    ]
  },
  {
    dimensions: { h: 100, w: 100}, // most likely assume in mm (1mm = 3.779528px)
    coordinates: undefined, // in px also may be undefined (when initializing)
    rotation: 90, // in degrees
    pinned: false,
    nodes: [ // defined in relation to the center of the shape
      {x: 0, y: 20, color: 1},
      {x: 20, y: 0, color: 0},
    ]
  },
  {
    dimensions: { h: 300, w: 100}, // most likely assume in mm (1mm = 3.779528px)
    coordinates: undefined, // in px also may be undefined (when initializing)
    rotation: 90, // in degrees
    pinned: false,
    nodes: [ // defined in relation to the center of the shape
      {x: 0, y: 20, color: 1},
      {x: 20, y: 0, color: 0},
    ]
  },
  {
    dimensions: { h: 110, w: 100}, // most likely assume in mm (1mm = 3.779528px)
    coordinates: undefined, // in px also may be undefined (when initializing)
    rotation: 90, // in degrees
    pinned: false,
    nodes: [ // defined in relation to the center of the shape
      {x: 0, y: 20, color: 1},
      {x: 20, y: 0, color: 0},
    ]
  }
]

// Test Bounding Box
var boundingBox = {
  vertices: [
      {x: -400, y: -400},
      {x: 400, y: -400},
      {x: 400, y: 400},
      {x: -400, y: 400}
  ]
};

class Shape_cluster {
  constructor(shapeList){
    this.shapeList = shapeList;
  }

  get shape_coords() {
    return this.optomize()
  }

  add_new_shape(new_shape) {
    for (var shape of this.shapeList) {
      shape.pinned = true
    }

    this.shapeList.push(new_shape)
    return this.optomize()
  }

  optomize() {
    var shapedata = this.generate_shapedata(this.shapeList)
    var sim = new Simulation();
    var svg = d3.select("#display").append("svg")
    .attr("width", window.innerWidth)
    .attr("height", window.innerHeight)
    .append("g")
    .attr("transform", "translate(" + window.innerWidth / 2 + ", " +
    window.innerHeight / 2 + ")");
    var display = new ShapeSVG(shapedata, svg);

    var output_coords = this.animate(shapedata, shapeList, sim, display)
    return output_coords
  }

  // Converting from input shapes to usable entry for SAT shapes
  // Generates rectangle coordinates
  generate_rectangle(shape, center) {
    // console.log(shape)
    var x_adjust = shape.dimensions['w']/2;
    var y_adjust = shape.dimensions['h']/2;

    // Adjust nodes to be defined from center of shape
    for (var i of shape.nodes) {
      i['x'] += center.x
      i['y'] += center.y
    }

    var vertices = [
      {x: (center.x - x_adjust), y: (center.y - y_adjust)},
      {x: (center.x + x_adjust),  y: (center.y - y_adjust)},
      {x: (center.x + x_adjust),  y: (center.y + y_adjust)},
      {x: (center.x - x_adjust),  y: (center.y + y_adjust)}
    ]

    var new_shape = {
      vertices: vertices,
      nodes: shape.nodes,
      pinned: shape.pinned,
      center: center
    };

    return new_shape;
  }

  // Generates circle coordinates as n-sided polygonal approximation of circle
  generate_circle(shape, center) {
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

      var new_shape = {
        vertices: vertices,
        nodes: shape.nodes,
        pinned: shape.pinned,
        center: center
      }

      return new_shape;
    }

  // Converts a single shape from user input to SAT input
  convert_shape(shape) {
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
      converted_shape = this.generate_rectangle(shape, center);
      else if (shape.dimensions['r']) // Circle definition
      converted_shape = this.generate_circle(shape, center);

      return converted_shape;
    }

  // Converts the user defined shapelist to SAT usable coordinates
  convert_shape_list(shapeList, boundingBox) {
      var converted_shape_list = [];
      var converted_shape;

      for (var shape of shapeList) {
        converted_shape = this.convert_shape(shape)
        converted_shape_list.push(converted_shape);
      }

      return converted_shape_list
    }

  // Generates SAT shapedata
  generate_shapedata(shapeList, boundingBox) {
      var shapes = this.convert_shape_list(shapeList, boundingBox);

      return (new ShapeData(shapes)) //shapedata
    }

  generate_output_coords(shapedata, shapeList) {
    var output_coords = [];

    for (var s in shapedata.shapes) {
      var new_shape = shapeList[s]
      new_shape.coordinates = {x: shapedata.shapes[s].pos.x, y: shapedata.shapes[s].pos.y}
      new_shape.rotation = shapedata.shapes[s].angle * 180 / Math.PI
      output_coords.push(new_shape)
    }

    return output_coords
  }

  animate(shapedata, shapeList, sim, display) {
      for (var i = 0; i < 1000; i++) {
        sim.step(shapedata);
      }
      var result = this.generate_output_coords(shapedata, shapeList);
      // write_cost(shapedata); // d3
      display.rerender(); // d3

      return result;
    }

}

board = new Shape_cluster(shapeList)
console.log(board.shape_coords)
