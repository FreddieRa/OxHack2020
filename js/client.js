$(function() {
    var socket = io();    //Gets the socket from the server (?)

    document.addEventListener('keydown', reset);
    function reset(e) {
        if (e.keyCode == 192) {
            socket.emit('reset', null)
        }
        console.lo
    }

    // States
    // 0: waiting to join room or make new one
    // 1: waiting to enter name or press start
    // 2: In game

    // Transitions
    // 0 -> 1: Hide "make room", join the required room
    // 1 -> 2: Hide ["start", "UsersListDiv"]

    state = 0
    name = ""
    timerOn = false
    countDownTimer = 60;
    clicked = false;
    roomID = ""

    // HTML jQuery initalisation

    $('#StartBtn').hide()
    $('#SkipBtn').hide()
    $('#Counter').hide()
    $('#loader').hide()

    $("#SkipBtn").click(function(){ 
        socket.emit('skip', name);
    });

    $("#StartBtn").click(function(){ 
        socket.emit('start', null);
    });

    $("#CreateRoomBtn").click(function(){ 
        socket.emit('newRoom', null);
    });

    $('#m').keyup(function(e){
        if (e.keyCode == 13) {submit()}
    });

    $('#SubmitBtn').click(function(){
        submit()
    });


    $('#CreateRoomBtn').click(function(){
        console.log("newRoom pressed")
        socket.emit("newRoom", null, function(answer) {
            if (state == 0) {
                console.log("Joining room with id: " + answer);
                socket = io('/'+answer);
                roomID = answer;
                $('#CreateRoomBtn').hide()
                $('#m').removeClass("border-red-500").addClass("border-blue-500")
                state = 1
            }
        });
    })

    function submit() {
        let val = $('#m').val()
        if (val.length == 0) {
            return;
        }

        switch (state) {
            case 0:
                socket.emit("join", val, function (answer) {
                    if (state == 0) {
                        if (answer) {
                            console.log("Joining room with id: " + val);
                            socket = io('/'+val);
                            roomID = val;
                            $('#CreateRoomBtn').hide()
                            $('#m').removeClass("border-red-500").addClass("border-blue-500")
                            state = 1
                        } else {
                            $('#m').attr('placeholder', "Room ID " + val + " does not exist, please try again")
                            $('#m').removeClass("border-blue-500").addClass("border-red-500")
                            state = 0
                        }
                    }  
                })
                $('#m').attr("placeholder", "Submit a name, and press start when everyone's in!")
                break;

            case 1:
                $('#CaptionsSubmitDiv').hide()
                $('#StartBtn').show()
                name = $('#m').val()
                socket.emit('user', name); //Sending a message to server
                $('#m').attr("placeholder", "")
                state = 2;
                break;

            case 2:
                let data = $('#m').val()
                console.log(data)
                socket.emit('chat message', {"user": name, "data": data}); //Sending a message to server
                $('#CaptionsSubmitDiv').hide()  
                break;
        }

        $('#m').val('');  //Setter      
        return false;
    }


    socket.on('join', function(roomid) {
        if (state == 0) {
            console.log("Joining room with id: " + roomid);
            socket = io('/'+roomid);
            $('#CreateRoomBtn').hide()
            $('#m').removeClass("border-red-500").addClass("border-blue-500")
            state = 1
        }
    })

    socket.on('failedJoining', function(roomid) {
        if (state == 0) {
            $('#m').attr('placeholder', "Room ID " + roomid + " does not exist, please try again")
            $('#m').removeClass("border-blue-500").addClass("border-red-500")
            state = 0
        }
    })

  
  
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
                for (let element of data){
                    $('#'+element).hide()
                }
                break;
            case 'show':
                for (let element of data){
                 $('#'+element).show()
                }                
                break;
            case 'user':
                $('#UsersListDiv').empty()

                let divClass = "w-1/2 p-2"
                let h2Class = "text-gray-700 text-center bg-gray-400 p-2 rounded-lg"
                for (let name of data) {
                    console.log("Recieving " + name + " from server");
                    
                    let div = document.createElement("div");
                    div.className = divClass

                    let h2 = document.createElement("h2");
                    h2.className = h2Class
                    h2.innerHTML = name

                    div.appendChild(h2);
                    $('#UsersListDiv').append(div);   
                }
                $('#UsersListDiv').show();
                break;         
      }
  });
  
  socket.on('captions', function(captions) {
        countDownTimer = 30
        timerOn = true
        $('#Counter').text(countDownTimer)
        $('#CaptionsListDiv').empty();
        clicked = false
        
        let divClass = "w-1/2 p-2"
        let btnClass = "text-gray-700 text-center bg-gray-400 p-2 rounded-lg "

        for (let item of captions) {
            if (item[1] != ""){
                let div = document.createElement("div")
                div.className = divClass

                let btn = document.createElement("button")
                btn.className = btnClass;
                btn.innerText = item[1];
                if (false) {
                    $(btn).css("cursor", "default");
                } else {
                    btn.addEventListener("click", function(){ 
                        if (clicked == false) {
                            this.className = this.className.replace('bg-gray-400', 'bg-blue-700')
                            this.className = this.className.replace('text-gray-700', 'text-white-700')
                            socket.emit('vote', {"user": name, "data": item[0]});
                            clicked = true
                        }
                    });
                }

                div.appendChild(btn)

                $('#CaptionsListDiv').append(div)
            }
 
        }

        // while(i<4) {
        //     $('#CaptionButton[' + i + ']').hide();
        //     i++;
        // }
      
  });
  
    socket.on('scores', function(page) {
        //current votes, score
        countDownTimer = 10;
        timerOn = true;
        // $('#CaptionsListDiv').empty();
        
        $("#Graph").load(page);
        // for (let user of scores){
        //     var x = document.createElement("li");
        //     var b = document.createElement("h1");

        //     // var ScoreboardStyling = "bg-blue-500 w-" +20 + 200 * user[2] / scores[0][2] ;//Width;

        //     b.innerHTML = user[0]+': votes '+user[1]+' score '+user[2];
        //     b.classname = ScoreboardStyling;
            
        //     //(While we don't have the bar chart)
        //     x.style.flexGrow = 1;
        //     x.style.alignContent = "stretch";
        //     x.style.background = "#00BFFF";
        //     x.style.margin = "5px";
        //     b.style.flexGrow = 1;

        //     x.appendChild(b);
        //     $('#CaptionsListDiv').append(x);            
        // }
  
  });

  socket.on('winningMeme', function(url) {
    //current votes, score
    countDownTimer = 0;
    timerOn = true;
    // $('#CaptionsListDiv').empty();
    console.log(url);
    $("#winning").show()
    $("#winning").attr("src", url)
    $("#winning").one('load', function(){$("#loader").hide(), $("#BestMeme").show()})
});

socket.on('refresh', function(_) {
    window.location.reload(false);
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

