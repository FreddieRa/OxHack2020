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

$(document).ready(function(){ 
    $("#SkipButton").click(function(){ 
        socket.emit('skip', name);
    }); 
}); 

socket.on('chat message', function(msg){    //Recieving from server
  $('#messages').append($('<li>').text(msg));   //Add message to #messages
  window.scrollTo(0, document.body.scrollHeight);
});


socket.on('command', function(cmdDict) {
    let cmd = cmdDict.cmd
    let data = cmdDict.data
    switch (cmd) {
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
        case 'forceLoad': // Tells client to display loaded gif now
            $('#gif').attr('display', 'block')
            $('#SkipBtn').attr('display', 'block')
            $('#gif').attr('src', data)
            //show show submission box
            $('#m').attr('display','block')
            //show submission button
            $('#SubmitBtn').attr('display','block')
            break;
        case 'startTimer':
            countDownTimer = data;
            timerOn = true
            $('#Counter').attr('display', 'block')
            $('#Counter').attr('text', countDownTimer)
            break;
        case 'loadStored':
            $('#gif').attr('src', img)
            //show show submission box
            $('#m').attr('display','block')
            //show submission button
            $('#SubmitBtn').attr('display','block')
            //show SkipButton
            $('#SkipBtn').attr('display', 'block')
            break;
        case 'hide':
            break;
    }
});

socket.on('captions', function(captions) {
    countDownTimer = //sometime;
    timerOn = true
    $('#Counter').attr('display', 'block')
    $('#Counter').attr('text', countDownTimer)
    //hide submission box and button
    $('#m').attr('display','none')
    $('#SubmitBtn').attr('display','none')
    $('#SkipBtn').attr('display', 'none')

    
});

socket.on('scores', function(scores) {

});

});

function update() {
    if (timerOn){
        if (countDownTimer > 0) {
            countDownTimer -= 1
            $('#Counter').attr('text', countDownTimer)
        }
        else{
            timerOn = 0
            $('#Counter').attr('display', 'none')
        }
    }
}

setInterval(update, 1000); //time is in ms

