var express = require('express');
var app = express();
//var giphy = require('giphy-js-sdk-core');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

var jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

var $ = jQuery = require('jquery')(window);

let imported = document.createElement('script');
imported.src = "./js/user.js";
document.head.appendChild(imported);

// Dictionary containing rooms referenced by id
let rooms = {}

// Socket for initial connections from users
io.on('connection', function (socket) {
    // Generate a new room and return its id in the callback
    socket.on('newRoom', function (callback) {
        let roomid = Math.floor(Math.random() * 90000) + 10000
        let room = new Room(roomid)
        console.log("New room created with id " + roomid)
        rooms[roomid] = room
        callback(roomid)
    })

    // Attempt to join a room, and return success in callback
    socket.on('joinRoom', function (roomid, callback) {
        if (roomid in rooms) {
            callback(true)
        } else {
            callback(false)
        }
    })
});

function Room(roomID) {
    this.roomID = roomID;
    this.roundTime = 60;
    this.countDownTimer = this.roundTime;
    this.messages = 0;
    this.rounds = 5;
    this.users = {}

    this.gotGif = false;
    this.usersSubmitted = 0;
    this.usersVoted = 0;
    this.skippedVotes = 0;

    this.currentMeme = "";
    this.nextMeme = "";
    this.maxVotes = -1;
    this.winningSubmission = "";
    this.winnerName = "";
    this.state = 0;

    //Managing transitions (hide and show initially, but hopefully something that can be extended later)
    //This must match in client.js
    let state01Message = 01;
    let state11Message = 11;
    let state12Message = 12;
    let state23Message = 23;
    let state31Message = 31;

    this.getAllMemes = function() {
        let url = "https://api.imgflip.com/get_memes"
        let string = $.ajax({ 
            url: url, 
            async: false
         }).responseText;
        let json = JSON.parse(string);
        return json.data.memes
    }

    this.memes = this.getAllMemes();


    this.nsp = io.of('/' + this.roomID);

    let t = this
    this.nsp.on('connection', function (socket) {
        socket.on('chat message', function (msg) {
            let user = msg.user
            let data = msg.data

            if (user in t.users) {
                console.log(user + " sent in " + data)
                t.users[user].currentCaption = data
                t.usersSubmitted += 1
                if (t.usersSubmitted == Object.keys(t.users).length) {
                    console.log("state12() called");
                    t.state12()
                }
            }
        });

        socket.on('user', function (name, callback) {
            //Send error back for duplicate names
            console.log(t.users)
            if (name in t.users == false && t.state == 0) {
                t.users[name] = new User(name)
                callback(Object.keys(t.users))
                console.log("Sending " + name + " to clients");
                console.log("Num current useres " + Object.keys(t.users).length);
            }
        });

        socket.on('getUsers', function (callback) {
            //Send error back for duplicate names
            callback(Object.keys(t.users))
        });

        socket.on('start', function (_) {
            t.state01()
        });

        socket.on('rounds', function (rounds) {
            t.rounds = rounds
        });

        // socket.on('reset', function (_) {
        //     t.state = 0
        //     t.messages = 0;
        //     t.users = {}

        //     t.gotGif = false;
        //     t.usersSubmitted = 0;
        //     t.usersVoted = 0;
        //     t.skippedVotes = 0;

        //     t.currentMeme = "";
        //     t.nextMeme = "";
        //     t.maxVotes = -1;
        //     t.nsp.emit('refresh', null) //bad emit
        // });

        socket.on('skip', function (name) {
            if (name in t.users && t.state == 1) {
                t.skippedVotes += 1
                if (t.skippedVotes / Object.keys(t.users).length >= 0.5) {
                    t.state11()
                }
            }
        });

        socket.on('vote', function (vote) {
            let u = t.users
            user = vote.user
            data = vote.data
            if (user in u && data in u) {
                console.log(user + " VOTED FOR " + data)
                if (false) {
                    console.log("ERROR; you can't vote for yourself!")
                }
                else {
                    u[user].vote = data
                    u[data].currentVotes += 1
                    if (u[data].currentVotes >= t.maxVotes) {
                        t.maxVotes = u[data].currentVotes
                        t.winningSubmission = u[data].currentCaption
                        t.winnerName = u[data].username
                    }
                    u[data].score += 10
                    t.usersVoted += 1
                    if (t.usersVoted == Object.keys(u).length) {
                        t.state23()
                    }
                }
            }
        });
    });

    this.update = function () {
        switch (this.state) {
            case 0:
                break;

            case 1:
                if (this.gotGif == false) {
                    this.getMeme('preload')
                    // This is now done in getMeme()
                    this.gotGif = true
                }

                this.countDownTimer -= 1
                if (this.countDownTimer == 0) {
                    this.state12()
                }
                break;
            case 2:
                this.countDownTimer -= 1
                if (this.countDownTimer == 0) {
                    this.state23()
                }
                break;
            case 3:
                this.countDownTimer -= 1
                if (this.countDownTimer == 0) {
                    if (this.rounds == 0) {
                        this.nsp.emit('refresh', null);
                        // TODO: Insert graceful ending, perhaps asking to play again, or showing all winning memes in collage
                        delete rooms[this.roomID]
                    } else {
                        this.state31()
                    }
                }
        }
    }

    //Must match that in client.js
    //Are the codes for the transition
    let state01Message = 01;
    let state12Message = 12;
    let state22Message = 22;
    let state23Message = 23;
    let state34Message = 34;
    let state45Message = 45;
    let state56Message = 56;
    let state60Message = 60;
    let state62Message = 62;


    this.state01 = function () {
        // Hide start from all users -> fetch gif -> show countdown -> show gif
        // io.emit('command', {'cmd':'hide','data': 'start'});    
        this.getMeme('forceLoad')
        this.currentMeme = this.nextMeme
        this.nsp.emit('startTimer', this.roundTime)     
        this.nsp.emit('hide', ["StartBtns","CaptionsListDiv", "UsersListDiv", "RoomID","WinnerName"])
        this.nsp.emit('show', ["gif","Counter","SkipBtn","CaptionsSubmitDiv"])
        //this.nsp.emit('transition', state01Message);
        this.countDownTimer = this.roundTime

        this.state = 1
    }

    this.state11 = function () {
        // counting down, registering skip votes, accepting submissions
        //      If skipped: Show new gif -> Back to waiting for all users
        if (this.gotGif == false) {
            // let url = this.getMeme()
            // this.nsp.emit('command',{'cmd': 'forceLoad', 'data': url}) // Tells client to load and display gif
            this.getMeme('forceLoad')

        } else {
            this.nsp.emit('loadStored', null) // Tells client to display loaded gif (with countdown 0)
        }
        this.currentMeme = this.nextMeme
        this.nsp.emit('hide', ["StartBtns", "CaptionsListDiv", "UsersListDiv", "WinnerName"])
        this.nsp.emit('show', ["gif", "Counter", "SkipBtn", "CaptionsSubmitDiv"])
        //this.nsp.emit('transition', state11Message);
        this.nsp.emit('startTimer', this.roundTime)

        this.gotGif = false;
        this.countDownTimer = this.roundTime
        this.skippedVotes = 0
        this.usersSubmitted = 0
    }

    this.state12 = function () {
        // After: 
        //      Else: Hide submission box -> Send submissions to user -> Reset counter

        let mapped = Object.values(this.users).map(x => [x.username, x.currentCaption])

        // If no submissions skip round
        if (mapped.filter(x => x != "").length == 0) { this.state11(); return false; }

        this.nsp.emit('captions', mapped); // On receiving captions, hide submissions
        // io.emit('command',{'cmd': 'show', 'data': 'CaptionsListDiv'})
        this.nsp.emit('startTimer', this.roundTime )
        this.nsp.emit('hide', ["StartBtns", "SkipBtn", "CaptionsSubmitDiv", "UsersListDiv", "BestMeme", "RoomID", "WinnerName"])
        this.nsp.emit('show', ["gif", "Counter", "CaptionsListDiv"])
        //this.nsp.emit('transition', state12Message);
        this.gotGif = false;
        this.countDownTimer = this.roundTime
        this.skippedVotes = 0
        this.usersSubmitted = 0
        this.state = 2
    }

    this.state23 = function () {
        // During: Recieving votes, Counting Down
        // Stop Condition: All users have voted || Countdown == 0
        // After: Send scores to all users -> wait 30 seconds -> change back to waiting for submissions with new gif
        // LOOP END

        let u = Object.values(this.users)
    
        
        this.nsp.emit('hide', ["Counter","SkipBtn","CaptionsSubmitDiv","gif","StartBtns","UsersListDiv"])
        this.nsp.emit('loadStored', null) // Tells client to display loaded gif in 30 seconds

        this.nsp.emit('show', ["loader"])
    
        
        let text = this.winningSubmission.split(',')
        let boxes = []

        for (let box of text) { 
            boxes.push({"text": box})
        }
    
        //let data = {"template_id": this.currentMeme, "username": "FreddieRa", "password": "OxHack2020!", "text0": text[0], "text1": text[1]}
        let data = {"template_id": this.currentMeme, "username": "FreddieRa", "password": "OxHack2020!", "boxes": boxes}

        console.log(JSON.stringify(data))

        let n = this.nsp
        $.post("https://api.imgflip.com/caption_image", data, function (result) {
            console.log(result)
            let url = JSON.parse(result).data.url
            n.emit('winningMeme', url)
        }, "html")

        this.nsp.emit('winner', this.winningSubmission)
        this.nsp.emit('startTimer', this.roundTime)
        this.nsp.emit('winnerName', this.winnerName)

        // this.nsp.emit('command',{'cmd':'show','data': ["WinnerName"]})
        this.nsp.emit('hide', ["StartBtns", "CaptionsListDiv", "LeaderBoardDiv", "UsersListDiv", "gif", "SkipBtn", "CaptionsSubmitDiv"])
        //this.nsp.emit('transition', state23Message);

        this.rounds -= 1;

        for (let user of Object.values(this.users)) {
            user.currentCaption = ""
            user.currentVotes = 0
            user.vote = -1
        }

        this.countDownTimer = 6
        this.usersVoted = 0
        this.maxVotes = -1
        this.state = 3
        this.currentMeme = this.nextMeme
    }

    this.state31 = function () {
        this.nsp.emit('hide', ["StartBtns", "CaptionsListDiv", "LeaderBoardDiv", "UsersListDiv", "BestMeme", "WinnerName"])
        this.nsp.emit('show', ["gif", "Counter", "SkipBtn", "CaptionsSubmitDiv"])
        //this.nsp.emit('transition', state31Message);
        this.nsp.emit('startTimer', this.roundTime)
        this.countDownTimer = this.roundTime
        this.state = 1
    }    


    this.getMeme = function(command) {
        let keys = Object.keys(this.memes)

        let key = Math.floor(Math.random() * keys.length)
        let memeurl = this.memes[keys[key]].url
        let memeid = this.memes[keys[key]].id
        let boxCount = this.memes[keys[key]].box_count
        let boxes = []

        // Get number for each position
        for(let i = 1; i < boxCount + 1; i++) {boxes.push({"text": i})}

        let data = {"template_id": memeid, "username": "FreddieRa", "password": "OxHack2020!", "boxes": boxes}
        
        let n = this.nsp
        $.post("https://api.imgflip.com/caption_image", data, function(result) {
            console.log(result)
            let url = JSON.parse(result).data.url
            n.emit(command, url)
        }, "html")

        // This is a terrible side effect and should be removed.......but it works for now
        this.nextMeme = memeid
        return memeurl
    }

}



let states = {
    0: "waiting for users to join",
    // During: Registering each user.
    // Stop Condition: When user presses start button:
    // After: Hide start from all users -> fetch gif -> show countdown -> show gif

    // LOOP START
    1: "waiting for all users to have submitted",
    // During: Fetching next gif, counting down, registering skip votes, accepting submissions
    // Stop Condition: Countdown == 0 || All users have submitted || Majority skip
    // After: 
    //      If skipped: Show new gif -> Back to waiting for all users
    //      Else: Hide submission box -> Send submissions to user -> Reset counter

    2: "waiting for all users to have voted",
    // During: Recieving votes, Counting Down
    // Stop Condition: All users have voted || Countdown == 0
    // After: Send scores to all users -> wait 30 seconds -> change back to waiting for submissions with new gif
    // LOOP END
}


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});


app.get('/js/client.js', function (req, res) {
    res.sendFile(__dirname + '/js/client.js');
});

app.get('/EdSite', function (req, res) {
    res.sendFile(__dirname + '/EdSite/index.html')
})

app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));


app.use('/resources/gifs', express.static(__dirname + '/resources/gifs'));
app.use('/resources/music', express.static(__dirname + '/resources/music'));
app.use('/resources/images', express.static(__dirname + '/resources/images'));



http.listen(port, function () {
    console.log('listening on *:' + port);
});


function update() {
    for (let room of Object.values(rooms)) {
        room.update()
    }
}

setInterval(update, 1000); //time is in ms

function User(username) {
    this.username = username
    this.score = 0
    this.currentVotes = 0
    this.currentCaption = ""
    this.vote = -1
}

function Giph(tag) {
    this.baseURL = "https://api.giphy.com/v1/gifs/",
        this.apiKey = "ityag1M5myXGHtCjPeqtXtBYa38EUo46",
        this.tag = tag,
        this.type = "random",
        this.rating = "pg-13"

    this.getKey = function () {
        return (this.apiKey)
    }

    this.url = function () {
        let url = encodeURI(
            this.baseURL +
            this.type +
            "?api_key=" +
            this.apiKey +
            "&tag=" +
            this.tag +
            "&rating=" +
            this.rating
        );
        return url;
    }

    this.newGif = function () {
        $.ajaxSetup({ async: false });
        let string = $.ajax({
            url: this.url(),
            async: false
        }).responseText;
        let json = JSON.parse(string);
        return json.data.image_original_url
    }
}

