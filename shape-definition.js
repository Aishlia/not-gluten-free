// depends on SAT

function ShapeData(source_shapes) {
    this.shapes = JSON.parse(JSON.stringify(source_shapes));
    this.grouped_nodes = [];

    // for each shape
    var s, nodes, vertices, n, color, j, i, v;
    for (i = 0; i < this.shapes.length; i++) {
        s = this.shapes[i];
        nodes = [];
        vertices = [];

        // for each node in the shape
        for (j = 0; j < s.nodes.length; j++) {

            // convert to SAT Vector
            n = s.nodes[j];
            color = n.color;
            n = new SAT.Vector(n.x, n.y);
            n.color = color;
            nodes[j] = n;

            if (this.grouped_nodes[n.color] == undefined) {
                this.grouped_nodes[n.color] = [];
            }

            n.number = this.grouped_nodes[n.color].length;

            n.s_index =  i;
            n.ax = n.x; // constant offset in shape's local coordinates
            n.ay = n.y;
            n.dx = n.x; // relative to shape's center in absolute coords
            n.dy = n.y;

            this.grouped_nodes[n.color][n.number] = n;
        }

        // for each vertex in the shape
        for (j = 0; j < s.vertices.length; j++) {

            // convert to SAT Vector
            v = s.vertices[j];
            v = new SAT.Vector(v.x, v.y);
            vertices[j] = v;

        }

        // convert s to SAT Polygon

        s = new SAT.Polygon(new SAT.Vector(), vertices);
        s.pinned = source_shapes[i].pinned;
        s.nodes = nodes;
        s.forces = new SAT.Vector(0, 0); // net x, y force vector
        s.torques = 0;                   // net counter-clockwise torque
        s.lin_p = new SAT.Vector(0, 0);  // linear momentum: x, y
        s.rot_p = 0;                     // counter-clockwise angular momentum

        s.m = 0.1; // mass
        s.I = 0;   // rotational inertia

        for (j = 0; j < s.nodes.length; j++) {
            n = s.nodes[j];
            s.I += s.m * (n.x ** 2 + n.y ** 2) / s.nodes.length;
        }

        this.shapes[i] = s;
    }
}

ShapeData.prototype.get_cost = function() {
    /*
     * return cost
     */

    var grouped_nodes = this.grouped_nodes;

    var cost = 0;

    var j, k, n, n2;

    for (var i = 0; i < grouped_nodes.length; i++) {
        for (j = 0; j < grouped_nodes[i].length; j++) {
            n = grouped_nodes[i][j];

            // each pair of like-colored nodes (j, k)
            for (k = 0; k < j; k++) {
                n2 = grouped_nodes[i][k];

                // update cost
                cost += ((n2.x - n.x) ** 2 + (n2.y - n.y) ** 2);
            }
        }
    }

    return cost;
};
