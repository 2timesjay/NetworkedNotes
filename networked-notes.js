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

var indexer = {};//Chronicles add order(?)

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
  var source = graph.nodes.filter(function(d){return d.id == sourceId;})
  var target = graph.nodes.filter(function(d){return d.id == targetId;})
  var sourceIndex = graph.nodes.indexOf(source[0]);
  var targetIndex = graph.nodes.indexOf(target[0]);
  if(graph.edges.filter(function(d){
      return (d.source.id == sourceId && d.target.id == targetId)
        || (d.source.id == targetId && d.target.id == sourceId);
    }).length == 0){
    console.log(sourceIndex+" to "+targetIndex);
    graph.edges.push({source: sourceIndex, target:targetIndex, line: 0});
  }
}

function spliceLinksForNode(node) {
  var toSplice = graph.edges.filter(function(l) {
    return (l.source === node || l.target === node);
  });
  toSplice.forEach(function(l) {
    graph.edges.splice(graph.edges.indexOf(l), 1);
  });
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

// define arrow markers for graph edges
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


// handles to edge and node element groups
// Won't work unless we already append the svg:g
// Can't try to keep redoing the original minGraph
// Nodes assignment
var path = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g');

// mouse event vars
var selected_node = null,//Eventified
    selected_edge = null,//Eventified
    dblclick_node = null,//Eventified
    mousedown_edge = null,
    mousedown_node = null,
    mouseup_node = null;

//Event-based management of mouse event
var selectEdge = function(edge){
  edge = (typeof edge === "undefined") ? selected_edge : edge;
  // if(edge == null){selected_edge = null; return;}
  selected_edge = edge;
  path.attr('class','link')
    .classed('selected', function(d) {return d === selected_edge; })
}

var selectNode = function(node){
  node = (typeof node === "undefined") ? selected_node : node;
  // if(node == null){selected_node = null; return;}
  selected_node = node;
  circle.selectAll('circle')
     .style('stroke', function(d) { return (d === selected_node)? "#000" : d3.rgb(colors(indexer[d.id])).darker().toString(); })
}

var dblclickNode = function(node){
  node = (typeof node === "undefined") ? dblclick_node : node;
  if(node == null){dblclick_node = null; return;}
  else{
    dblclick_node = node;
    dblclick_node.fixed = !dblclick_node.fixed;
  }
  circle.selectAll('circle')
    .style('fill', function(d) { return (d.fixed) ? d3.rgb(colors(indexer[d.id])).darker().darker().toString() : colors(indexer[d.id]); })
}

function resetMouseVars() {
  dblclickNode(null);
  mousedown_node = null;
  mouseup_node = null;
  mousedown_edge = null;
}

/**
 * updateCanvas is an update loop that need 
 * only run on model updates.
 */
function updateCanvas(){
  updateGraph();

  // path = path.data(graph.edges);
  path = path.data(graph.edges,function(d){return d.source.id+"-"+d.target.id;});
  
  // update existing edges
  path
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; });

  path.attr('class','link')
     .style('stroke-width', 5)
    .style('stroke', function(d){return d3.rgb(colors(d.line));});

  // add new links
  path.enter().append('svg:path')
    .attr('class', 'link')
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })
    .style('stroke-width', 5)
    .style('stroke', function(d){return d3.rgb(colors(d.line));})
    .on('mousedown', function(d) {
      if(d3.event.ctrlKey) return;

      // select link
      mousedown_edge = d;
      if(mousedown_edge === selected_edge) selectEdge(null);
      else selectEdge(mousedown_edge);
      selectNode(null);
    });

  selectEdge();

  path.exit().remove()


  circle = circle.data(graph.nodes,function(d) { return d.id; })

  // add new nodes
  var g = circle.enter().append('svg:g');
  // console.log(g);

  g.append("svg:circle")    
    .attr('class', 'node')
    .attr('r', 12)
    .style('fill', function(d) { return colors(indexer[d.id]); })
    .style('stroke', function(d) { return d3.rgb(colors(indexer[d.id])).darker().toString(); })
    .on('mouseover', function(d) {
      // if(!mousedown_node || d === mousedown_node) return;
      // enlarge target node
      d3.select(this).attr('transform','scale(1.25)');
    }).on("mouseout", function() {
      d3.select(this)
        .transition()
        .duration(500)
        .attr('transform','');
    }).on('dblclick', function(d) {
        dblclickNode(d);
    }).on('mousedown', function(d) {
      if(d3.event.ctrlKey) return;
      // select node
      mousedown_node = d;
      //deselect by clicking selected
      if(mousedown_node === selected_node) selectNode(null);
      else selectNode(mousedown_node);
      selectEdge(null);

      // reposition drag line
      drag_line
        .style('marker-end', 'url(#end-arrow)')
        .classed('hidden', false)
        .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);
    }).on('mouseup', function(d) {
      if(!mousedown_node) return;

      // needed by FF
      drag_line
        .classed('hidden', true)
        .style('marker-end', '');

      // check for drag-to-self
      mouseup_node = d;
      if(mouseup_node === mousedown_node) { resetMouseVars(); return; }

      // unenlarge target node
      d3.select(this).attr('transform', '');

      // add edge to graph (update if exists)
      // NB: edges are strictly source < target; arrows separately specified by booleans
      var source, target, direction;
      addEdge(mousedown_node.id, mouseup_node.id) 

      // select new edge TODO; currently null edge
      selectEdge(null);
      selectNode(null);
      updateCanvas();
    });

  // g.append(Mustache.to_html(d3TestTemplate,''))

  g.append("text")
      .attr('x', 0)
      .attr('y', 4)
      .attr('class', 'id')
      .text(function(d) { return d.id ;  });

  selectNode();
  dblclickNode();

  circle.exit().remove();

  // circle.call(force.drag);

  force.start()
}
updateCanvas();

function mousedown() {
  // prevent I-bar on drag
  //d3.event.preventDefault();
  
  // because :active only works in WebKit?
  svg.classed('active', true);

  if(d3.event.ctrlKey || mousedown_node || mousedown_edge) return;

  // // insert new node at point
  // var point = d3.mouse(this),
  //     node = {id: "test", title: "test"};

  // //console.log(point[0]+" "+ point[1]);
  // node.x = point[0];
  // node.y = point[1];
  // graph.nodes.push(node);

  // updateCanvas();
}

function mousemove() {
  if(!mousedown_node) return;

  // update drag line
  drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);
}

function mouseup() {
  if(mousedown_node) {
    // hide drag line
    drag_line
      .classed('hidden', true)
      .style('marker-end', '');
  }

  // because :active only works in WebKit?
  svg.classed('active', false);

  // clear mouse event vars
  resetMouseVars();
}

function keydown() {
  console.log("keydown event "+d3.event.keyCode);
  // d3.event.preventDefault();

  if(lastKeyDown !== -1) return;
  lastKeyDown = d3.event.keyCode;

  // d
  if(d3.event.keyCode === 68) {
    circle.call(force.drag);
    svg.classed('draggable', true);
  }

  if(!selected_node && !selected_edge) return;
  switch(d3.event.keyCode) {
    case 8: // backspace
    case 46: // delete
      if(selected_node) {
        graph.nodes.splice(graph.nodes.indexOf(selected_node), 1);
        spliceLinksForNode(selected_node);
        var notename = selected_node.title;
      } else if(selected_edge) {
        graph.edges.splice(graph.edges.indexOf(selected_edge), 1);
      }
      selectNode(null);
      selectNode(null);
      updateCanvas();
      break;
    case 66: // B
      if(selected_edge) {
        // set link direction to both left and right
        selected_edge.left = true;
        selected_edge.right = true;
      }
      updateCanvas();
      break;
    case 67: // C
      if(selected_edge) {
        // Increment line membership
        selected_edge.line++
      }
      updateCanvas();
      break;
    case 76: // L
      if(selected_edge) {
        // set link direction to left only
        selected_edge.left = true;
        selected_edge.right = false;
      }
      updateCanvas();
      break;
  }
}

function keyup() {
  lastKeyDown = -1;

  // ctrl
  if(d3.event.keyCode === 68) {
    circle
      .on('mousedown.drag', null)
      .on('touchstart.drag', null);
    svg.classed('draggable', false);
  }
}
      
//External node update; works with svg:g
var updateNode = function() {
  this.attr("transform", function(d) {
    return "translate("+d.x+","+ d.y+")";
  });
}     

//Every time the simulation "ticks", this will be called
function tick() {
  //Octoforce rotates edges around their midpoint towards
  //The nearest octilinear direction
  var k = 0.1;
  var directions = octilinear;
  path.attr('d', function(d) { 
    // discover the closest octilinear direction (dir is
    // the orthonormal vector for that direction), and then
    // calculate the new link by rotating around the centroid
    // to align with that direction.)
    var v = vec2(d.source, d.target);
    // XXX how to stop overlapping?  nudging the edge too far is
    // not stable...
    // XXX this should respect friction
    var dir = maxr(directions, function(x) {return dot(x,v)});
    // XXX refactor me, extra lines for handling 'fixed' nodes
    if (d.source.fixed & 1) {
      var center = vec(d.source);
      var ray = scale(norm(v), dir);
      d.target.x += (center[0] + ray[0] - d.target.x) * k;
      d.target.y += (center[1] + ray[1] - d.target.y) * k;
    } else if (d.target.fixed & 1) {
      var center = vec(d.target);
      var ray = scale(norm(v), dir);
      d.source.x += (center[0] - ray[0] - d.source.x) * k;
      d.source.y += (center[1] - ray[1] - d.source.y) * k;
    } else {
      var center = centroid([vec(d.source), vec(d.target)]);
      var ray = scale(norm(v)/2, dir);
      d.source.x += (center[0] - ray[0] - d.source.x) * k;
      d.source.y += (center[1] - ray[1] - d.source.y) * k;
      d.target.x += (center[0] + ray[0] - d.target.x) * k;
      d.target.y += (center[1] + ray[1] - d.target.y) * k;
    }
  });

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

  //Node monoforce constraint: order by index along x
  var k = 0.1;
  var i;
  for (i = 0; i < graph.nodes.length - 1; i++) {
    var begin = graph.nodes[i];
    var end = graph.nodes[i+1];
    if (begin.x > end.x) {
      var delta = begin.x - end.x;
      begin.x -= delta/2 * k;
      end.x += delta/2 * k;
    }
  }

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
svg.classed('edit', true)
  .on('mousedown', mousedown)
  .on('mousemove', mousemove)
  .on('mouseup', mouseup);
d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);