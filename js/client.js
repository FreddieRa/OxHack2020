$(function() {
var socket = io();    //Gets the socket from the server (?)

var name = null
timerOn = true
countDownTimer = 60;
$('#SkipBtn').hide()


$(document).ready(function(){ 
    $("#SkipButton").click(function(){ 
        socket.emit('skip', name);
    }); 
    $('#SubmitBtn').click(function(){
        console.log("here")
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
            $('#gif').attr('src', '/resources/gifs/HelloThere.gif')
            break;
        case 'preload': 
            img = new Image();
            img.src = data;
            break;
        case 'forceLoad': // Tells client to display loaded gif now
            $('#gif').show()
            $('#SkipBtn').show()
            $('#gif').attr('src', data)
            //show show submission box
            $('#m').show()
            //show submission button
            $('#SubmitBtn').show()
            break;
        case 'startTimer':
            countDownTimer = data;
            timerOn = true
            $('#Counter').show()
            $('#Counter').text(countDownTimer)
            break;
        case 'loadStored':
            $('#gif').attr('src', img)
            //show show submission box
            $('#m').show()
            //show submission button
            $('#SubmitBtn').show()
            //show SkipButton
            $('#SkipBtn').show()
            break;
        case 'hide':
            break;
    }
});

socket.on('captions', function(captions) {
    countDownTimer = //sometime;
    timerOn = true
    $('#Counter').show()
    $('#Counter').text(countDownTimer)
    $('#CaptionList').show()
    //hide submission box and button
    $('#m').hide()
    $('#SubmitBtn').hide()
    $('#SkipBtn').hide()

    
});

socket.on('scores', function(scores) {

});

});

function update() {
    if (timerOn){
        if (countDownTimer > 0) {
            countDownTimer -= 1
            $('#Counter').text(countDownTimer)
        }
        else{
            timerOn = false
            $('#Counter').attr('display', 'none')
        }
    }
}

setInterval(update, 1000); //time is in ms

