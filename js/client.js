$(function() {
var socket = io();    //Gets the socket from the server (?)

// class GetGiph{
//   constructor(APIkey = "ityag1M5myXGHtCjPeqtXtBYa38EUo46"){
//       this.GphApiClient = require('giphy-js-sdk-core');
//       this.client = GphApiClient(APIkey);
//   }

//   getKey() {
//       alert("in")
//       $('#messages').append($('<li>').text("this.client.APIkey"));
//       $('#messages').append($('<li>').text(this.client.APIkey));
//       alert(this.client.APIkey);
//   }
// }

function GetGiph(APIKey = "ityag1M5myXGHtCjPeqtXtBYa38EUo46") {
  this.APIkey = APIKey;
  this.gifApiClient = require('giphy-js-sdk-core');
  this.client = this.gifApiClient(this.APIkey);

  this.getKey = function() {
    alert("in");
    $('#messages').append($('<li>').text("this.client.APIkey"));
    $('#messages').append($('<li>').text(this.client.APIkey));
    alert(this.client.APIkey);
  }
}

$('form').submit(function(){
  socket.emit('chat message', $('#m').val()); //Sending a message to server
  $('#m').val('');  //Setter
  return false;
});

socket.on('chat message', function(msg){    //Recieving from server
  $('#messages').append($('<li>').text(msg + " ah"));   //Add message to #messages
  var GiphSearch = new GetGiph();
  GiphSearch.getKey();
  window.scrollTo(0, document.body.scrollHeight);
});
});