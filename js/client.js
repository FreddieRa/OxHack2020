$(function() {
    var socket = io();    //Gets the socket from the server (?)

    name = ""
    timerOn = false
    countDownTimer = 60;
    InputLastVal = "";

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
            InputLastVal = $('#m').val();
            socket.emit('chat message', {"user": name, "data": data}); //Sending a message to server
        }
        $('#m').val('');  //Setter
        $('#CaptionsSubmitDiv').hide()        
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
                $('#CaptionsList').empty()
                break;
            case 'startTimer':
                countDownTimer = data;
                timerOn = true
                $('#Counter').text(countDownTimer) 
                break;
            case 'loadStored':
                $('#gif').attr('src', img.src)      //bug s.t. img.src is not defined
                break;
            case 'hide':
                for (element of data){
                    $('#'+element).hide()
                }
                break;
            case 'show':
                for (element of data){
                 $('#'+element).show()
                }                
                break;
            case 'user':
                $('#CaptionsList').empty()
                for (name of data) {
                    var x = document.createElement("li");
                    var b = document.createElement("h1");
                    b.innerHTML = name
                    x.appendChild(b);
                    $('#CaptionsList').append(x);   
                }
                break;   

         
      }
  });
  
  socket.on('captions', function(captions) {
        countDownTimer = 30
        timerOn = true
        $('#Counter').text(countDownTimer)
        $('#CaptionsList').empty();
        
        var i = 0;

        for (item of captions) {
            //alert(item[1]);
            //alert($('#m').val());
            //alert(InputLastVal);
            // if(InputLastVal == item[1]){
            //     continue;
            // }

            $('#CaptionButton[' + i + ']').innerText = item[1];
            $('#CaptionButton[' + i + ']').addEventListener("click", function(){ 
                $('#CaptionsListDiv').hide()
                socket.emit('vote', {"user": name, "data": item[0]});
            });    

            //lert()

            // var x = document.createElement("li");
            // var b = document.createElement("button");
            // b.innerText = item[1]
            // b.addEventListener("click", function(){ 
            //     $('#CaptionsListDiv').hide()
            //     socket.emit('vote', {"user": name, "data": item[0]});
            // });        

            // x.style.flexGrow = 1;
            // x.style.alignContent = "stretch";
            // x.style.background = "#00BFFF";
            // x.style.margin = "5px";
            // b.style.flexGrow = 1;
            // b.style.minWidth = "200px";

            // x.appendChild(b);
            // $('#CaptionsList').append(x);   //Add message to #messages   
            // //$('#CaptionsListDev2').append(x);         
            i++;
            if(i==4) {
                break;
            }            
        }

        while(i<4) {
            $('#CaptionButton[' + i + ']').hide();
            i++;
        }
      
  });
  
    socket.on('scores', function(users) {
        //current votes, score
        countDownTimer = 10;
        timerOn = true;
        $('#CaptionsList').empty();
        scores = users.sort((a, b) => Number(a[2]) - Number(b.score[2]));
        for (user of scores){
            var x = document.createElement("li");
            var b = document.createElement("h1");
            b.innerHTML = user[0]+': votes '+user[1]+' score '+user[2]

            x.style.flexGrow = 1;
            x.style.alignContent = "stretch";
            x.style.background = "#00BFFF";
            x.style.margin = "5px";
            b.style.flexGrow = 1;

            x.appendChild(b);
            $('#CaptionsList').append(x);            
        }
  
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

