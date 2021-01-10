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
var data = "";

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
    console.log(d);
    response += d;
  })
  
  res.on('end', function () {
    data = response;
   });
  
})

req.end()

// function to generate code
var generateCode = function() {
  let generating = true;
  let code = "";
  while (generating) {
    code = "";
    let i;
    for (i = 0; i < 8; i++) {
      code = code + String.fromCharCode(65 + (Math.random() * 25));
    };
    if (data[code] == undefined) {
      generating = false;
    } else {
      return code;
    }
  }
  return code;
};

// sync to database handler
var syncData = function() {
  
  io.emit('console log', "sync started.");
  io.emit('console log', data);
  
  let packet = JSON.stringify({
    pw: "@TopHat6272",
    data: data
  });
  
  let options = {
    hostname: 'tophattumble.000webhostapp.com',
    path: '/database/data-sync.php',
    port: 443,
    method: 'POST',
    headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
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

// function to set code
var updateCode = function(code, input) {
  data[code] = input;
}

// backup every 30 minutes
var backups = setInterval(() => {
  syncData();
},
  1000 * 30 * 60
)


// socket connection handler
io.on('connection', function(socket) {
  
  // fetch data
  socket.on('data', function(input, callback) {
     callback(data);
  });
  
  // fetch code
  socket.on('fetch', function(input, callback) {
     callback(data[input]);
  });
  
  // generate code
  socket.on('generate', function(input, callback) {
    let code = generateCode();
    updateCode(code, input);
    callback(code);
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
