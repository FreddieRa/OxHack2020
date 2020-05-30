$(function() {
var socket = io();    //Gets the socket from the server (?)

$('form').submit(function(){
  socket.emit('chat message', $('#m').val()); //Sending a message to server
  $('#m').val('');  //Setter
  return false;
});

socket.on('chat message', function(msg){    //Recieving from server
  $('#messages').append($('<li>').text(msg));   //Add message to #messages
  window.scrollTo(0, document.body.scrollHeight);
});


socket.on('command', function(cmdDict) {
    let cmd = cmdDict.cmd
    let data = cmdDict.data
    switch (cmd) {
        case 'i':   //Itallics
            //$('#messages').append($('<li>').html('<i>' + data + '</i>'));   //Add message to #messages
            break;
        case 'b':   //Bold
            //$('#messages').append($('<li>').html('<b>' + data + '</b>'));   //Add message to #messages
            break;
        case 'gif':
            //$('#messages').append($('<li>').html('<img src="' + data + '" />'));   //Add gif
            //window.scrollTo(0, document.body.scrollHeight);
            $('#gif').attr('src', data)
            break;
        case 'wipe': 
            $('#messages').empty();
            break;
    }
});


});

