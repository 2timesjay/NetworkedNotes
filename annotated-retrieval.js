var selectedQuestion = -1
var questionList = ko.observableArray([])

questionListModel = function(qList) {
  //selected is selectedDoc, a ko.observable
};

/** lunr index, simple client-side searching */
var idx= lunr(function () {
  this.field('title', {boost: 10})
  this.field('content')
  this.ref('id')
})

$(document).ready(function () {
  var editingId = activeNotes()[0].id;

  // load view templates
  var questionListTemplate = $("#question-list-template").text()
  var renderQuestionList = function (qs) {
    $("#question-list-container")
      .empty()
      .append(Mustache.to_html(questionListTemplate, {questions: qs}))
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

    //Finds current displayNote based on observable selected; here selectedDoc();
    displayNoteViewModel = function(selected) {
      //selected is selectedDoc, a ko.observable
      this.displayNote = ko.computed(function(){
        return _.findWhere(questions, {id: selected().toString()} ) || {id:"",title:"",body:""};
      },this);
    };
     
    ko.applyBindings(new displayNoteViewModel(selectedDoc),
     $('.pup')[0]); // This makes Knockout get to work
    ko.applyBindings(new displayNoteViewModel(selectedDoc),
     $('.pup')[1]); // This makes Knockout get to work


    $('.add-control').bind("click", function () {
        // console.log("Clicked on Add To Canvas");
        var addedId = selectedDoc(); 
        addedNote = activeNotes().filter(function(n){return n.id == addedId})
        if(!addedNote.length){
          doc = _.findWhere(questions, {id: addedId.toString()} )
          newNote = docNote(doc.id,doc.title,doc.body)
          activeNotes.push(newNote)
        }else{
          addedNote[0].working(true);
        }
      });

    $('.add-note-control').bind("click", function () {
        // console.log("Clicked on Add To Canvas");
        var addedId = selectedDoc(); 
        doc = _.findWhere(questions, {id: addedId.toString()} )
        newNote = childNote(doc.id,doc.title,[],doc.body,true)
        activeNotes.push(newNote)
      });

    questions.map(function(question){idx.add(question);})
    questionList(questions)
    ko.applyBindings(questionList,$("#question-list-container")[0])
 
    $('a.all').bind('click', function () {
      questionList(questions)
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
      questionList(results)
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