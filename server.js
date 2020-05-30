var express = require('express');
var app = express();
var giphy = require('giphy-js-sdk-core');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

var jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

var $ = jQuery = require('jquery')(window);

let messages = 0;


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/js/client.js', function(req, res){
    res.sendFile(__dirname + '/js/client.js');
});

app.get('/EdSite', function(req, res){
    res.sendFile(__dirname + '/EdSite/index.html')
})

app.use('/EdSite/resources/gifs', express.static(__dirname + '/EdSite/resources/gifs'));

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
      if (msg.charAt(0) == "/") {
          let space = msg.indexOf(' ')
          // Get the type of command
          // e.g. for "/gif hello" return "gif"
          let cmd = msg.substr(1, space-1)
          console.log(cmd)

          // Get data of command
          // e.ge for "/gif hello" return "hello"
          let data = msg.slice(space+1) + msg.charAt(-1)
          console.log(data)

          let returnCommand = {
              "cmd": cmd,
              "data": null,
          }

          switch (cmd) {
            case "gif":
                let g = new Giph(data)
                returnCommand.data = g.newGif()
                break;
            case "i": //Itallics
            case "b": //Bold
                returnCommand.data = data
                break
            default:
                break;
          }
          console.log(returnCommand)
          io.emit('command', returnCommand)
    } 
    else {
        io.emit('chat message', msg);
    }
    messages += 1
  });
});


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
        console.log(this.url())
        $.ajaxSetup({async: false});
        let string = $.ajax({ 
            url: this.url(), 
            async: false
         }).responseText;
        let json = JSON.parse(string);
        return json.data.image_original_url
    }
}


http.listen(port, function(){
  console.log('listening on *:' + port);
});

/*
function checkMessages() {
    if(messages >= 3) {
        messages = 0
        io.emit('command', 'wipe');
    }
}


setInterval(checkMessages, 1000); //time is in ms
*/