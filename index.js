// prepare and launch socket.io server
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// initialize variables
var functions = require('./functions');
var rooms = {};

// socket connection handler
io.on('connection', function(socket) {
  
  // intialize socket variables
  socket.joined = false;
  socket.owner = false;
  socket.name = "Guest";
  
  // fetch rooms
  socket.on('fetch', function(input, callback) {
    callback(rooms);
  });
  
  // rename player
  socket.on('rename', function(input, callback) {
    if (input.length <= 20 && input.length > 1) {
      socket.name = input;
      callback("success");
    } else {
      callback("error");
    }
  });
  
  // fetch socket id
  socket.on('id', function(input, callback) {
    callback(socket.id);
  });
  
  // handle disconnection
  socket.on('disconnect', function(reason) {
    if (socket.joined == false) {
      
      // let other clients know player disconnected
      let offlinePacket = {
        "reason": reason, // the reason why the player was disconnected
        "id": socket.id, // the id of the player who disconnected
        "role": socket.role // the role of the player (Imposter or Crewmate)
      };
      io.in(socket.room).emit("offline", offlinePacket);
      
      // decrease player count
      rooms[socket.room].players--;
      
      // destroy room when there are no players in that room
      if (rooms[socket.room].players <= 0) {
        delete rooms[socket.room];
      }
    }
  });
    
  // create a room with name when called
  socket.on('create', function(name, callback) {
    if (socket.joined == false) {
      socket.join(socket.id);
      socket.room = socket.id;
      
      // initialize room data
      let roomData = {};
      roomData.name = name;
      roomData.players = 1;
      roomData.owner = socket.name;
      
      // set room data
      rooms[functions.generate_code()] = roomData;
        
      // inform player that room was successfully created
      callback("success");
      
    } else {
      
      // inform player if room wasn't successfully created
      callback("error");
    }
  });
  
  // join a game by code
  socket.on('join game', function(room_code, callback) {
    
    // check if room exists
    if (room_code in rooms) {
      
      // attempt to join room
      
      
    } else {

      // return an error if room does not exist
      callback("Room does not exist.");
      
    }
    
  });
    
});
  
http.listen(port, function() {
  console.log('listening on *:' + port);
});
