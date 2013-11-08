/*
This is the new networked notes graph code.
Hopefully it will stay well-contained.
I am re-building the functionality of dag
and metromap from the ground up.
*/

//Width and height
var w = 800;
var h = 400;

//Original data
var dataset = {
  nodes: [
    { name: "Adam", fixed: true, id : 0},
    { name: "Bob" , id : 1},
    { name: "Carrie", fixed: true , id : 2},
    { name: "Donovan" , id : 3},
    { name: "Edward" , id : 4},
    { name: "Felicity" , id : 5},
    { name: "George", fixed: true , id : 6},
    { name: "Hannah" , id : 7},
    { name: "Iris" , id : 8},
    { name: "Jerry" , id : 9}
  ],
  edges: [
    { source: 0, target: 1 },
    { source: 0, target: 2 },
    { source: 0, target: 3 },
    { source: 0, target: 4 },
    { source: 1, target: 5 },
    { source: 2, target: 5 },
    { source: 2, target: 5 },
    { source: 3, target: 4 },
    { source: 5, target: 8 },
    { source: 5, target: 9 },
    { source: 6, target: 7 },
    { source: 7, target: 8 },
    { source: 8, target: 9 }
  ]
};

//Initialize a default force layout, using the nodes and edges in dataset
var force = d3.layout.force()
           .nodes(dataset.nodes)
           .links(dataset.edges)
           .size([w, h])
           .linkDistance([50])
           .charge([-100])
           .on("tick",tick)
           .start();

var colors = d3.scale.category20();

//Create SVG element
var svg = d3.select("#graphic")
      .append("svg")
      .attr("width", w)
      .attr("height", h);


// handles to link and node element groups
// Won't work unless we already append the svg:g
// Can't try to keep redoing the original minGraph
// Nodes assignment
var path = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g');

//Create edges as lines
var edges = path
  .data(dataset.edges)
  .enter()
  .append("line")
  .style("stroke", "#ccc")
  .style("stroke-width", 1);

//Create nodes as circles
var nodes = circle
  .data(dataset.nodes,function(d) { return d.id; })
  .enter()
  .append("svg:g")
  .attr("class","node")
  .call(force.drag);

function canvasUpdate(){
  // edges = svg.selectAll("line")
  //   .data(dataset.edges)
  //   .enter()
  //   .append("line")
  //   .style("stroke", "#ccc")
  //   .style("stroke-width", 1);

  nodes = circle
    .data(dataset.nodes,function(d) { return d.id; })
    // .enter()
    // .append("svg:g")
    // .attr("class","node")
    .call(force.drag);

  var g = nodes.enter().append('svg:g');

  g.append("svg:circle")
    .attr("r", 10)
    .style("fill", function(d, i) {
      return colors(i);
    }).on("mouseover", function() {
      d3.select(this)
        .attr("r", 15);
    }).on("mouseout", function() {
      d3.select(this)
        .transition()
        .duration(500)
        .attr("r", 10);
    });

  g.append("text")
      .attr('x', 0)
      .attr('y', 4)
      .attr('class', 'id')
      .text(function(d) { return d.name ;  });

  circle.exit().remove();
}
canvasUpdate();
      
//External node update; works with svg:g
var updateNode = function() {
  this.attr("transform", function(d) {
    return "translate("+d.x+","+ d.y+")";
  });
}     

//Every time the simulation "ticks", this will be called
function tick() {

  edges.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  nodes.call(updateNode); 

  // path.attr('d',function(d){
  //   d.attr("x1", function(d) { return d.source.x; })
  //     .attr("y1", function(d) { return d.source.y; })
  //     .attr("x2", function(d) { return d.target.x; })
  //     .attr("y2", function(d) { return d.target.y; });
  //   return 'M' + d.source.x + ',' + d.source.y + 'L' + d.target.x + ',' + d.target.y;
  // });

  // circle.attr('transform', function(d) {
  //   return 'translate(' + d.x + ',' + d.y + ')';
  // });

  //nodes.attr("cx", function(d) { return d.x; })
  //   .attr("cy", function(d) { return d.y; });
  // nodes.call(updateNode); 

}

function testPush(){
  node = {name: "Kevin", id: 10};
  node.x = 100;
  node.y = 100;
  dataset.nodes.push(node);
  canvasUpdate()
}