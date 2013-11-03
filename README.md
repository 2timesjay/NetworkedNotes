Networked Notes gives us a minimal note-taking system accompanied by an editable graph to help the users organize their thoughts into a bigger structure.

It contains significant code from HTML5 Demos, Lunr's example site, and RKirsling's DAG Editor, and is based off Dafna Shahaf's Metromaps papers and a subsequent project by Edward Yang, Russell Chou and Jacob Jensen. Thanks to all those folks.

Quick tutorial:

Use the search box on the left to search through articles (mostly on the Boston Marathon Bombings), using their full text. Click "Add to canvas" to add an article to both your list of saved notes (where you can edit or annotate it) and to the metromap canvas.

Editing note contents: Click the "Edit Text" button. Then click on the textbox to the right of the bullet-pointed note list and you'll be able to freely edit it(this is currently a simple contentEditable div). This is a bit buggy right now, so if you delete your div or your note accidentally don't be alarmed.

Editing the graph: Click the "Edit Graph" button.
Click empty canvas to add a blank node
Click an existing node and drag to make a new link to another node
Double-click a node to fix it or un-fix it.
Hold ctrl while holding and dragging a node to move the node's location (if fixed it will be moved exactly, if unfixed the force layout will move it some after you release)
Click a link to select it
Type 'c' while a link is selected to cycle through 10 link colors
Type 'l','r' or 'b' to change arrow directions of a link
Type the 'delete' key to remove a node or link
