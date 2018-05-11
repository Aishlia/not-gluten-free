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
         .attr("cx", function(n) {
           return n.x;
         })
         .attr("cy", function(n) {
           return n.y;
         })
         .attr("r", 3)
         .attr("fill", function(n) {
           return fill(n.color);
         });
     })
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
