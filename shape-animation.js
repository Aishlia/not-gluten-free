// depends on shape-definition.js

function ShapeSVG(shapedata, svg) {

    var fill = d3.scaleOrdinal(d3.schemeCategory10);

    var shapesvg_instance = this;

    this.shape_selection = svg.selectAll('.shape').data(shapedata.shapes)
        .enter().append('g')
        .attr("class", "shape")
        .attr("transform", this.affine_shape_update)
        // outline
        .append("polygon")
        .attr("points", function(s) {
            var out = "";
            for (i = 0; i < s.points.length; i++) {
                if (i > 0) {
                    out += ", ";
                }
                out += s.points[i].x.toString() + "," +
                       s.points[i].y.toString();
            }
            return out;
        })
        .style("stroke", "black")
        .style("fill-opacity", "0.0")
        .select(function() {
            return this.parentNode;
        })

        // nodes
        .each(function(s) {
            var node = d3.select(this).selectAll(".node").data(s.nodes);
            node.enter().append("circle")
                .attr("cx", function(n) { return n.x; })
                .attr("cy", function(n) { return n.y; })
                .attr("r", 3)
                .attr("fill", function(n) { return fill(n.color); });
        })
        .call(
            d3.drag()
                .on("start", function(d) {
                    shapesvg_instance.shape_drag_started.call(this, d);
                })
                .on("drag", function(d) {
                    shapesvg_instance.shape_dragged.call(this, d);
                })
                .on("end", function(d) {
                    shapesvg_instance.shape_drag_ended.call(this, d);
                })
        );
}

ShapeSVG.prototype.rerender = function() {
    this.shape_selection.attr("transform", this.affine_shape_update);
};

ShapeSVG.prototype.affine_shape_update = function(s) {
    /**
     * Create string for injecting into svg attributes
     * for a given shape by referencing that shape's
     * internal variables.
     */
	  return "translate(" +
        s.pos.x + ", " +
        s.pos.y + ") " +
        "rotate(" + (s.angle * 180 / Math.PI) + ")";
};

////////////////////////////////////////////////////////////////////////////////
// Base Mouse interaction functions

ShapeSVG.prototype.shape_drag_started = function(d) {
    console.log('protostart');
};

ShapeSVG.prototype.shape_dragged = function(d) {
    console.log('proto');
    d.pos.x = d3.event.x;
    d.pos.y = d3.event.y;
    d3.select(this)
        .attr("transform", this.affine_shape_update);
};

ShapeSVG.prototype.shape_drag_ended = function(d) {
    console.log('protoend');
};
