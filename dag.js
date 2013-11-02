// app mode constants
var MODE = {
      EDIT: 0,
      EVAL: 1
    },
    appMode = MODE.Edit;

var forceOn = false;

// set up SVG for D3
var width  = 600,
    height = 400,
    colors = d3.scale.category10();

var svg = d3.select('#graphic')
  .append('svg')
  .attr('width', width)
  .attr('height', height);

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are always source < target; edge directions are set by 'left' and 'right'.

var currentNoteList = localStorage.getItem('notelist');

var nodes = [
    {id: 0, reflexive: false, title: 'who'},
    {id: 1, reflexive: true, title: 'what' },
    {id: 2, reflexive: false, title: 'where'}
  ],
  lastNodeId = nodes.length-1,
  links = [
    {source: nodes[0], target: nodes[1], left: false, right: true, line: 0 },
    {source: nodes[1], target: nodes[2], left: false, right: true, line: 0 }
  ];

// apply the accessor function, but in the case of
// chaining return our closure, not the original
function rm(f) {
  return function() {
    var r = f.apply(this, arguments);
    return arguments.length ? my : r;
  }
}

// init D3 force layout
var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([width, height])
    /*.linkDistance(150)
    .charge(-500)*/
    .charge(-100)
    .gravity(0.05)
    .linkStrength(1)
    .linkDistance(80)
    .on('tick', tick)

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
var path = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g');

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

// update force layout (called automatically each iteration)
function tick() {
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

  circle.attr('transform', function(d) {
    return 'translate(' + d.x + ',' + d.y + ')';
  });
}

// update graph (called when needed)
function restart() {
  console.log("Called Restart");
  // path (link) group
  path = path.data(links);

  // update existing links
  path
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; });

  path.attr('class','link')
    .classed('selected', function(d) { return d === selected_link; })
    .style('stroke-width', 10)
    .style('stroke', function(d){return d3.rgb(colors(d.line));});

  // add new links
  path.enter().append('svg:path')
    .attr('class', 'link')
    .classed('selected', function(d) { return d === selected_link; })
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })
    .style('stroke-width', 10)
    .style('stroke', function(d){return d3.rgb(colors(d.line));})
    //.style('stroke-dasharray', "5,5")
    .on('mousedown', function(d) {
      if(d3.event.ctrlKey) return;

      // select link
      mousedown_link = d;
      if(mousedown_link === selected_link) selected_link = null;
      else selected_link = mousedown_link;
      selected_node = null;
      restart();
    });

  // remove old links
  path.exit().remove();


  // circle (node) group
  // NB: the function arg is crucial here! nodes are known by id, not by index!
  circle = circle.data(nodes, function(d) { return d.id; });

  // update existing nodes (reflexive & selected visual states)
  circle.selectAll('circle')
    .style('fill', function(d) { return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id); })
    .classed('reflexive', function(d) { return d.reflexive; });

  // add new nodes
  var g = circle.enter().append('svg:g');

  g.append('svg:circle')
    .attr('class', 'node')
    .attr('r', 12)
    .style('fill', function(d) { return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id); })
    .style('stroke', function(d) { return d3.rgb(colors(d.id)).darker().toString(); })
    .classed('reflexive', function(d) { return d.reflexive; })
    .on('mouseover', function(d) {
      if(!mousedown_node || d === mousedown_node) return;
      // enlarge target node
      d3.select(this).attr('transform', 'scale(1.1)');
    })
    .on('mouseout', function(d) {
      if(!mousedown_node || d === mousedown_node) return;
      // unenlarge target node
      d3.select(this).attr('transform', '');
    })
    .on('dblclick', function(d) {
        dblclick_node = d;
            
    })
    .on('mousedown', function(d) {
      if(d3.event.ctrlKey) return;
    
      // select node
      mousedown_node = d;
      if(mousedown_node === selected_node) selected_node = null;
      else selected_node = mousedown_node;
      selected_link = null;
      currentDoc = d.title;
      editable.innerHTML = localStorage.getItem(currentDoc);
      localStorage.setItem(currentDoc, editable.innerHTML);

      // reposition drag line
      drag_line
        .style('marker-end', 'url(#end-arrow)')
        .classed('hidden', false)
        .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);

      restart();
    })
    .on('mouseup', function(d) {
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

      // add link to graph (update if exists)
      // NB: links are strictly source < target; arrows separately specified by booleans
      var source, target, direction;
      if(mousedown_node.id < mouseup_node.id) {
        source = mousedown_node;
        target = mouseup_node;
        direction = 'right';
      } else {
        source = mouseup_node;
        target = mousedown_node;
        direction = 'left';
      }

      var link;
      link = links.filter(function(l) {
        return (l.source === source && l.target === target);
      })[0];

      if(link) {
        link[direction] = true;
      } else {
        link = {source: source, target: target, left: false, right: false, line : 0};
        link[direction] = true;
        links.push(link);
      }

      // select new link
      selected_link = link;
      selected_node = null;
      restart();
    });

  // show node IDs
  g.append('svg:text')
      .attr('x', 0)
      .attr('y', 4)
      .attr('class', 'id')
      .text(function(d) { return d.title ; });

  // remove old nodes
  circle.exit().remove();

  // set the graph in motion
  force.start();
  forceOn = true;
}

function mousedown() {
  // prevent I-bar on drag
  //d3.event.preventDefault();
  
  // because :active only works in WebKit?
  svg.classed('active', true);

  if(d3.event.ctrlKey || mousedown_node || mousedown_link) return;

  // insert new node at point
  var point = d3.mouse(this),
      node = {id: ++lastNodeId, reflexive: false};

  //console.log(point[0]+" "+ point[1]);
  node.x = point[0];
  node.y = point[1];
  nodes.push(node);

  restart();
}

function dblclick() {
    console.log(dblclick_node);
// insert new node at point
    var point = d3.mouse(this),
    node = {id: ++lastNodeId, reflexive: false};
    node.x = point[0];
    node.y = point[1];
    nodes.push(node);
    links.push({source: nodes[dblclick_node["id"]], target: nodes[lastNodeId], left: false, right: true, line: 0 });

    restart();
}

$('#create').keyup(function (event) {
  console.log("KEYUP!" + event.keyCode);
  if(event.keyCode == 13){
  //if(true){
    console.log("creating node "+this.value);
    var newDocId = this.value; 
// insert new node at point
    node = {id: ++lastNodeId, reflexive: false, title : newDocId};
    node.x = 100;
    node.y = 100;
    nodes.push(node);
    restart();
  }
});

function mousemove() {
  if(!mousedown_node) return;

  // update drag line
  drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);

  restart();
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

function spliceLinksForNode(node) {
  var toSplice = links.filter(function(l) {
    return (l.source === node || l.target === node);
  });
  toSplice.map(function(l) {
    links.splice(links.indexOf(l), 1);
  });
}

// only respond once per keydown
var lastKeyDown = -1;

function keydown() {
  console.log("keydown event "+d3.event.keyCode);
  d3.event.preventDefault();

  if(lastKeyDown !== -1) return;
  lastKeyDown = d3.event.keyCode;

  // ctrl
  if(d3.event.keyCode === 17) {
    circle.call(force.drag);
    /*circle
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr('transform', function(d) {
        return 'translate(' + d.x + ',' + d.y + ')';
      })
      .call(d3.behavior.drag()
        .origin(function(d) { return d; })
        .on("drag", function(d) {
          force
            .nodes(d)
            .links(links.filter(function(l){return (l.source.id == d.id || l.target.id == d.id);}));
          d.x = d3.event.x, d.y = d3.event.y;
          d3.select(this).attr("cx", d.x).attr("cy", d.y);
          path.filter(function(l) { return l.source === d; }).attr("x1", d.x).attr("y1", d.y);
          path.filter(function(l) { return l.target === d; }).attr("x2", d.x).attr("y2", d.y);
        }));*/
    svg.classed('ctrl', true);
  }

  if(!selected_node && !selected_link) return;
  switch(d3.event.keyCode) {
    case 8: // backspace
    case 46: // delete
      if(selected_node) {
        nodes.splice(nodes.indexOf(selected_node), 1);
        spliceLinksForNode(selected_node);
        var notename = selected_node.title;
        $('#'+notename).parent().remove();
        localStorage.setItem(notename,'');
        localStorage.setItem('notelist',lb.innerHTML);
      } else if(selected_link) {
        links.splice(links.indexOf(selected_link), 1);
      }
      selected_link = null;
      selected_node = null;
      restart();
      break;
    case 66: // B
      if(selected_link) {
        // set link direction to both left and right
        selected_link.left = true;
        selected_link.right = true;
      }
      restart();
      break;
    case 67: // C
      if(selected_link) {
        // Increment line membership
        selected_link.line++
      }
      restart();
      break;
    case 76: // L
      if(selected_link) {
        // set link direction to left only
        selected_link.left = true;
        selected_link.right = false;
      }
      restart();
      break;
    case 82: // R
      if(selected_node) {
        // toggle node reflexivity
        selected_node.reflexive = !selected_node.reflexive;
      } else if(selected_link) {
        // set link direction to right only
        selected_link.left = false;
        selected_link.right = true;
      }
      restart();
      break;
  }
}

function keyup() {
  lastKeyDown = -1;

  // ctrl
  if(d3.event.keyCode === 17) {
    circle
      .on('mousedown.drag', null)
      .on('touchstart.drag', null);
    svg.classed('ctrl', false);
  }
}

function setAppMode(newMode) {
  // mode-specific settings
  if(newMode === MODE.EDIT) {
    // enable listeners
    svg.classed('edit', true)
      .on('mousedown', mousedown)
      .on('mousemove', mousemove)
      .on('mouseup', mouseup);
    d3.select(window)
      .on('keydown', keydown)
      .on('keyup', keyup);

    // remove eval classes
    circle
      .classed('waiting', false)
      .classed('true', false)
      .classed('false', false);
    currentFormula.classed('inactive', true);
  } else if(newMode === MODE.EVAL) {
    // disable listeners (except for I-bar prevention)
    svg.classed('edit', false)
      .on('mousedown', function() { d3.event.preventDefault(); })
      .on('mousemove', null)
      .on('mouseup', null);
    d3.select(window)
      .on('keydown', null)
      .on('keyup', null);

    // in case ctrl still held
    circle
      .on('mousedown.drag', null)
      .on('touchstart.drag', null);
    svg.classed('ctrl', false);
    lastKeyDown = -1;

    // in case still dragging
    drag_line
      .classed('hidden', true)
      .style('marker-end', '');

    // clear mouse vars
    selected_link = null;
    setSelectedNode(null);
    resetMouseVars();

    // reset eval state
    circle.classed('waiting', true);
    evalOutput.classed('inactive', true);
  } else return;

  // switch button and panel states and set new mode
  modeButtons.each(function(d,i) {
    if(i !== newMode) d3.select(this).classed('active', false);
    else d3.select(this).classed('active', true);
  });
  panes.each(function(d,i) {
    if(i !== newMode) d3.select(this).classed('active', false);
    else d3.select(this).classed('active', true);
  });
  appMode = newMode;

  restart();
}

$('#pause').bind("click", function () {
          if(forceOn){
            console.log("Paused Forces");
            force.stop();
            forceOn = false;
          }else if(!forceOn){
            console.log("Unpaused Forces");
            force.start();
            forceOn = true;
          }
});

// app starts here
svg.on('mousedown', mousedown)
  .on('mousemove', mousemove)
  .on('mouseup', mouseup)
  .on('dblclick',dblclick);
d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);
restart();
