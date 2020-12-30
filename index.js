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
var onlineCount = 0;

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

// function to initiate meeting
var startMeeting = function(room, type, reporter, metadata) {
  clearTimeout(roomData[room].timer);
  let meetingPacket = {
    "type": type, // type of meeting (Emergency or Report)
    "reporter": reporter // player who initiated meeting
  }
  roomData[room].votes = 0;
  roomData[room].voteData = {};
  io.in(room).emit("meet", meetingPacket);
  
  // start a timer
  let time = 110;
  let endMeet = false;
  roomData[room].timer = setInterval(() => {
    time--;
    io.in(room).emit("meet time", time);
    
    // meeting ends by time
    if (time == 0) {
      endMeet = true;
      
    } else {
      
      // meeting ends when everyone has voted
      if (roomData[room].votes == rooms[room].players) {
        endMeet = true;
      }  
    }
    
    // when meeting ends, stop timer and send all clients data
    if (endMeet) {
      clearTimeout(roomData[room].timer);
      io.in(room).emit("meet end", roomData[room].voteData);
      
      // count votes
      let voteCounts = {};
      Object.keys(roomData[room].voteData).forEach(function(key) {
        try {
        voteCounts[roomData[room].voteData[key]]++;
        } catch(e) {
          voteCounts[roomData[room].voteData[key]] = 1;
        }
      });
      
      // get most voted
      let highestVoteCount = 0;
      let topCandidate = "none";
      Object.keys(voteCounts).forEach(function(key) {
        if (voteCounts[key] > highestVoteCount) {
          highestVoteCount = voteCounts[key];
          topCandidate = key;
        }
        if (voteCounts[key] == highestVoteCount) {
          topCandidate = "tie";
        }
      });
      
      let role = "none";
      try {
        role = io.to(topCandidate).role;
      } catch(e) {}
      
      // announce top candidate
      let summaryPacket = {
        "topVote": topCandidate,
        "role": role
      };
      io.in(room).emit("vote summary", summaryPacket);
      
      // remove candidate from game if possible
      try {
        io.to(topCandidate).alive = false;
      } catch(e) {}
      
      // end game if Impostor was chosen
      if (role == "Impostor") {
        endGame(room, "Impostor was kicked from the ship", "Crewmate");
      }
    }
    
  },
  1000
  )
};

// socket connection handler
io.on('connection', function(socket) {
  onlineCount++;
  
  // intialize socket variables
  socket.joined = false;
  socket.owner = false;
  socket.name = "Guest";
  socket.room = null;
  
  // fetch online user count
  socket.on('fetch online', function(input, callback) {
    callback(onlineCount);
  });
  
 // fetch player colors
  socket.on('fetch colors', function(input, callback) {
    if (socket.room in rooms) {
      callback(rooms[socket.room].colors);
    }
  });
  
  // fetch rooms
  socket.on('fetch', function(input, callback) {
    let returnDictionary = {};
    Object.keys(rooms).forEach(function(key) {
      returnDictionary[key] = JSON.stringify(rooms[key]);
    });
    callback(returnDictionary);
  });
  
  // fetch room data
  socket.on('fetch room', function(input, callback) {
    if (socket.room in rooms) {
      callback(rooms[socket.room]);
    }
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
    onlineCount--;
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
        endGame(socket.room, "Impostor left the game", "Crewmate");

      } else {
        
        // decrement crewmate count if a crewmate leaves
        if (socket.role == "Crewmate" && rooms[socket.room].state == "In-Game") {
          roomData[socket.room].crewmates--;
        }

        // end game if there is only one crewmate left
        if (roomData[socket.room].crewmates == 1) {
          if (rooms[socket.room].state == "In-Game") {
            endGame(socket.room, "Crewmate left the game", "Impostor");
          } else {
            io.in(socket.room).emit("cancel countdown", "cancel");
            clearTimeout(roomData[socket.room].timer);
          }
        }
      }
      
      // end game if all tasks were finished by other players
      rooms[socket.room].totalTasks -= 6;
      if (rooms[socket.room].tasksFinished >= rooms[socket.room].totalTasks) {
        endGame(socket.room, "All tasks were finished", "Crewmate");
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
      
      // initialize room data
      let roomJSON = {};
      roomJSON.name = name;
      roomJSON.players = 1;
      roomJSON.owner = socket.name;
      roomJSON.state = "Ready";
      roomJSON.code = generateCode();
      roomJSON.success = "1";
      
      // set room data
      socket.join(roomJSON.code);
      socket.joined = true;
      rooms[roomJSON.code] = roomJSON;
      socket.room = roomJSON.code;
      let colorData = ["0","1","2","3","4","5","6","7","8","9","10","11"];
      roomData[roomJSON.code] = {"list": [socket.id],
                                "available_colors": colorData.sort(() => Math.random() - 0.5)};
      socket.color = roomData[roomJSON.code].available_colors[0];
      roomJSON.colors = {};
      roomJSON.colors[socket.id] = roomData[roomJSON.code].available_colors[0];
      io.to(socket.id).emit("color", roomData[roomJSON.code].available_colors[0]);
      rooms[roomJSON.code] = roomJSON;
      roomData[roomJSON.code].available_colors.shift();
        
      // inform player that room was successfully created
      callback(roomJSON);
      
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
      if (rooms[room_code].players < 8 && socket.joined == false && rooms[room_code].state == "Ready") {
        
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
        rooms[room_code].colors[socket.id] = roomData[room_code].available_colors[0];
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
    if (socket.joined == true) {
     if (socket.owner == true && rooms[socket.room].state == "Ready" && rooms[socket.room].players > 2) {
      
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
            io.to(roomData[socket.room].list[i]).alive = true;
            io.in(socket.room).emit("start", "start");
            room[socket.room].totalTasks = (room[socket.room].players - 1) * 6;
            room[socket.room].crewmates = room[socket.room].players - 1;
            room[socket.room].tasksFinished = 0;
            if (i == 0) { // assign impostor role
              io.to(roomData[socket.room].list[i]).emit("role","Impostor");
              roomData[socket.room].impostor = roomData[socket.room].list[i];
              io.to(roomData[socket.room].list[i]).role = "Impostor";
            } else { // assign crewmate role
              io.to(roomData[socket.room].list[i]).emit("role","Crewmate");
              io.to(roomData[socket.room].list[i]).role = "Crewmate";
            }
          }
        }
      }, 1000 );
    }
   }
  });
  
  // handle movement
  socket.on('move', function(input, callback) {
    try {
      let packet = JSON.parse(input);
      packet.id = socket.id;
      io.in(socket.room).emit("move", packet);
    } catch(e) {callback(e)};
  });
  
  // handle color change
  socket.on('color change', function(input, callback) {
    
    // check condition
    if (socket.joined == true) {
    
    // check if color is available
    if (input in roomData[socket.room].available_colors) {
      
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
        rooms[socket.room].colors[socket.id] = input;
        callback("success");
      } else {
        callback("error");
      }
    } else {
      
      // return error if failed to change color
      callback("error");
     }
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
        if (rooms[socket.room].totalTasks == rooms[socket.room].tasksFinished) {
          endGame(socket.room, "All tasks were completed","Crewmate");
        }
        callback("success");
      }
    }
  });
  
  // impostor kill
  socket.on('kill', function(input, callback) {
    if (socket.joined == true) {
      if (rooms[socket.room].state !== "Ready" && socket.role == "Impostor") {
        
        // check if player exists in the room
        if (input in roomData[socket.room].list) {
          
          // kill player
          io.to(input).alive = false;
          let killPacket = {
            "target": input, // ID of player who was killed
            "killer": socket.id // ID of the killer
          };
          io.in(socket.room).emit("kill", killPacket);
          roomData[socket.room].crewmates--;
          callback("success");
          
          // end game when there is only one crewmate left
          if (roomData[socket.room].crewmates == 1) {
            endGame(socket.room, "Impostor killed one of the last standing crewmates", "Impostor");
          }
          
        }
      }
    }
  });
  
  // report a dead body and start a meeting
  socket.on('report body', function(input, callback) {
    if (socket.joined == true) {
      if (rooms[socket.room].state !== "Ready" && socket.alive == true) {
        
        // check if player exists in the room
        if (input in roomData[socket.room].list) {
          
          // report dead body
          let reportPacket = {
            "target": input, // ID of player whose body was reported
            "reporter": socket.id // ID of the reporter
          };
          io.in(socket.room).emit("report body", reportPacket);
          startMeeting(socket.room, "Report", socket.id);
          callback("success");
          
        }
      }
    }
  });
  
  // emergency meeting
  socket.on('emergency meeting', function(input, callback) {
    if (socket.joined == true) {
      if (rooms[socket.room].state !== "Ready" && socket.alive == true) {
        startMeeting(socket.room, "Emergency", socket.id);
      }
    }
  });
  
  // handle votes
  socket.on('vote', function(input, callback) {
    if (socket.joined == true) {
      if (rooms[socket.room].state !== "Ready" && socket.alive == true) {
        
        // increment vote
        roomData[socket.room].votes++;
        
        // set vote
        roomData[socket.room].voteData[socket.id] = input;
        let votePacket = {
          "voter": socket.id, // id of player who voted
          "vote": input // what the player voted for (Skip or Player ID)
        };
        io.in(socket.room).emit("vote", votePacket);
        callback("Success");
        
      }
    }
  });
  
});
  
http.listen(port, function() {
  console.log('listening on *:' + port);
});
