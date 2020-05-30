$(function() {
var socket = io();    //Gets the socket from the server (?)

var name = null
var timerOn = false
$('form').submit(function(){
    if(name == null) {
        //if (name is legit)
            name = $('#m').val()
            socket.emit('user', name); //Sending a message to server
    } else {
        let data = $('#m').val
        socket.emit('chat message', {"user": name, "data": data}); //Sending a message to server
    }
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
        // case 'i':   //Itallics
        //     //$('#messages').append($('<li>').html('<i>' + data + '</i>'));   //Add message to #messages
        //     break;
        // case 'b':   //Bold
        //     //$('#messages').append($('<li>').html('<b>' + data + '</b>'));   //Add message to #messages
        //     break;
        case 'gif':
            //$('#messages').append($('<li>').html('<img src="' + data + '" />'));   //Add gif
            //window.scrollTo(0, document.body.scrollHeight);
            $('#gif').attr('src', data)
            break;
        case 'wipe': 
            $('#messages').empty();
            $('#gif').attr('src', 'EdSite/resources/gifs/HelloThere.gif')
            break;
        case 'preload': 
            img = new Image();
            img.src = data;
            break;
        case 'forceLoad': // Tells client to display loaded gif in n seconds
            $('#gif').attr('src', data)
            break;
        case 'startTimer':
            var countDownTimer = data;
            timerOn = true
            break;
        case 'loadStored':
            $('#gif').attr('src', img)
            //show show submission box
            //show submission button
            break;
        case 'hide':
            break;

    }
});

socket.on('captions', function(captions) {
    //hide submission box and button
});

socket.on('scores', function(scores) {

});

});

function update() {
    if (timerOn){
        countDownTimer -= 1
        //then update html
    }
}

setInterval(update, 1000); //time is in ms

