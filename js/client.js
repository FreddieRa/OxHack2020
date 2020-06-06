$(function () {
    socket = io();    //Gets the socket from the server (?)

    // document.addEventListener('keydown', reset);
    // function reset(e) {
    //     if (e.keyCode == 192) {
    //         socket.emit('reset', null)
    //     }
    // }

    // States
    // 0: Waiting to join room or make new one
    // 1: Waiting to enter name or press start
    // 2: Submitting caption and or skipping then waiting to recieve transition command
    // 3: Voting then waiting to recieve transition command
    // 4: Displaying winning meme

    // Transitions
    // 0 -> 1: Hide ["CreateRoomBtn"], join the required room
    // 1 -> 2: Hide ["StartBtns", "UsersListDiv"] Show ["CaptionsSubmitDiv", "Counter", "SkipBtn"]
    // 2 -> 2: Show ["CaptionsSubmitDiv","SkipBtn"]
    // 2 -> 3: Hide ["SkipBtn", "CaptionsSubmitDiv"] Show ["CaptionsListDiv"]
    // 3 -> 4: Hide ["gif","CaptionsListDiv","Counter"] Show ["loader"]
    // 4 -> 0: 
    // 4 -> 2:


    let state01Message = 01;
    let state12Message = 12;
    let state22Message = 22;
    let state23Message = 23;
    let state34Message = 34;
    let state40Message = 40;
    let state42Message = 42;

    state = 0;
    name = "";
    timerOn = false;
    roundTime = 60;
    countDownTimer = roundTime;
    clicked = false;
    roomID = "";
    rounds = 5;

    // HTML jQuery initalisation

    hideElements(['StartBtns', 'SkipBtn', 'Counter', 'loader', 'WinnerName'])

    $("#SkipBtn").click(function () {
        socket.emit('skip', name);
    });

    $("#StartBtn").click(function () {
        socket.emit('start', null);
    });

    $("#RoundsBtn").click(function () {
        // Goes 5, 10, 20 in loop
        rounds = (rounds * 2) % 35
        $("#RoundsBtn").html("Rounds: " + rounds)
        socket.emit('rounds', rounds);
    });

    $('#m').keyup(function (e) {
        if (e.keyCode == 13) { submit() }
    });

    $('#SubmitBtn').click(function () {
        submit()
    });


    $('#CreateRoomBtn').click(function () {
        emit('newRoom', joinRoom);
    });

    $('#MusicButton').click(function () {
        if ($('#Music')[0].paused) {
            $('#MusicImage').attr('src', 'resources/images/icons8-speaker-40.png')
            console.log('audio')
            $('#Music')[0].play()
        }
        else {
            $('#MusicImage').attr('src', 'resources/images/icons8-no-audio-40.png')
            console.log('No audio')
            $('#Music')[0].pause()
        }
    });

    function state01() {
        state = 1
        $('#SubmitBtn').html("Submit")
        console.log("state01: " + name)
        if (name != "") {
            hideElements(["CreateRoomBtn", "CaptionsSubmitDiv"])
            showElements(["StartBtns", "UsersListDiv"])
            $('#m').removeClass("border-red-500").addClass("border-blue-500")
            $('#m').attr("placeholder", "Submit a name, and press start when everyone's in!")
            $('#Music')[0].play()
            $('#m').attr("placeholder", "")
            socket.emit('user', name)
        }
        else {
            hideElements(["CreateRoomBtn"])
            $('#m').attr("placeholder", "Submit name")
        }
    }

    function state12() {
        state = 2
        startTimer()
        $("#m").val("")
        hideElements(["StartBtns", "UsersListDiv"])
        showElements(["CaptionsSubmitDiv", "Counter", "SkipBtn"])
    }

    function state22() {
        startTimer()
        showElements(["CaptionsSubmitDiv", "SkipBtn"])
        $('#gif').attr('src', img.src)
    }

    function state23() {
        state = 3
        startTimer()
        hideElements(["SkipBtn", "CaptionsSubmitDiv"])
        showElements(["CaptionsListDiv"])
    }

    function state34() {
        state = 4
        hideElements(["gif", "CaptionsListDiv", "Counter"])
        showElements(["loader"])
    }

    function state42() {
        state = 2
        $('#gif').attr('src', img.src)
        hideElements(["StartBtns", "CaptionsListDiv", "LeaderBoardDiv", "UsersListDiv", "BestMeme", "WinnerName"])
        showElements(["gif", "Counter", "SkipBtn", "CaptionsSubmitDiv"])

    }

    function state40() {
        state = 0

    }

    function hideElements(data) {
        for (let element of data) {
            $('#' + element).hide()
        }
    }

    function showElements(data) {
        for (let element of data) {
            $('#' + element).show()
        }
    }

    function joinRoom(roomID) {
        $('#RoomID').text("Room ID: " + roomID)
        console.log("Joining room with id: " + roomID);
        socket = io('/' + roomID);
        setSocket(socket)
        console.log(socket)
        roomID = roomID;
        state01()
    }

    function emit(command, callback) {
        showElements(["loader"])
        hideElements(['CaptionsSubmitDiv'])
        socket.emit('newRoom', function (arg) { hideElements(["loader"]); showElements(["CaptionsSubmitDiv"]); joinRoom(arg) })
    }

    function submit() {
        let val = $('#m').val()
        if (val.length == 0) {
            return;
        }

        switch (state) {
            case 0:
                socket.emit("joinRoom", val, function (answer) {
                    if (state == 0) {
                        if (answer) {
                            joinRoom(val)
                        } else {
                            $('#m').attr('placeholder', "Room ID " + val + " does not exist, please try again")
                            $('#m').removeClass("border-blue-500").addClass("border-red-500")
                            state = 0
                        }
                    }
                })
                break;
            case 1:
                name = val
                state01()
                break;
            case 2:
                let data = $('#m').val()
                console.log(data)
                socket.emit('chat message', { "user": name, "data": data }); //Sending a message to server
                $('#CaptionsSubmitDiv').hide()

                break;
        }

        $('#m').val('');  //Setter      
        return false;
    }

    function setSocket(s) {
        console.log(s)

        s.on('gif', function (data) {
            $('#gif').attr('src', data)
        });

        s.on('wipe', function (data) {
            $('#messages').empty();
            $('#gif').attr('src', '/resources/gifs/HelloThere.gif')
        });

        s.on('preload', function (data) {
            img = new Image();
            img.src = data;
        });

        s.on('forceLoad', function (data) {
            console.log(data)
            $('#gif').attr('src', data)
        });

        s.on('winnerName', function (data) {
            $('#WinnerName').text("Winner: " + data)
        });

        s.on('user', function (data) {
            displayUserList(data)
        });

        s.on('captions', function (captions) {
            countDownTimer = 30
            timerOn = true
            $('#Counter').text(countDownTimer)
            $('#CaptionsListDiv').empty();
            clicked = false

            let divClass = "w-1/2 p-2"
            let btnClass = "text-gray-700 text-center bg-gray-400 p-2 rounded-lg "

            for (let item of captions) {
                if (item[1] != "") {
                    let div = document.createElement("div")
                    div.className = divClass
                    let btn = document.createElement("button")
                    btn.className = btnClass;
                    btn.innerText = item[1];
                    if (false) {
                        $(btn).css("cursor", "default");
                    } else {
                        btn.addEventListener("click", function () {
                            if (clicked == false) {
                                this.className = this.className.replace('bg-gray-400', 'bg-blue-700')
                                this.className = this.className.replace('text-gray-700', 'text-white-700')
                                s.emit('vote', { "user": name, "data": item[0] });
                                clicked = true
                            }
                        });
                    }
                    div.appendChild(btn)
                    $('#CaptionsListDiv').append(div)
                }
            }
        });

        s.on('winningMeme', function (url) {
            //current votes, score
            countDownTimer = 0;
            timerOn = true;
            // $('#CaptionsListDiv').empty();
            console.log(url);
            $("#winning").show()
            $("#winning").attr("src", url)
            $("#winning").one('load', function () { $("#loader").hide(), $("#BestMeme").show(), $('#WinnerName').show() })
        });

        s.on('refresh', function (_) {
            window.location.reload(false);
        });

        s.on('transition', function (tranMessage) {
            switch (tranMessage) {
                case state01Message:
                    state01();
                    break;
                case state12Message:
                    state12();
                    break;
                case state22Message:
                    state22();
                    break;
                case state23Message:
                    state23();
                    break;
                case state34Message:
                    state34();
                    break;
                case state40Message:
                    state40();
                    break;
                case state42Message:
                    state42();
                    break;
            }
        });
    }

});

function startTimer() {
    countDownTimer = roundTime;
    timerOn = true
    $('#Counter').text(roundTime)
}
function displayUserList(data) {
    $('#UsersListDiv').empty()
    console.log("Incoming user")
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
}

function update() {
    if (timerOn) {
        if (countDownTimer > 0) {
            countDownTimer -= 1
            $('#Counter').text(countDownTimer)
        }
        else {
            timerOn = false
            $('#Counter').attr('display', 'none')
        }
    }
}

setInterval(update, 1000); //time is in ms

