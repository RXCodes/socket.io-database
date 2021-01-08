// prepare and launch socket.io server
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
const https = require('https');

// initialize variables and load from last backup
var data = {};

const options = {
  hostname: 'tophattumble.000webhostapp.com',
  path: '/database/data.txt',
  port: 443,
  method: 'GET'
};

var response = "";
const req = https.request(options, res => {
  response = "";

  res.on('data', d => {
    process.stdout.write(d)
    response += d;
    data = response;
  })
})

req.end()

// function to generate code
var generateCode = function() {
  let generating = true;
  while (generating) {
    let code = "";
    let i;
    for (i = 0; i < 8; i++) {
      code = code + String.fromCharCode(65 + (Math.random() * 25));
    };
    if (code in codes == false) {
      generating = false;
    }
  }
  return code;
};

// sync to database handler
var syncData = function() {
  
  io.emit('console log', "sync started.");
  io.emit('console log', data);
  
  let packet = JSON.stringify({
    data: data
  });
  
  let options = {
    hostname: 'tophattumble.000webhostapp.com',
    path: '/database/data-sync.php',
    port: 443,
    method: 'POST',
    headers: {
    'Content-Type': 'application/json',
    'Content-Length': packet.length
    }
  };
  
  const req = https.request(options, resp => {
    resp.on('data', d => {
      process.stdout.write(d);
      io.emit('console log', JSON.stringify(d));
    })
  })

  req.on('error', error => {
    console.error(error)
    process.stdout.write("Error: ");
    process.stdout.write(error);
  })
  
  req.write(packet);
  req.end();

}

// socket connection handler
io.on('connection', function(socket) {
  
  // fetch data
  socket.on('data', function(input, callback) {
     callback(data);
  });
  
  // fetch code
  socket.on('fetch', function(input, callback) {
     try {callback(data[code])} catch(e) {callback("error")};
  });
  
  
  // commands from console
  socket.on('console input', function(input, callback) {
    if (input == "data") {
      io.emit('console log', JSON.stringify(data));
    }
    if (input == "sync") {
      io.emit('console log', "syncing...");
      syncData();
    }
    if (input.startsWith("set")) {
      io.emit('console log', "forced data replace.");
      data = input;
    }
  });
  
});
  
http.listen(port, function() {
  console.log('listening on *:' + port);
});
