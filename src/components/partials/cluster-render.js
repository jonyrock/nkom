const d3 = require('d3');
const _ = require('lodash');

export default function(svg, width, height, data, onIn, onOut) {

  //console.log(data);

  var
      padding = 1.5, // separation between same-color circles
      clusterPadding = 6, // separation between different-color circles
      maxRadius = 12;


  var m = data.length; // number of distinct clusters
  var color = d3.scale
      .category10()
      .domain(d3.range(m));

  // The largest node for each cluster.
  var clusters = new Array(m);
  var nodes = [];
  var n = 0; // total number of circles

  for(var i = 0; i < data.length; i++) {
    var els = data[i].els;
    n += els.length;
    for(var j = 0; j < els.length; j++) {
      var d = {
        cluster: i, radius: 2,
        name: els[j]
      };
      nodes.push(d);
      if (!clusters[i]) {
        clusters[i] = d;
      }
    }
  }

  var force = d3.layout.force()
      .nodes(nodes)
      .size([width, height])
      .gravity(.02)
      .charge(0)
      .on("tick", tick)
      .start();


  svg
    .attr("width", width)
    .attr("height", height);

  var circle = svg.selectAll("circle")
      .data(nodes)
    .enter().append("circle")
      .attr("r", function(d) { return d.radius; })
      .style("fill", function(d) { return color(d.cluster); })
      .call(force.drag);

  function tick(e) {
    circle
        .each(cluster(10 * e.alpha * e.alpha))
        .each(collide(.5))
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .on('mouseover', function(d) {
          onIn(d);
    		})
        .on('mouseout', function(d) {
          onOut(d);
        })
  }


  // Move d to be adjacent to the cluster node.
  function cluster(alpha) {
    return function(d) {
      var cluster = clusters[d.cluster];
      if (cluster === d) return;
      var x = d.x - cluster.x,
          y = d.y - cluster.y,
          l = Math.sqrt(x * x + y * y),
          r = d.radius + cluster.radius;
      if (l != r) {
        l = (l - r) / l * alpha;
        d.x -= x *= l;
        d.y -= y *= l;
        cluster.x += x;
        cluster.y += y;
      }
    };
  }

  // Resolves collisions between d and all other circles.
  function collide(alpha) {
    var quadtree = d3.geom.quadtree(nodes);
    return function(d) {
      var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
          nx1 = d.x - r,
          nx2 = d.x + r,
          ny1 = d.y - r,
          ny2 = d.y + r;
      quadtree.visit(function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== d)) {
          var x = d.x - quad.point.x,
              y = d.y - quad.point.y,
              l = Math.sqrt(x * x + y * y),
              r = d.radius + quad.point.radius +
                  (d.cluster === quad.point.cluster ? padding : clusterPadding);
          if (l < r) {
            l = (l - r) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    };
  }

}
