// prepare and launch socket.io server
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
const https = require('https');

// initialize variables and functions
var data = {};

const options = {
  hostname: 'botpixel-games.000webhostapp.com',
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

// socket connection handler
io.on('connection', function(socket) {
  
  // fetch data
  socket.on('fetch', function(input, callback) {
     callback(data);
  });
  
  // fetch data from console
  socket.on('console input', function(input, callback) {
    io.emit('console log', data);
  });
  
});
  
http.listen(port, function() {
  console.log('listening on *:' + port);
});
