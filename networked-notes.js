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
var graph = {
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

var indexer = {};

//Transforms Object-format activeNotes into
//a new graph. This will reset everything even
//if the update is incremental
var refreshGraph = function(){
  var graphData = activeNotes
  var newNodes = graphData
    .map(function(note){
      // var node = {id: note.id, title: note.title, x: w/2, y:h/2};
      var node = {id: note.id, title: note.title};
      return node; 
    });  

  var nodeIds = graphData.map(function(node){return node.id;});

  nodeIds.forEach(function(val,idx){indexer[val] = idx;});
  // for(var i = 0; i < nodeIds.length; i++){indexer[nodeIds[i]] = i;}

  var newEdges = []
  var newEdgesList = graphData
    .map(function(note){
      var sourceIndex = indexer[note.id]
      if(!("edges" in note)){ return []}
      var potentialNodeEdges = note.edges;
      var nodeEdges = potentialNodeEdges
        .filter(function(pne){
          return pne in indexer;
        }).map(function(pne){
          var targetIndex = indexer[pne];
          return {source: sourceIndex, target:targetIndex};
        });
      return nodeEdges;
    });
  var merged = []
  newEdges = merged.concat.apply(merged,newEdgesList);
  var newGraph = {};
  newGraph.nodes = newNodes;
  newGraph.edges = newEdges;
  // console.log(newGraph)
  //update graph data structure without causing problems
  //with force; would require force().nodes(...) etc otherwise
  graph.nodes.length = 0;
  graph.nodes.push.apply(graph.nodes,newGraph.nodes);
  graph.edges.length = 0;
  graph.edges.push.apply(graph.edges,newGraph.edges);
}
refreshGraph();

//Updates graph from activeNotes not currently included
//Gentler, doesn't reset all our forces.
var addNode = function(note){
  if(!(note.id in indexer)){
    //Create and push a new node
    indexer[note.id] = indexer.length
    var node = {id: note.id, title: note.title};
    graph.nodes.push(node);
    //Create and push it's indexed edges
    var sourceIndex = indexer[note.id]
    if(!("edges" in note)){ return []}
    var potentialNodeEdges = note.edges;
    var nodeEdges = potentialNodeEdges
      .filter(function(pne){
        return pne in indexer;
      }).map(function(pne){
        var targetIndex = indexer[pne];
        return {source: sourceIndex, target:targetIndex};
      });
    graph.edges.push.apply(graph.edges,node.edges); 
  }
}

// TODO: change to handle nodes that have been modified
// Simply adds nodes right now, can't deal with edges
var updateGraph = function(){
  var graphData = activeNotes
  graphData
    .filter(function(node){return !(node.id in indexer);})
    .forEach(addNode);
}

//Initialize a default force layout, using the nodes and edges in graph
var force = d3.layout.force()
           .nodes(graph.nodes)
           .links(graph.edges)
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

function canvasUpdate(){
  // graph = dataToGraph();
  // var newGraph = dataToGraph();
  // refreshGraph();
  updateGraph();

  path = path.data(graph.edges)
  
  path.enter()
    .append("svg:path")
    // .append("line")
    .style("stroke", "#ccc")
    .style("stroke-width", 3);

  path.exit().remove()

  circle = circle.data(graph.nodes,function(d) { return d.id; })

  var g = circle.enter().append('svg:g');

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

  // g.append(Mustache.to_html(d3TestTemplate,''))

  g.append("text")
      .attr('x', 0)
      .attr('y', 4)
      .attr('class', 'id')
      .text(function(d) { return d.id ;  });

  circle.exit().remove();

  circle.call(force.drag);

  force.start()
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
  // draw edges
  // svg:path version
  path.attr('d', function(d) {
    var sourceX = d.source.x,
        sourceY = d.source.y,
        targetX = d.target.x,
        targetY = d.target.y;
    return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
  });
  // line version
  // path.attr("x1", function(d) { return d.source.x; })
  //   .attr("y1", function(d) { return d.source.y; })
  //   .attr("x2", function(d) { return d.target.x; })
  //   .attr("y2", function(d) { return d.target.y; });

  //draw nodes
  circle.attr('transform', function(d) {
    return 'translate(' + d.x + ',' + d.y + ')';
  });
}

function testPush(){
  node = {name: "Kevin", id: 10};
  node.x = 100;
  node.y = 100;
  graph.nodes.push(node);
  canvasUpdate()
}