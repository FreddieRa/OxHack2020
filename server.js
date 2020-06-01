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

let rooms = {}

io.on('connection', function(socket){
    socket.on('newRoom', function(id, callback) {
        let roomid = Math.floor(Math.random()*90000) + 10000
        let room = new Room(roomid)
        rooms[roomid] = room
        console.log(callback)
        callback(roomid)
    })

    socket.on('joinRoom', function(roomid, callback) {
        if (roomid in rooms) {
            callback(true)
        } else {
            callback(false)
        }
    })
});

function Room(roomID) {
    this.roomID = roomID;
    this.roundTime = 30;
    this.countDownTimer = this.roundTime;
    this.messages = 0;
    this.users = {}

    this.gotGif = false;
    this.usersSubmitted = 0;
    this.usersVoted = 0;
    this.skippedVotes = 0;

    this.currentMeme = "";
    this.nextMeme = "";
    this.maxVotes = -1;
    this.winningSubmission = "";
    this.state = 0

    this.nsp = io.of('/'+roomID);

    this.nsp.on('connection', function(socket){
        socket.on('chat message', function(msg){
            let user = msg.user
            let data = msg.data
            switch (state) {
                case 0:
                    break;
                case 1:
                    if (user in this.users) {
                        console.log(user + " sent in " + data)
                        this.users[user].currentCaption = data
                        usersSubmitted += 1
                        if (usersSubmitted == Object.keys(this.users).length) {
                            console.log("state12() called");
                            this.state12()
                        }
                    }
                    break;
            }
        });
    
        socket.on('user', function(name){
            //Send error back for duplicate names
            if (name in this.users == false && this.state == 0) { 
                users[name] = new User(name)
                this.nsp.emit('command',{'cmd':'user', 'data': Object.keys(this.users)})
                console.log("Sending " + name + " to clients");
                console.log("Num current useres " + Object.keys(this.users).length);
            }
        });

        socket.on('start', function(_){
            this.state01()
        });

        socket.on('reset', function(_){
            this.state = 0
            this.messages = 0;
            this.users = {}

            this.gotGif = false;
            this.usersSubmitted = 0;
            this.usersVoted = 0;
            this.skippedVotes = 0;

            this.currentMeme = "";
            this.nextMeme = "";
            this.maxVotes = -1;
            this.nsp.emit('refresh', null)
        });

        socket.on('skip', function(name){
            if (name in this.users && this.state == 1) {
                this.skippedVotes += 1
                if (skippedVotes / Object.keys(this.users).length >= 0.5) {
                    this.state11()
                }
            }
        });

        socket.on('vote', function(vote){
            let u = this.users
            user = vote.user
            data = vote.data
            if (user in u && data in u) {
                console.log(user + " VOTED FOR " + data)
                if(false){
                        console.log("ERROR; you can't vote for yourself!")
                }
                else {
                    u[user].vote = data
                    u[data].currentVotes += 1
                    if (u[data].currentVotes >= this.maxVotes) {
                        this.maxVotes = u[data].currentVotes
                        this.winningSubmission = u[data].currentCaption
                    }
                    u[data].score += 10
                    this.usersVoted += 1
                    if (this.usersVoted == Object.keys(u).length) {
                        this.state23()
                    }
                }
            }
        });
    });

    this.update = function() {
        switch (this.state) {
            case 0: 
                break;
    
            case 1:
                if (this.gotGif == false) {
                    let url = getGif()
                    this.nsp.emit('command',{'cmd':'preload', 'data':url}) // Tells client to preload gif
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
                    this.state31()
                }
        }
    }

}



let states = {
   0:  "waiting for users to join", 
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


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


app.get('/js/client.js', function(req, res){
    res.sendFile(__dirname + '/js/client.js');
});

app.get('/EdSite', function(req, res){
    res.sendFile(__dirname + '/EdSite/index.html')
})

app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));


app.use('/resources/gifs', express.static(__dirname + '/resources/gifs'));


http.listen(port, function(){
  console.log('listening on *:' + port);
});


function update() {
    for (let room of Object.values(rooms)) {
        room.update()
    }
}


function state01() {
    // Hide start from all users -> fetch gif -> show countdown -> show gif
    // io.emit('command', {'cmd':'hide','data': 'start'});

    let url = getGif()
    currentMeme = nextMeme
    io.emit('command',{'cmd':'forceLoad', 'data':url}) // Tells client to load and display gif
    io.emit('command',{'cmd':'startTimer', 'data':roundTime})     
    io.emit('command',{'cmd':'hide', 'data': ["StartBtn","CaptionsListDiv", "UsersListDiv"]})
    io.emit('command',{'cmd':'show', 'data': ["gif","Counter","SkipBtn","CaptionsSubmitDiv"]})

    countDownTimer = roundTime

    state = 1
}

function state11() {
    // counting down, registering skip votes, accepting submissions
        //      If skipped: Show new gif -> Back to waiting for all users
    if (gotGif == false) {
        let url = getGif()
        io.emit('command',{'cmd': 'forceLoad', 'data': url}) // Tells client to load and display gif
    } else {
        io.emit('command',{'cmd': 'loadStored', 'data': null}) // Tells client to display loaded gif (with countdown 0)
    }
    currentMeme = nextMeme
    io.emit('command',{'cmd':'hide', 'data': ["StartBtn","CaptionsListDiv","UsersListDiv"]})
    io.emit('command',{'cmd':'show', 'data': ["gif","Counter","SkipBtn","CaptionsSubmitDiv"]})
    io.emit('command',{'cmd':'startTimer', 'data':roundTime})

    gotGif = false;
    countDownTimer = roundTime
    skippedVotes = 0
    usersSubmitted = 0
}

function state12() {
    // After: 
    //      Else: Hide submission box -> Send submissions to user -> Reset counter
    
    let mapped = Object.values(users).map(x => [x.username, x.currentCaption])
    io.emit('captions', mapped); // On receiving captions, hide submissions
    // io.emit('command',{'cmd': 'show', 'data': 'CaptionsListDiv'})
    io.emit('command',{'cmd':'startTimer', 'data':roundTime})
    io.emit('command',{'cmd':'hide', 'data': ["StartBtn","SkipBtn","CaptionsSubmitDiv","UsersListDiv", "BestMeme"]})
    io.emit('command',{'cmd':'show', 'data': ["gif","Counter","CaptionsListDiv"]})
    gotGif = false;
    countDownTimer = roundTime
    skippedVotes = 0
    usersSubmitted = 0
    state = 2
}


function state23() {
    // During: Recieving votes, Counting Down
    // Stop Condition: All users have voted || Countdown == 0
    // After: Send scores to all users -> wait 30 seconds -> change back to waiting for submissions with new gif
    // LOOP END
    let u = Object.values(users)

    
    io.emit('command',{'cmd':'hide', 'data': ["Counter","SkipBtn","CaptionsSubmitDiv","gif","StartBtn","UsersListDiv"]})
    io.emit('command',{'cmd': 'loadStored', 'data': null}) // Tells client to display loaded gif in 30 seconds
    io.emit('command',{'cmd':'show', 'data': ["loader"]})

    // SHOW LEADERBOARD
    // io.emit('command',{'cmd': 'show', 'data': 'LEADERBOARD'})
    // scores = Object.values(users).sort((a, b) => int(a.score) - int(b.score));
    // csv = ""
    // for (user of scores){
    //     csv = csv+user.username+","+user.score+"\n"
    // }
    // const fs = require('fs');
    // const output = require('d3node-output');
    // const d3 = require('d3-node')().d3;
    // const d3nBar = require('d3node-barchart');
    // const data = d3.csvParse(csv);
    // page = d3nBar({data: data})
    // console.log("Graph: "+page)
    // io.emit('scores', page)
    
    let text = winningSubmission.split('\\')

    let data = {"template_id": currentMeme, "username": "FreddieRa", "password": "OxHack2020!", "text0": text[0], "text1": text[1]}

    $.post("https://api.imgflip.com/caption_image", data, function(result) {
        console.log(result)
        let url = JSON.parse(result).data.url
        io.emit('winningMeme', url)
    }, "html")

    io.emit('winner',winningSubmission)
    io.emit('command',{'cmd': 'startTimer', 'data':6})

    io.emit('command',{'cmd':'hide', 'data': ["StartBtn","CaptionsListDiv","LeaderBoardDiv","UsersListDiv", "gif","Counter","SkipBtn","CaptionsSubmitDiv"]})
    
    for (let user of Object.values(users)) {
        user.currentCaption = ""
        user.currentVotes = 0
        user.vote = -1
    }

    countDownTimer = 6
    usersVoted = 0
    maxVotes = -1
    state = 3
    currentMeme = nextMeme
}


function state31() {
    io.emit('command',{'cmd':'hide', 'data': ["StartBtn","CaptionsListDiv","LeaderBoardDiv","UsersListDiv", "BestMeme"]})
    io.emit('command',{'cmd':'show', 'data': ["gif","Counter","SkipBtn","CaptionsSubmitDiv"]})
    io.emit('command',{'cmd':'startTimer', 'data':30})
    countDownTimer = 30
    state = 1
}


setInterval(update, 1000); //time is in ms



function getGif(tag = "") {
    //let g = new Giph(tag);
    //return g.newGif()
    let url = "https://api.imgflip.com/get_memes"
    let string = $.ajax({ 
        url: url, 
        async: false
     }).responseText;
    let json = JSON.parse(string);
    let memes = json.data.memes
    let keys = Object.keys(memes)
    let key = Math.floor(Math.random() * keys.length)
    let memeurl = memes[keys[key]].url
    nextMeme = memes[keys[key]].id
    return memeurl
}





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
  
    this.getKey = function() {
      return (this.apiKey)
    }

    this.url = function() {
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
    
    this.newGif = function() {
        $.ajaxSetup({async: false});
        let string = $.ajax({ 
            url: this.url(), 
            async: false
         }).responseText;
        let json = JSON.parse(string);
        return json.data.image_original_url
    }
}

