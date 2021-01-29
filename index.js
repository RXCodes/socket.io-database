// prepare and launch socket.io server
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
const https = require('https');
const querystring = require('querystring');

// initialize variables
var leaderboard = {};
var discordTags = {};
var displayNames = {};
var highScores = {};
var levelAttempts = {};
var global = {};

// function: check a level
var levelCheck = function (levelName) {
  let deniedLevels = {
    "discordTags": 1,
    "displayNames": 1,
    "highScores": 1,
    "levelAttempts": 1,
    "global": 1
  }
  if (deniedLevels[levelName] !== 1) {
    return true;
  } else {
    return false;
  }
};

// function: set a score in the leaderboard
var setScore = function (leaderboardName, playerName, score, coinsCollected, duration, discordTag) {
  
  // check for invalid inputs
  if (score == undefined) {
    return "error";
  }
  
  // check if leaderboard exists -- set leaderboard if not
  if (leaderboard[leaderboardName] == undefined) {
    leaderboard[leaderboardName] = {};
  }
  
  // player data
  let Player = {
      name: playerName,
      score: score,
      unix: Date.now() / 1000,
      coins: coinsCollected,
      time: duration,
      discord: discordTag
    };
  
  if (leaderboard[leaderboardName][playerName] == undefined) {
    
    // set the score and current UNIX time if the player does not exist in the leaderboard yet
    leaderboard[leaderboardName][playerName] = Player;
    
  } else {

    // otherwise, check if provided score is greater than or equal to the player's leaderboard score
    if (score >= leaderboard[leaderboardName][playerName].score) {
    
      // update score and time if so
      leaderboard[leaderboardName][playerName] = Player;

    }
  }
}

// function: sort leaderboard || convert to readable JSON for hyperPad
var sortLeaderboard = function(leaderboardName) {
  
  // check if leaderboard exists
  if (leaderboard[leaderboardName] == undefined) {
    return "[]";
  }
  
  // intialize local variables
  let scoresArray = []
  let scoresToName = {};
  let timesArray = [];
  let timesToName = {};
  let output = [];
  
  // iterate through all players and parse JSON
  Object.keys(leaderboard[leaderboardName]).forEach(function(key) {
    scoresArray.push(leaderboard[leaderboardName][key].score);
    if (scoresToName[leaderboard[leaderboardName][key].score] == undefined) {
      scoresToName[leaderboard[leaderboardName][key].score] = [];
    }
    scoresToName[leaderboard[leaderboardName][key].score].push(leaderboard[leaderboardName][key]);
  });
  
  // sort scores in descending fashion || highest scores first
  scoresArray.sort((a, b) => b - a);
  
  // sort player by score
  for (i = 0; i < scoresArray.length; i++) {
    let score = scoresArray[i];
    let store = scoresToName[score];
    for (x = 0; x < store.length; x++) {
      output.push(JSON.stringify(store[x]));
      console.log(store[x]);
    }
  } 
  
  // return leaderboard data
  return JSON.stringify(output);
}

// function: combine all scores into accumulative scores -- global leaderboard
var globalScores = function() {
  leaderboard["global"] = {};
  Object.keys(leaderboard).forEach(function(key) {
    if (key !== "global") {
      Object.keys(leaderboard[key]).forEach(function(player) {
        let playerOBJ = leaderboard[key][player];
        if (playerOBJ.name !== undefined && playerOBJ.discord !== undefined) {
          let currentScore = 0;
          if (leaderboard["global"][player] !== undefined) {
            currentScore = parseInt(leaderboard["global"][player].score);
            currentScore += parseInt(leaderboard[key][player].score);
          } else {
            currentScore = parseInt(leaderboard[key][player].score);
          }    
          setScore("global", playerOBJ.name, currentScore, playerOBJ.coins, playerOBJ.time, playerOBJ.discord);
        }
      });
    }
  });
  return (sortLeaderboard("global"));
}

// initialize variables and load from last backup
var initPacket = JSON.stringify({
    pw: "8043EBACC7CAE08DC1A09B2B5DF472B2D44A06EEE3AEA12B0E6FB66CB7839788",
    action: "backup"
  });

const options = {
  hostname: 'botpixelgames.000webhostapp.com',
  path: '/database/events/fetchData.php',
  port: 443,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': initPacket.length
    }
};

var response = "";
const req = https.request(options, res => {
  response = "";

  res.on('data', d => {
    process.stdout.write(d);
    console.log(d);
    response += d;
  })
  
  res.on('end', function () {
    leaderboard = JSON.parse(response);
    if (leaderboard.displayNames !== undefined && leaderboard.displayNames !== []) {
      displayNames = leaderboard.displayNames;
    }
    if (leaderboard.discordTags !== undefined && leaderboard.discordTags !== []) {
      discordTags = leaderboard.discordTags;
    }
    if (leaderboard.highScores !== undefined && leaderboard.highScores !== []) {
      highScores = leaderboard.highScores;
    }
    if (leaderboard.levelAttempts !== undefined && leaderboard.levelAttempts !== []) {
      levelAttempts = leaderboard.levelAttempts;
    }
    if (leaderboard.global !== undefined && leaderboard.global !== []) {
      global = leaderboard.global;
    }
   });
  
})

req.write(initPacket);
req.end();

// sync to database handler
var syncData = function() {
  
  io.emit('console log', "sync started.");
  io.emit('console log', leaderboard);

  let packet = querystring.stringify({
    'pw': "8043EBACC7CAE08DC1A09B2B5DF472B2D44A06EEE3AEA12B0E6FB66CB7839788",
    'data': JSON.stringify(leaderboard)
  });
  
  let options = {
    hostname: 'botpixelgames.000webhostapp.com',
    path: '/database/events/sync-data.php',
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

// backup every 15 minutes
var backups = setInterval(() => {
  leaderboard.discordTags = discordTags;
  leaderboard.displayNames = displayNames;
  leaderboard.highScores = highScores;
  leaderboard.levelAttempts = levelAttempts;
  leaderboard.global = global;
  syncData();
},
  1000 * 15 * 60
)


// socket connection handler
io.on('connection', function(socket) {
  socket.auth = false;
  
  // registration
  socket.on('register', function(input, callback) {
  let success = false;
  let login = false;
  let data = {};
    try {
      data = JSON.parse(input);
      success = true;
    } catch(e) {
      callback("error");
    }
    
    if (success && socket.auth == false) {
      if (displayNames.hasOwnProperty(data.name) == false && discordTags.hasOwnProperty(data.discord) == false) {
        let name = data.name;
        let discord = data.discord;
        let letters = /^[0-9a-zA-Z]+#/;

        if (discord.indexOf("#") !== -1 && name.length <= 20 && discord.length <= 30) {
        let difference = discord.length - discord.indexOf("#");
        if (difference == 5 && letters.test(discord)) {
          callback("success");
          login = true;
          socket.auth = true;
          displayNames[name] = discord;
          discordTags[discord] = name;
          socket.name = name;
          socket.discord = discord;
          }
        } 
      }       
    }
    
    if (data !== {} && displayNames[data.name] == data.discord) {
      login = true;
      socket.name = data.name;
      socket.discord = data.discord;
      socket.auth = true;
      discordTags[data.discord] = data.name;
    }
    
    if (login == false) {
      callback("error");
    } else {
      callback("success");
    }
  });
  
  // leaderboard fetch
  socket.on('leaderboard', function(input, callback) {
    callback(sortLeaderboard(input));
  });
  
  // global leaderboard fetch
  socket.on('global leaderboard', function(input, callback) {
    callback(globalScores());
  });
  
  // set score & increment attempts
  socket.on('set score', function(input, callback) {
    if (socket.auth) {
      let data = {};
      let success = false;
      try {
        data = JSON.parse(input);
        success = true;
      } catch(e) {
        callback("error");
      }
      
      if (success && levelCheck(data.level)) {

        // increment run count
        if (global.runs == undefined) {
          global.runs = 1;
        } else {
          global.runs += 1;
        }
        io.emit("attempt", global.runs);
        
        // set score & high score
        setScore(data.level, socket.name, data.score, data.coins, data.time, socket.discord);
        if (highScores[socket.discord] == undefined) {
          highScores[socket.discord] = {};
        }
        if (highScores[socket.discord][data.level] == undefined) {
          highScores[socket.discord][data.level] = parseInt(data.score);
        } else {
          if (highScores[socket.discord][data.level] < data.score) {
            highScores[socket.discord][data.level] = parseInt(data.score);
          }
        }
        
        // add attempt
        if (levelAttempts[socket.discord] == undefined) {
          levelAttempts[socket.discord] = {};
        }
        if (levelAttempts[socket.discord][data.level] == undefined) {
          levelAttempts[socket.discord][data.level] = 1;
        } else {
          levelAttempts[socket.discord][data.level] += 1;
        }
        
        // return success
        callback("success");
      }
    }
  });
  
  // player data fetch
  socket.on('player data', function(input, callback) {
    if (socket.auth) {
      let playerPacket = {
        "Best": highScores[socket.discord],
        "Attempts": levelAttempts[socket.discord]
      };
      callback(JSON.stringify(playerPacket));
    }
  });
  
  // individual player data fetch
  socket.on('player fetch', function(input, callback) {
    if (socket.auth) {
      if (displayNames[input] !== undefined) {
        let playerPacket = {
          "Best": highScores[displayNames[input]],
          "Attempts": levelAttempts[displayNames[input]]
        };
        callback(JSON.stringify(playerPacket));
      }
    }
  });
  
  // fetch amount of global attempts
  socket.on('global attempts', function(input, callback) {
    callback(global.attempts);
  });
  
  // commands from console
  socket.on('console input', function(input, callback) {
    if (input == "data") {
      io.emit('console log', JSON.stringify(leaderboard));
      io.emit('console log', JSON.stringify(highScores));
    }
    if (input == "sync") {
      io.emit('console log', "syncing...");
      syncData();
    }
  });
  
});
  
http.listen(port, function() {
  console.log('listening on *:' + port);
});
