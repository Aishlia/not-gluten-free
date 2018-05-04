// depends on SAT, shape-definition.js

function Simulation() {
   /*
    * create a new simulation engine for shapes
    */
    this.response = new SAT.Response();

    // parameters

    // time step
    this.dt = 0.005;

    // hooke constant for node-node attractive forces
    this.hooke = 1;

    // hookean constant for solid collisions
    this.solid_hooke = 1 / this.dt;

    // discretized angular resolution
    this.angle_res = Math.PI / 2;

    // this.position_res =
    // TODO consider discretized position / dimensions

    // damping factor for translational momentum
    this.linp_damping = Math.pow(10, -this.dt * 4);

    // damping factor for rotational momentum
    this.rotp_damping = Math.pow(10, -this.dt * 3);

};

Simulation.prototype.step = function(shapedata) {
    if (typeof shapedata.grouped_nodes[0] === 'undefined') { // Find out why there is an empty
      shapedata.grouped_nodes.shift();
    }

    var shapes = shapedata.shapes,
        grouped_nodes = shapedata.grouped_nodes;

    // update positions of all shapes
    // apply momentum damping
    // update center of mass
    var x_center_of_mass = 0, y_center_of_mass = 0;
    for (var i = 0; i < shapes.length; i++) {
        this._update_coords(shapes[i]);
        this._damp_p(shapes[i]);
        x_center_of_mass += shapes[i].pos.x;
        y_center_of_mass += shapes[i].pos.y;
    }

    // follow center of mass
    shapes.forEach(function(n) {
      n.pos.x -= x_center_of_mass / shapes.length;
      n.pos.y -= y_center_of_mass / shapes.length;
    });

    // apply spring forces by grouping of nodes by color
    for (i = 0; i < grouped_nodes.length; i++) {
        this._apply_colored_spring(grouped_nodes[i], shapes);
    }

    // apply collision forces to each pair of shapes
    for (i = 0; i < shapes.length; i++) {
        var s = shapes[i];
        for (var j = 0; j < i; j++) {
            var s2 = shapes[j];
            this._apply_collision(s, s2);
        }
    }

};

////////////////////////////////////////////////////////////////////////////////

Simulation.prototype._update_coords = function(s) {
    /*
     * update coords using last momenta
     *
     * params:
     *   dt
     *   angle_res
     */

    var dt = this.dt,
        angle_res = this.angle_res;

    // a) update position of shape's center
    s.pos.x += s.lin_p.x / s.m * dt; // x
    s.pos.y += s.lin_p.y / s.m * dt; // y

    // b) update and discretize orientation (angle)
    s.setAngle(
        // setAngle updates positions of vertices as s.calcPoints
        Math.floor((
            s.angle + (s.rot_p / s.I * dt)
        ) / angle_res) * angle_res

    );

    var cos = Math.cos(s.angle);
    var sin = Math.sin(s.angle);

    // c) update positions of nodes with new position and orientation
    s.nodes.forEach(function(n) {
      n.dx = cos * n.ax - sin * n.ay;
      n.dy = sin * n.ax + cos * n.ay;
      n.x = s.pos.x + n.dx;
      n.y = s.pos.y + n.dy;
    });
};

Simulation.prototype._damp_p = function(s) {
    /*
     * apply momentum damping to shape s
     *
     * params:
     *   linp_damping
     *   rotp_damping
     */

    s.lin_p.x *= this.linp_damping;
    s.lin_p.y *= this.linp_damping;
    s.rot_p *= this.rotp_damping;
};

Simulation.prototype._apply_colored_spring = function(node_group, shapes) {
    /*
     * p += f(x)
     *
     * equations of motion are second-order.
     * calculate forces using new positions, and update momenta
     * by applying spring-interactions between node_group
     *
     * nodes_group: list of nodes which all attract to each other
     *                    each node contains a reference to its host shape
     *                    as an index in the list `shapes`
     *
     * shapes: list of shapes which contain the nodes, in order
     *         according to references maintained by node_group
     *
     * params:
     *   dt
     *   hooke
     */

    var dt = this.dt,
        hooke = this.hooke / node_group.length;

    var n, n2, s, s2, k;
    for (var j = 0; j < node_group.length; j++) {
        n = node_group[j];
        s = shapes[n.s_index];

        // each pair of like-colored nodes (j, k)
        for (k = 0; k < j; k++) {
            n2 = node_group[k];
            s2 = shapes[n2.s_index];
            // linear forces applied to both shapes
            s.lin_p.x += hooke * (n2.x - n.x) * dt;
            s.lin_p.y += hooke * (n2.y - n.y) * dt;
            s2.lin_p.x += hooke * (n.x - n2.x) * dt;
            s2.lin_p.y += hooke * (n.y - n2.y) * dt;

            // torques applied to both shapes
            s.rot_p += hooke * (
                n.dx * (n2.y - n.y) -
                n.dy * (n2.x - n.x)
            ) * dt;
            s2.rot_p += hooke * (
                n2.dx * (n.y - n2.y) -
                n2.dy * (n.x - n2.x)
            ) * dt;
        }
    }
};

Simulation.prototype._apply_collision = function(s, s2) {
    /*
     * apply collision forces to pair of shapes (updates p)
     *
     * params:
     *   dt
     *   solid_hooke
     */


    var repulsion = this.dt * this.solid_hooke;

    var overlap_x = 0,
        overlap_y = 0;

    this.response.clear();
    if (SAT.testPolygonPolygon(s, s2, this.response)) {
        overlap_x -= this.response.overlapV.x;
        overlap_y -= this.response.overlapV.y;
    }
    this.response.clear();
    if (SAT.testPolygonPolygon(s2, s, this.response)) {
        overlap_x += this.response.overlapV.x;
        overlap_y += this.response.overlapV.y;
    }

    if (overlap_x || overlap_y) {

        // conserves linear momentum and applies
        // a psuedo-hookean force (linear-elastic)
        s.lin_p.x += overlap_x * repulsion;
        s.lin_p.y += overlap_y * repulsion;
        s2.lin_p.x -= overlap_x * repulsion;
        s2.lin_p.y -= overlap_y * repulsion;
    }
};
