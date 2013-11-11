// set up the index, specifying that we want to index the title, tags and body fields of documents.
//var idx



var selectedQuestion = -1

var idx= lunr(function () {
  this.field('title', {boost: 10})
  this.field('content')
  this.ref('id')
})

// activeNotes is the primary data location, or data model.
// Notes, question-view(slightly) and canvas should treat this as primary.
// work closely with this.
var activeNotes = [ 
  {id:"who", title:"who", edges:["what"], text: "whotext", working: true},
  {id:"what",title:"what", edges:["where"], text: "whattext", working: true},
  {id:"where",title:"where", text: "wheretext", working: true},
  {id:"why",title:"why", edges:["where", "what"], text: "whytext", working: true},
  {id:"how",title:"how", edges:["who"], text: "howtext", working: false}
];

var noteIds = function(){
  return activeNotes.map(function(note){return note.id;})
}


$(document).ready(function () {

  // load view templates
  var questionViewTemplate = $("#question-view-template").text()
  var questionListTemplate = $("#question-list-template").text()
  var noteListTemplate = $("#note-list-template").text()
  var renderQuestionList = function (qs) {
    $("#question-list-container")
      .empty()
      .append(Mustache.to_html(questionListTemplate, {questions: qs}))
  }

  var renderNoteList = function (ns) {
    // $("#note-list-container")
    // console.log(Mustache.to_html(noteListTemplate, {notes: ns}))
    $("#menu")
      .empty()
      .append(Mustache.to_html(noteListTemplate, {notes: ns}));

    $('.note').bind('click', function () {
      // console.log(this)
      var currentDoc = this.id;
      editable.innerHTML = activeNotes
        .filter(function(d){return d.id == currentDoc;})[0]
        .text
    });

    updateWorkingStatus(ns)
  }

  var updateWorkingStatus = function(ns){
    var workingSet = {};
    ns.filter(function(n){return n.working;})
      .forEach(function(n){workingSet[n.id] = true;});
    var archiveSet = {};
    ns.filter(function(n){return !n.working;})
      .forEach(function(n){archiveSet[n.id] = true;});

    $('.note').filter(function(){
      return this.id in workingSet;
    }).each(function(){
      $("#working-notes")
        .append($(this).parent());
    })

    $('.note').filter(function(){
      return this.id in archiveSet;
    }).each(function(){
      $("#archived-notes")
        .append($(this).parent());
    })
  }

  var renderQuestionView = function (question) {
    $('.pup')
      .empty()
      .append(Mustache.to_html(questionViewTemplate, question))
    // popupSelector.html($('#pup'))

    $('.add-control').bind("click", function () {
      // console.log("Clicked on Add To Canvas");
      var newDocId = selectedQuestion.id 
      var newNote = {id: newDocId, title: newDocId,text:newDocId+"text"}
      activeNotes.push(newNote)
      renderNoteList(activeNotes)
      var newDocId = newDocId; 
      // insert new node at point
      // node = {id: ++lastNodeId, reflexive: false, name : newDocId};
      // node.x = 100;
      // node.y = 100;
      // graph.nodes.push(node);
      updateCanvas();
    });
  }

  profile = function (term) {
    console.profile()
    idx.search(term)
    console.profileEnd()
  }

  search = function (term) {
    console.time('search')
    idx.search(term)
    console.timeEnd('search')
  }

  renderNoteList(activeNotes)

  // load the example data
  $.getJSON('short.json', function (data) {
    // console.log(data);
    // format the raw json into a form that is simpler to work with
    questions = data.map(function (raw) {
      return {
        id: raw.id,
        title: raw.title,
        body: raw.content
      }
    })

    questions.map(function(question){idx.add(question);})
    renderQuestionList(questions)
    // renderQuestionView(questions[0],$('#question-view-container'))

    $('a.all').bind('click', function () {
      renderQuestionList(questions)
      $('input').val('')
    })

    var debounce = function (fn) {
      var timeout
      return function () {
        var args = Array.prototype.slice.call(arguments),
            ctx = this

        clearTimeout(timeout)
        timeout = setTimeout(function () {
          fn.apply(ctx, args)
        }, 100)
      }
    }

    $('#search-control').bind('keyup', debounce(function () {
      if ($(this).val() < 2) return
      var query = $(this).val()
      var results = idx.search(query).map(function (result) {
        return questions.filter(function (q) { return parseInt(q.id) === parseInt(result.ref, 10) })[0]
      })
      console.log(results)
      renderQuestionList(results)
    }))

    // clicking a list item displays it in the main view
    $("#question-list-container").delegate('li', 'click', function () {
      var li = $(this)
      var id = li.data('question-id')

      selectedQuestion = questions.filter(function (question) {
        return (question.id == id)
      })[0]
      renderQuestionView(selectedQuestion)
      // console.log(selectedQuestion.id)
    })
  })
})