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

function plotNodesAndLinks(dataNodes, clusterNodes, citationLinks) {

		// TODO replace with data.length
	var n = dataNodes.length; // total number of circles (all data)
		// TODO replace with top keywords
	var m = clusterNodes.length;  // number of distinct clusters (top keywords)

	var color = d3.scale.category10()
	    .domain( d3.range(m) );

	// Top keywords form clusters, the largest node and magnet.
	// TODO replace with top keywords
	clusters = clusterNodes; // var clusters = new Array(m);
	nodes = dataNodes;       // nodes = simulateNodes(n, m, clusters);

  if (citationLinks == undefined) {return};

  var nodeById = d3.map();

  nodes.forEach(function(node) {
    nodeById.set(node.id, node);
  });

  citationLinks.forEach(function(link) {
    link.source = nodeById.get(link.source);
    link.target = nodeById.get(link.target);
  });

	force = d3.layout.force()
		    .nodes(nodes)
        	.links(citationLinks)
		    .size([width, height])
		    .gravity(0)
		    .charge(-5)
		    .on("tick", tick)
		    .start();

	if (svg == null) {
		svg = d3.select("#viz_area").append("svg")
		    .attr("width", window.innerWidth)
		    .attr("height", window.innerHeight);
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
            .attr("cx", function(d) { return d.x; })
    	      .attr("cy", function(d) { return d.y; })
				    .style("fill", function(d) { return color(d.cluster); })
            .style("opacity", function(d) { return d.opacity; })
            .call(force.drag)
					.on("mouseover", function(d) {
						d3.select(this).attr({
							stroke: "gray",
							"stroke-width": 5
				        });
						divArea.transition()
								.duration(20)
								.style("opacity", .9);
						divArea.html("<p style='line-height: 1.0;'><b>" + d.title + "</b></p>"
									+"<p style='line-height: 0.9;'>Date: " + d.date + "</p>"
									+"<p style='line-height: 0.9;'>Inventor: " + d.inventors +"</p>"
									+"<p style='line-height: 0.9;'>Assignee: " + d.assignee + "</p>"
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

  svg.append("svg:defs").selectAll("marker")
        .data(["end"])      // Different link/path types can be defined here
      .enter().append("svg:marker")    // This section adds in the arrows
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 2)
        .attr("refY", -0)
        .attr("markerWidth", 2)
        .attr("markerHeight", 2)
        .attr("orient", "auto")
        .style("fill", "gray")
        .style("stroke", "gray")
      .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5")
        .style("fill", "gray")
        .style("stroke", "gray");

  var link = svg.selectAll("line")
    .data(citationLinks)
    .enter().append("line")
      .attr("stroke-width", 5)
      .attr("marker-end", "url(#end)")
      .style("stroke", "gray");

	function tick(e) {
	  circle
	      .each(cluster(10 * e.alpha * e.alpha))
	      .each(collide(.5))
	      .attr("cx", function(d) { return d.x; })
	      .attr("cy", function(d) { return d.y; });
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
    svg
		    .attr("width", window.innerWidth)
		    .attr("height", window.innerHeight);
	}

	// Move d to be adjacent to the cluster node.
	function cluster(alpha) {
	  return function(d) {
	    var cluster = clusters[d.cluster],
	        k = 1;

	    // console.log(cluster);
	    // console.log(cluster.x);

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
