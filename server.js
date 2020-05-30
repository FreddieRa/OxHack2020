var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use('/js',  express.static(__dirname + '/js'))
app.use('/css',  express.static(__dirname + '/css'))

app.get('/EdSite', function(req, res){
  res.sendFile(__dirname + '/EdSite/index.html')
})

app.use('/EdSite/resources/gifs', express.static(__dirname + '/EdSite/resources/gifs'));

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
