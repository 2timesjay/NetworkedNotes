var editable = document.getElementById('editable');
var currentDoc = 'contenteditable';
var lb = document.getElementById('listbody');
var currentNoteList = localStorage.getItem('notelist');
if(currentNoteList){
  lb.innerHTML = currentNoteList;
}

addEvent(editable, 'blur', function () {
  // lame that we're hooking the blur event
  localStorage.setItem(currentDoc, this.innerHTML);
  document.designMode = 'off';
});

addEvent(editable, 'focus', function () {
  document.designMode = 'on';
});

addEvent(document.getElementById('clear'), 'click', function () {
  localStorage.clear();
  window.location = window.location; // refresh
});


addEvent(document.getElementsByClassName('note'), 'click', function () {
  console.log(this.id);  
  currentDoc = this.id;
  editable.innerHTML = localStorage.getItem(currentDoc);
  $(this).focus();
  localStorage.setItem(currentDoc, editable.innerHTML);
});

$('.note').dblclick(function (event) {
  //console.log("KEYUP! "+event.keyCode);
  //if(event.keyCode == 46){
  if(true){  
    var notename = $(this).id;
    $(this).parent().remove();
    localStorage.setItem(notename,'');
    localStorage.setItem('notelist',lb.innerHTML);
  }
});


$('#create').keyup(function (event) {
  console.log("KEYUP!" + event.keyCode);
  if(event.keyCode == 13){
  //if(true){
    console.log(this.value);
    var newDocId = this.value; 
    var elem = '<li><span class="note" id ="'+newDocId+'">'+newDocId +'</span></li>'
    console.log(elem);
    $("#listbody").append(elem)
    addEvent(document.getElementById(newDocId), 'click', function () {
      //console.log(this);  
      currentDoc = this.id;
      editable.innerHTML = localStorage.getItem(currentDoc);
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
  }
});



//addEvent(document.getElementById('what'), 'click', function () {
//  currentDoc = 'what';
//  editable.innerHTML = localStorage.getItem('what');
//  //window.location = window.location; // refresh
//  localStorage.setItem('what', editable.innerHTML);
//});

//if (localStorage.getItem('contenteditable')) {
//  editable.innerHTML = localStorage.getItem('contenteditable');
//}
