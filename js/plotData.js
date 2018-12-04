// Plots data as nodes
// Adapted from example by Mike Bostock: https://bl.ocks.org/mbostock/1748247
//       and https://bl.ocks.org/Thanaporn-sk/c7f74cb5051a0cdf6cf077a9db332dfb

var width = 900,
    height = 600,
    padding = 3,         // separation between same-color circles
    clusterPadding = 30, // separation between different-color circles
    minRadius = 4,
    maxRadius = 12;

var nodes = null; //store current data
var svg = null;
var force = null;
var divArea = null;

function plotNodes(dataNodes, clusterNodes) {

		// TODO replace with data.length
	var n = dataNodes.length; // total number of circles (all data)
		// TODO replace with top keywords
	var m = 2;  // number of distinct clusters (top keywords)

	var color = d3.scale.category10()
	    .domain( d3.range(m) );

	// Top keywords form clusters, the largest node and magnet.
	// TODO replace with top keywords
	clusters = clusterNodes; // var clusters = new Array(m);
	nodes = dataNodes;       // nodes = simulateNodes(n, m, clusters); 	

	console.log(nodes);

	force = d3.layout.force()
		    .nodes(nodes)
		    .size([width, height])
		    .gravity(0)
		    .charge(0)
		    .on("tick", tick)
		    .start();

	if (svg == null) {
		svg = d3.select("#viz_area").append("svg")
		    .attr("width", width)
		    .attr("height", height);
	}

	if (divArea == null) {
		var divArea = d3.select("#viz_area").append("div")
					    .attr("class", "tooltip")
					    .attr("opacity", 0);
	}

	var circle = svg.selectAll("circle")
				    .data(nodes)
				  	.enter().append("circle")
				    .attr("r", function(d) { return d.radius; })
				    .style("fill", function(d) { return color(d.cluster); })
				    .call(force.drag)
					.on("mouseover", function(d) {
						d3.select(this).attr({
							stroke: "gray",
							"stroke-width": 5
				        });
						divArea.transition()
								.duration(20)
								.style("opacity", .9);
								// TODO update with patent data
						divArea.html("<p>Title:" + d.title + "</p>"
									+"<p>Date:" + d.date + "</p>"
									+"<p>Inventor:" + d.inventors + "</p>" 
									+"<p>Assignee:" + d.assignee + "</p>"
									+"<p>Abstract:" + d.abstract + "</p>"
								)
								.style("left", (d3.event.pageX) + "px")
								.style("top", (d3.event.pageY + 5) + "px");
					})
				    .on( "mouseout", mouseout )
					.on("click", function(d) {
									divArea.transition()
											.duration(500)
											.style("opacity", 0);
					    });

	function tick(e) {
	  circle
	      .each(cluster(10 * e.alpha * e.alpha))
	      .each(collide(.5))
	      .attr("cx", function(d) { return d.x; })
	      .attr("cy", function(d) { return d.y; });
	}

	// Move d to be adjacent to the cluster node.
	function cluster(alpha) {
	  return function(d) {
	    var cluster = clusters[d.cluster],
	        k = 1;

	    // For cluster nodes, apply custom gravity.
	    if (cluster === d) {
	      cluster = {x: width / 2, y: height / 2, radius: -d.radius};
	      k = .1 * Math.sqrt(d.radius);
	    }

	    var x = d.x - cluster.x,
	        y = d.y - cluster.y,
	        l = Math.sqrt(x * x + y * y),
	        r = d.radius + cluster.radius;
	    if (l != r) {
	      l = (l - r) / l * alpha * k;
	      d.x -= x *= l;
	      d.y -= y *= l;
	      cluster.x += x;
	      cluster.y += y;
	    }
	  };
	}

	// Handle mouseout from node
	function mouseout() {
		// remove stroke and tooltip
        d3.select(this).attr({
          "stroke-width": 0
        });
		divArea.transition()
				.duration(500)
				.style("opacity", 0);
	}

}

// TODO
function plotLinks(data) {
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
            r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
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

function simulateNodes ( n, m, clusters ) {
	var nodesTemp = d3.range(n).map(function() {
	  var i = Math.floor(Math.random() * m),
	      r = Math.sqrt((i + 1) / m * -Math.log(Math.random())) * maxRadius,
	      d = {cluster: i, radius: r};
	  if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
	  return d;
	});
	return nodesTemp;
}
