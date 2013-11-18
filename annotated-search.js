/**
Annotated-search is where I prototype a refactor and improvement of
the search and note creation/management functions. It should be entirely
or almost entirely compatible with the un-refactored graph module, and
provide a clean interface. I will eventually separate the search module
from the note module.

There are three classes of notes, the core object: 
document notes: a note based on the original document.
child notes: a note about one of the documents; 
  a child of it's corresponding document note
free notes: a note without an associated document.

relation between document notes and their children:
-A child is only considered working if its parent is too.
-A child displays its parent's text in parallel if it is displayed
-A child can be associated with a particular excerpt in the parent
-A child has the same date and ordering as its parent for display purposes.
-A child knows its parent

  */

var selectedQuestion = -1
//selectedDoc is a ko.observable
var selectedDoc = ko.observable("4464")

var idx= lunr(function () {
  this.field('title', {boost: 10})
  this.field('content')
  this.ref('id')
})

//Ripped form Stackoverflow
function genRandId(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

//Note corresponding to a primary document
function docNote(docId,title,text){
  var note = {}
  note.id = docId;//Id of the note: docId + a random string
  note.title = title;//Title of the note
  note.edges = ko.observableArray([]);//Edges from the note to other notes
  note.text = text;
  note.working = ko.observable(false);
  return note;
}

//Note associated with a document; child of corresponding docNote
function childNote(parentId, title, edges, text, working){
  var note = {}
  note.parent = parentId
  note.id = parentId + genRandId();//Id of the note: docId + a random string
  note.title = ko.observable(title);//Title of the note
  note.edges = ko.observableArray(edges);//Edges from the note to other notes
  note.text = ko.observable(text);
  note.working = ko.observable(working);
  return note;
}

//Note without associated document; free-floating
function freeNote(id, title, edges, text, working){
  var note = {}
  note.id = id;//Id of the note: docId + a random string
  note.title = ko.observable(title);//Title of the note
  note.edges = ko.observableArray(edges);//Edges from the note to other notes
  note.text = ko.observable(text);
  note.working = ko.observable(working);
  return note;
}

// activeNotes is the primary data location, or data model.
// Notes, question-view(slightly) and canvas should treat this as primary.
// work closely with this.
var activeNotes = [ 
  docNote(selectedDoc, "Placeholder", "Placeholder text"),
  childNote(selectedDoc, "who", ["what"], "who text", true),
  childNote(selectedDoc, "what", ["where"], "what text", true),
  childNote(selectedDoc, "where", [], "where text", true),
  childNote(selectedDoc, "why", ["where","what"], "why text", true),
  childNote(selectedDoc, "how", ["who"], "how text", false)
];

var saveAN = function(){
  localStorage.setItem('active-notes', JSON.stringify(activeNotes));}
var loadAN = function(){
  activeNotes = JSON.parse(localStorage.getItem('active-notes'));}

$(document).ready(function () {
  var editingId = activeNotes[0].id;

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
      selectedDoc(currentDoc);
      // selectedQuestion = questions.filter(function (question) {
      //   return (question.id == currentDoc)
      // })[0]
      // selectedQuestion = _.findWhere(questions, {id: selectedDoc()} )

      // renderQuestionView(selectedQuestion)
      activeNotes
        .filter(function(d){return d.id == editingId;})[0]
        .text = editable.innerHTML;
      editable.innerHTML = activeNotes
        .filter(function(d){return d.id == currentDoc;})[0]
        .text
      editingId = currentDoc;
    });

    updateWorkingStatus(ns);

    // // Put activeNotes into storage
    // localStorage.setItem('active-notes', JSON.stringify(activeNotes));
    // // Retrieve activeNotes from storage
    // var retrievedAN = localStorage.getItem('active-notes');
    // console.log('activeNotes saved as: ', JSON.parse(retrievedAN));
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

  var noteIds = function(){
    return activeNotes.map(function(note){return note.id;})
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

    // Here's my data model

    // MyNote = function(selected){
    //   this.displayNote = ko.observable(_.findWhere(questions, {id: selected} ) || {id:"",title:"",body:""}); 
    //   this.changeNote = function(newSelected){

    //   } 
    // }

    //Finds current displayNote based on observable selected; here selectedDoc();
    ViewModel = function(selected) {
      //selected is selectedDoc, a ko.observable
      this.displayNote = ko.computed(function(){
        // console.log("finding "+selected())
        // console.log(_.include(_.pluck(questions,'id'),selected().toString()))
        // console.log(_.findWhere(questions, {id: selected().toString()} ) || {id:"",title:"",body:""});
        return _.findWhere(questions, {id: selected().toString()} ) || {id:"",title:"",body:""};
      },this);
      // console.log(this.displayNote())
      // this.displayNote = _.findWhere(questions, {id: selectedDoc} ) || {id:"",title:"",body:""};
      // console.log(this.displayNote);
      // this.id = ko.computed(function(){
      //   return this.displayNote().id
      // });
      // this.title = ko.computed(function(){
      //   return this.displayNote().title
      // });
      // this.body = ko.computed(function(){
      //   return this.displayNote().body
      // });
    };


    $('.add-control').bind("click", function () {
        // console.log("Clicked on Add To Canvas");
        var addedId = selectedDoc(); 
        addedNote = activeNotes.filter(function(n){return n.id == addedId})
        if(!addedNote.length){
          doc = _.findWhere(questions, {id: addedId.toString()} )
          newNote = docNote(doc.id,doc.title,doc.body)
          activeNotes.push(newNote)
          renderNoteList(activeNotes)
        }else{
          addedNote[0].working(true);
        }
      });
     
    ko.applyBindings(new ViewModel(selectedDoc)); // This makes Knockout get to work

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
      selectedDoc(id);

      selectedQuestion = questions.filter(function (question) {
        return (question.id == id)
      })[0]
      // renderQuestionView(selectedQuestion)
      // console.log(selectedQuestion.id)
    })
  })
})