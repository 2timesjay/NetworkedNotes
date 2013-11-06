// set up the index, specifying that we want to index the title, tags and body fields of documents.
//var idx



var selectedQuestion = -1

var idx= lunr(function () {
  this.field('title', {boost: 10})
  this.field('content')
  this.ref('id')
})

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
    $("#menu")
      .empty()
      .append(Mustache.to_html(noteListTemplate, {notes: ns}))
  }

  var renderQuestionView = function (question) {
    $("#question-view-container")
      .empty()
      .append(Mustache.to_html(questionViewTemplate, question))
      
    $('.add-control').bind("click", function () {
      console.log("Clicked on Add To Canvas");
      // var newDocId = selectedQuestion.title.split(' ').join('_');
      var newDocId = selectedQuestion.id 
      var elem = '<li><a href="#" class="note" id ="'+newDocId+'">'+newDocId +'</a></li>'
      console.log(elem);
      $("#listbody").append(elem)
      addEvent(document.getElementById(newDocId), 'click', function () {
        //console.log(this);  
        currentDoc = this.id;
        // editable.innerHTML = selectedQuestion.body 
        editable.innerHTML = "What are your notes on this story?"
        localStorage.setItem(newDocId,editable.innerHTML)
        //editable.innerHTML = localStorage.getItem(currentDoc);
        $(this).focus();
        localStorage.setItem(currentDoc, editable.innerHTML);
      });
      localStorage.setItem('notelist',lb.innerHTML);
      $('#'+newDocId).dblclick(function (event) {
        //console.log("KEYUP! "+event.keyCode);
        //if(event.keyCode == 46){
        if(true){  
          var notename = $(this).id;
          $(this).parent().remove();
          localStorage.setItem(notename,'');
          localStorage.setItem('notelist',lb.innerHTML);
        }
      });
    //if(true){
      console.log("creating node "+newDocId);
      var newDocId = newDocId; 
  // insert new node at point
      node = {id: ++lastNodeId, reflexive: false, title : newDocId};
      node.x = 100;
      node.y = 100;
      nodes.push(node);
      restart();
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

  // var initialNotesData = {notes:[
  //     {id:"who",title:"who"},
  //     {id:"what",title:"what"},
  //     {id:"where",title:"where"}
  //   ]};
  var initialNotesData = [
      {id:"who",title:"who"},
      {id:"what",title:"what"},
      {id:"where",title:"where"}
    ];
  renderNoteList(initialNotesData)

  // load the example data
  $.getJSON('short.json', function (data) {
    console.log(data);
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
    renderQuestionView(questions[0])

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
      console.log(selectedQuestion.id)
    })
  })
})