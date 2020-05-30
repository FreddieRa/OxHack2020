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