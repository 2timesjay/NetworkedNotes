/*
This is the new networked notes graph code.
Hopefully it will stay well-contained.
I am re-building the functionality of dag
and metromap from the ground up.

What actually goes on with graph.nodes vs circle and graph.edges vs path?
Circles and path bind the graph data to a bunch of stuff related to managing 
svg and interaction. You can add an edge referencing source and target path
elements, but not source and target node.edges. Path and circle elements also
have x,y and px,py information, i.e. the most vital stuff for actual rendering. 
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
    { source: 0, target: 1, line: 0 },
    { source: 0, target: 2, line: 0 },
    { source: 0, target: 3, line: 0 },
    { source: 0, target: 4, line: 0 },
    { source: 1, target: 5, line: 0 },
    { source: 2, target: 5, line: 0 },
    { source: 2, target: 5, line: 0 },
    { source: 3, target: 4, line: 0 },
    { source: 5, target: 8, line: 0 },
    { source: 5, target: 9, line: 0 },
    { source: 6, target: 7, line: 0 },
    { source: 7, target: 8, line: 0 },
    { source: 8, target: 9, line: 0 }
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
          return {source: sourceIndex, target:targetIndex, line:0};
          // return {source: graph.nodes[sourceIndex],target: graph.nodes[targetIndex]}
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
    indexer[note.id] = Object.keys(indexer).length;
    var node = {id: note.id, title: note.title};
    graph.nodes.push(node);
    //Create and push it's indexed edges
    // var sourceIndex = indexer[note.id]
    // source = note
    if(!("edges" in note)){ return []}
    var potentialNodeEdges = note.edges;
    var nodeEdges = potentialNodeEdges
      .filter(function(pne){
        return pne in indexer;
      }).forEach(function(pne){
        console.log("adding edge to "+pne)
        // var targetIndex = indexer[pne];
        addEdge(note.id,pne)
        // return {source: sourceIndex, target:targetIndex};
        // return {source: graph.nodes[sourceIndex],target: graph.nodes[targetIndex]}
      });
    // graph.edges.push.apply(graph.edges,node.edges); 
  }
}

var addEdge = function(sourceId, targetId){
  console.log(sourceId+" to "+targetId);
  var sourceIndex = indexer[sourceId];
  var targetIndex = indexer[targetId];
  console.log(sourceIndex+" to "+targetIndex);
  graph.edges.push({source: sourceIndex, target:targetIndex, line: 0});
}

// TODO: change to handle nodes that have been modified
// Simply adds nodes right now, can't deal with edges
var updateGraph = function(){
  var graphData = activeNotes
  graphData
    .filter(function(node){return !(node.id in indexer);})
    .forEach(addNode);
}

// mouse event vars
var selected_node = null,
    selected_link = null,
    mousedown_link = null,
    mousedown_node = null,
    dblclick_node = null,
    mouseup_node = null;

function resetMouseVars() {
  dblclick_node = null;
  mousedown_node = null;
  mouseup_node = null;
  mousedown_link = null;
}

//Initialize a default force layout, using the nodes and edges in graph
var force = d3.layout.force()
           .nodes(graph.nodes)
           .links(graph.edges)
           .size([w, h])
           .linkDistance([80])
           .charge([-100])
           .on("tick",tick)
           .start();

var colors = d3.scale.category20();

//Create SVG element
var svg = d3.select("#graphic")
      .append("svg")
      .attr("width", w)
      .attr("height", h);

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#000');

// line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
  .attr('class', 'link dragline hidden')
  .attr('d', 'M0,0L0,0');


// handles to link and node element groups
// Won't work unless we already append the svg:g
// Can't try to keep redoing the original minGraph
// Nodes assignment
var path = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g');

function updateCanvas(){
  // graph = dataToGraph();
  // var newGraph = dataToGraph();
  // refreshGraph();
  updateGraph();

  path = path.data(graph.edges)
  
  // update existing links
  path
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; });

  path.attr('class','link')
    .classed('selected', function(d) { return d === selected_link; })
    .style('stroke-width', 5)
    .style('stroke', function(d){return d3.rgb(colors(d.line));});

  // add new links
  path.enter().append('svg:path')
    .attr('class', 'link')
    .classed('selected', function(d) { return d === selected_link; })
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })
    .style('stroke-width', 5)
    .style('stroke', function(d){return d3.rgb(colors(d.line));})
    // .style('stroke-dasharray', "5,5")
    .on('mousedown', function(d) {
      if(d3.event.ctrlKey) return;

      // select link
      mousedown_link = d;
      if(mousedown_link === selected_link) selected_link = null;
      else selected_link = mousedown_link;
      selected_node = null;

      updateCanvas();
    });

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
updateCanvas();
      
//External node update; works with svg:g
var updateNode = function() {
  this.attr("transform", function(d) {
    return "translate("+d.x+","+ d.y+")";
  });
}     

//Every time the simulation "ticks", this will be called
function tick() {
  // svg:path version
  // draw directed edges with proper padding from node centers
  path.attr('d', function(d) {
    var deltaX = d.target.x - d.source.x,
        deltaY = d.target.y - d.source.y,
        dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
        normX = deltaX / dist,
        normY = deltaY / dist,
        sourcePadding = d.left ? 17 : 12,
        targetPadding = d.right ? 17 : 12,
        sourceX = d.source.x + (sourcePadding * normX),
        sourceY = d.source.y + (sourcePadding * normY),
        targetX = d.target.x - (targetPadding * normX),
        targetY = d.target.y - (targetPadding * normY);
    return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
  });

  //draw nodes
  circle.attr('transform', function(d) {
    return 'translate(' + d.x + ',' + d.y + ')';
  });
}

function testNodePush(){
  note = {id: "yyy",title:"yyy",text:"yyytext"};
  activeNotes.push(note);
  updateCanvas();
}

function testNodeEdgePush(){
  note = {id: "zzz",title:"zzz",edges:["who"],text:"zzztext"};
  activeNotes.push(note);
  updateCanvas();
}

// app starts here
// svg.on('mousedown', mousedown)
//   .on('mousemove', mousemove)
//   .on('mouseup', mouseup)
//   .on('dblclick',dblclick);