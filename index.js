// prepare and launch socket.io server
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// initialize variables and functions
var rooms = {};

// function to generate code
var generateCode = function() {
  var code = "";
  var i;
  for (i = 0; i < 8; i++) {
    code = code + String.fromCharCode(65 + (Math.random() * 25));
  };
  return code;
};

// function to end a game in a room
var endGame = function(room, reason, victory) {
  let summaryPacket = {
    "reason": reason,
    "victory": victory,
    "impostor": rooms[room].impostor
  };
  io.in(room).emit("end game", summaryPacket);
  rooms[room].state = "Ready";
};

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
      
      // decrement player count
      rooms[socket.room].players--;
      
      // if Impostor left the game, end the game
      if (socket.role == "Impostor") {
        endGame(socket.room, "Impostor left the game","Crewmate");

      } else {

        // end game if there are only 2 players
        if (rooms[socket.room].players <= 2) {
          endGame(socket.room, "Crewmate left the game","Impostor");
        }
      }
      
      // destroy room when there are no players in that room
      if (rooms[socket.room].players == 0) {
        delete rooms[socket.room];
      }
      
      // grant a random person ownership if owner leaves
      if (socket.owner == true && rooms[socket.room].players > 0) {
        
      }
    }
  });
    
  // create a room with name when called
  socket.on('create', function(name, callback) {
    if (socket.joined == false) {
      socket.room = socket.id;
      
      // initialize room data
      let roomData = {};
      roomData.name = name;
      roomData.players = 1;
      roomData.owner = socket.name;
      roomData.state = "Ready";
      roomData.code = generateCode();
      
      // set room data
      socket.join(roomData.code);
      rooms[roomData.code] = roomData;
        
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
      if (rooms[room_code].players < 8 && socket.joined == false) {
        
        // join room and increment player count
        rooms[room_code].players++;
        socket.joined = true;
        socket.join(room_code);
        callback("Success");
        
      } else {
     
        // return an error if room is full
        callback("Room is full.");
      }
      
    } else {

      // return an error if room does not exist
      callback("Room does not exist.");
      
    }
  });
    
});
  
http.listen(port, function() {
  console.log('listening on *:' + port);
});
