// prepare and launch socket.io server
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var rooms = {};

io.on('connection', function(socket) {
  // intialize socket variables
  socket.joined = false;
  socket.owner = false;
  
  // fetch rooms
  socket.on('fetch', function(input, callback) {
    callback(rooms);
  });
  
  // fetch socket id
  socket.on('id', function(input, callback) {
    callback(socket.id);
  });
  
  // handle disconnection
  socket.on('disconnect', function(reason) {
    if (socket.joined == false) {
      
      // let other clients know player disconnected
      io.in(socket.room).emit("offline", socket.id);
      
      // decrease player count
      rooms[socket.room].players--;
      
      // destroy room when there are no players in that room
      if (rooms[socket.room].players <= 0) {
        delete rooms[socket.room];
      }
    }
  });
    
  // create a room with name
  socket.on('create', function(name, callback) {
    if (socket.joined == false) {
      socket.join(socket.id);
      socket.room = socket.id;
      
      // initialize room data
      let roomData = {};
      roomData.name = name;
      roomData.players = 1;
      
      // set room data
      rooms[socket.id] = roomData;
        
      callback("success");
    } else {
      callback("error");
    }
  });
  
});
  
http.listen(port, function() {
  console.log('listening on *:' + port);
});
