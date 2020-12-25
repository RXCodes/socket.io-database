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
var roomData = {};

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
    "impostor": roomData[room].impostor
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
    if (socket.joined == true) {
      
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
      if (socket.role == "Impostor" && rooms[socket.room].state == "In-Game") {
        endGame(socket.room, "Impostor left the game","Crewmate");

      } else {

        // end game if there are only 2 players
        if (rooms[socket.room].players <= 2) {
          if (rooms[socket.room].state == "In-Game") {
            endGame(socket.room, "Crewmate left the game","Impostor");
          } else {
            io.in(socket.room).emit("cancel countdown", "cancel");
            clearTimeout(roomData[socket.room].timer);
          }
        }
      }
      
      // end game if all tasks were finished by other players
      rooms[socket.room].totalTasks -= 6;
      if (rooms[socket.room].tasksFinished >= rooms[socket.room].totalTasks) {
        endGame(socket.room, "All tasks were finished","Crewmate");
      }
      
      // remove player from list
      const index = roomData[socket.room].list.indexOf(socket.id);
      if (index > -1) {
        roomData[socket.room].list.splice(index, 1);
      }
      
      // add to available colors
      roomData[socket.room].available_colors.push(socket.color);
      
      // destroy room when there are no players in that room
      if (rooms[socket.room].players == 0) {
        delete rooms[socket.room];
        delete roomData[socket.room];
      }
      
      // grant a random person ownership if owner leaves
      if (socket.owner == true && rooms[socket.room].players > 0) {
        roomData[socket.room].list.sort(() => Math.random() - 0.5);
        let newOwner = roomData[socket.room].list[0];
        io.to(newOwner).owner = true;
        room[socket.room].owner = io.to(newOwner).name;
        io.in(socket.room).emit("owner", newOwner);
      }
    }
  });
    
  // create a room with name when called
  socket.on('create', function(name, callback) {
    if (socket.joined == false) {
      socket.room = socket.id;
      
      // initialize room data
      let roomJSON = {};
      roomJSON.name = name;
      roomJSON.players = 1;
      roomJSON.owner = socket.name;
      roomJSON.state = "Ready";
      roomJSON.code = generateCode();
      
      // set room data
      socket.join(roomJSON.code);
      rooms[roomJSON.code] = roomJSON;
      let colorData = [0,1,2,3,4,5,6,7,8,9,10,11];
      roomData[roomJSON.code] = {"list": [socket.id],
                                "available_colors": colorData.sort(() => Math.random() - 0.5)};
        
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
      if (rooms[room_code].players < 8 && socket.joined == false ** room[room_code].state == "Ready") {
        
        // join room and increment player count
        rooms[room_code].players++;
        roomData[room_code].list.push(socket.id);
        socket.joined = true;
        socket.join(room_code);
        socket.room = room_code;
        let joinPacket = {
          "id": socket.id, // id of player
          "name": socket.name, // name of player
          "color": roomData[room_code].available_colors[0] // color id of player
        };
        io.in(socket.room).emit("new player", joinPacket);
        io.to(socket.id).emit("color", roomData[room_code].available_colors[0]);
        socket.color = roomData[room_code].available_colors[0];
        roomData[room_code].available_colors.shift();
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
    
  // start game handler
  socket.on('start', function(room_code, callback) {
    
    // check conditions
    if (socket.owner == true && rooms[socket.room].state == "Ready") {
      
      // initiate game and start countdown
      io.in(socket.room).emit("start", "countdown");
      rooms[socket.room].state = "In-Game";
      let countdown = 16;
      roomData[socket.room].timer = setInterval(() => {
        countdown--;
        io.in(socket.room).emit("countdown", countdown);
        
        // when countdown ends, give each player a role and start game
        if (countdown == 0) {
          clearTimeout(roomData[socket.room].timer);
          roomData[socket.room].list.sort(() => Math.random() - 0.5);
          for (let i; i < roomData[socket.room].list.length; i++) {
            io.in(socket.room).emit("start", "start");
            room[socket.room].totalTasks = (room[socket.room].players - 1) * 6;
            room[socket.room].tasksFinished = 0;
            if (i == 0) {
              io.to(roomData[socket.room].list[i]).emit("role","Impostor");
            } else {
              io.to(roomData[socket.room].list[i]).emit("role","Crewmate");
            }
          }
        }
      }, 1000 );
    }
  });
  
  // handle movement
  socket.on('move', function(input, callback) {
    try {
      let packet = JSON.parse(input);
      packet.id = socket.id;
      io.in(socket.room).emit("move", packet);
    } catch(e) {};
  });
  
  // handle color change
  socket.on('color change', function(input, callback) {
    
    // check if color is available
    if (roomData[socket.room].available_colors.includes(input)) {
      
      // swap color if possible
      const index = roomData[socket.room].available_colors.indexOf(input);
      if (index > -1) {
        roomData[socket.room].available_colors.splice(index, 1);
        roomData[socket.room].available_colors.push(socket.color);
        socket.color = input;
        let changePacket = {
          "color": input,
          "id": socket.id
        };
        io.in(socket.room).emit("color swap", changePacket);
        callback("success");
      } else {
        callback("error");
      }
    } else {
      
      // return error if failed to change color
      callback("error");
    }
  });
  
  // custom in-game events
  socket.on('event', function(input, callback) {
    try {
      let packet = JSON.parse(input);
      packet.id = socket.id;
      io.in(socket.room).emit("event", packet);
    } catch(e) {};
  });
            
  // task finish
  socket.on('finish task', function(input, callback) {
    if (socket.joined == true) {
      if (rooms[socket.room].state !== "Ready") {
        rooms[socket.room].tasksFinished++;
        io.in(socket.room).emit("finish task", rooms[socket.room].tasksFinished);
      }
    }
  });
});
  
http.listen(port, function() {
  console.log('listening on *:' + port);
});
