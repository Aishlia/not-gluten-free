function animate() {
  for (i = 0; i < shapes.length; i++) {
      s = shapes[i];
      for (j = 0; j < i; j++) { // each pair of shapes
          s2 = shapes[j];

          overlap_x = 0;
          overlap_y = 0;
          response.clear();
          if (SAT.testPolygonPolygon(s, s2, response)) {
              overlap_x -= response.overlapV.x;
              overlap_y -= response.overlapV.y;
          }
          response.clear();
          if (SAT.testPolygonPolygon(s2, s, response)) {
              overlap_x += response.overlapV.x;
              overlap_y += response.overlapV.y;
          }

          if (overlap_x || overlap_y) {

              // conserves linear momentum
              s.lin_p.x += overlap_x;
              s.lin_p.y += overlap_y;
              s2.lin_p.x -= overlap_x;
              s2.lin_p.y -= overlap_y;

          }
      }

    // 5) Early termination or recursion
    iters += 1;

    if (iters < 100) {
        window.requestAnimationFrame(animate);
    } else {
        console.log('done');
    }

}
