$(function() {
    var socket = io();    //Gets the socket from the server (?)

    name = ""
    timerOn = false
    countDownTimer = 60;
    $('#SkipBtn').hide()
    $('#Counter').hide()

    $("#SkipBtn").click(function(){ 
        socket.emit('skip', name);
    });

    $("#StartBtn").click(function(){ 
        socket.emit('start', null);
    });


    function submit() {
        if(name == "") {
            //if (name is legit)
                name = $('#m').val()
                console.log(name)
                socket.emit('user', name); //Sending a message to server
        } else {
            let data = $('#m').val()
            socket.emit('chat message', {"user": name, "data": data}); //Sending a message to server
        }
        $('#m').val('');  //Setter
        return false;
    }
    $('#m').keyup(function(e){
        if (e.keyCode == 13) {submit()}
    });
    $('#SubmitBtn').click(function(){
        submit()
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
              console.log(data)
              $('#gif').attr('src', data)
              $('#gif').show()
              $('#SkipBtn').show()
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
              $('#gif').attr('src', img.src)
              //show show submission box
              $('#m').show()
              //show submission button
              $('#SubmitBtn').show()
              //show SkipButton
              $('#SkipBtn').show()
              break;
          case 'hide':
              $('#'+data).hide()
              break;
         
      }
  });
  
  socket.on('captions', function(captions) {
      console.log("Captions: " + captions)
        countDownTimer = //sometime;
        timerOn = true
        $('#Counter').show()
        $('#Counter').text(countDownTimer)
        $('#CaptionsList').empty()
        $('#CaptionsList').show()

        for (item of captions) {
            var x = document.createElement("li");
            var b = document.createElement("button");
            b.innerText = item[1]
            b.addEventListener("click", function(){ 
                socket.emit('vote', {"user": name, "data": item[0]});
            });
            x.appendChild(b);
            $('#CaptionsList').append(x);   //Add message to #messages
        }

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

