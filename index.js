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

var levelWeights = {
  "Hot Springs": 1,
  "Volcanic Ashes": 1,
  "Soul Creek": 4,
  "Doom Mountain": 4
};

// initialize variables
var leaderboard = {};
var discordTags = {};
var displayNames = {};
var highScores = {};
var levelAttempts = {};
var global = {};
var verification = {};
var world = {};
var replays = {};

// function: check a level
var levelCheck = function (levelName) {
  let deniedLevels = {
    "discordTags": 1,
    "displayNames": 1,
    "highScores": 1,
    "levelAttempts": 1,
    "global": 1,
    "world": 1,
    "verification": 1
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
    if (leaderboardName !== "Global" && leaderboardName !== "global") {
      newHighScore(Player.name, Player.score, leaderboardName);
    }
    return true;
    
  } else {

    // otherwise, check if provided score is greater than or equal to the player's leaderboard score
    if (parseInt(score) > leaderboard[leaderboardName][playerName].score) {
    
      // update score and time if so
      leaderboard[leaderboardName][playerName] = Player;
      if (leaderboardName !== "Global" && leaderboardName !== "global") {
        newHighScore(Player.name, Player.score, leaderboardName);
      }
      return true;

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
      store[x].verification = 0;
      if (verification[store[x].discord]) {
        store[x].verification = 1;
      }
      if (parseInt(store[x].score) !== 0) {
        output.push(JSON.stringify(store[x]));
      }
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
          let coinAmount = 0;
          let totalTime = 0;
          if (leaderboard["global"][player] !== undefined) {
            currentScore = parseInt(leaderboard["global"][player].score);
            currentScore += parseInt(leaderboard[key][player].score);
            coinAmount = parseInt(leaderboard["global"][player].coins);
            coinAmount += parseInt(leaderboard[key][player].coins);
            totalTime = parseFloat(leaderboard["global"][player].time);
            totalTime += parseFloat(leaderboard[key][player].time);
          } else {
            currentScore = parseInt(leaderboard[key][player].score);
            coinAmount = parseInt(leaderboard[key][player].coins);
            totalTime = parseFloat(leaderboard[key][player].time);
          }    
          setScore("global", playerOBJ.name, currentScore, coinAmount, totalTime, playerOBJ.discord);
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
    if (leaderboard.world !== undefined && leaderboard.world !== []) {
      world = leaderboard.world;
    }
    if (leaderboard.verification !== undefined && leaderboard.verification !== []) {
      verification = leaderboard.verification;
    }   
  });  
})

req.write(initPacket);
req.end();

// load replay data
const optionsReplay = {
  hostname: 'botpixelgames.000webhostapp.com',
  path: '/database/events/fetchReplays.php',
  port: 443,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': initPacket.length
    }
};

var responseReplay = "";
const req2 = https.request(optionsReplay, res => {
  responseReplay = "";

  res.on('data', d => {
    process.stdout.write(d);
    console.log(d);
    responseReplay += d;
  })
  
  res.on('end', function () {
    replays = JSON.parse(responseReplay);
  });  
})

req2.write(initPacket);
req2.end();

// function: announce player scores
var lastPlayer = undefined;
var scoreAnnounce = function (player) {
  if (lastPlayer == player) {
    return false;
  }
  lastPlayer = player;
  
  globalScores();
  let output = JSON.parse(globalScores());
  let rank = "Unranked";
  for (var i = 0; i < output.length; i++) {
    if (JSON.parse(output[i]).name == player) {
      rank = i + 1;
    }
  }
  if (leaderboard.global[player] !== undefined) {
  let embed = [{
      "title": ("Nice job, " + player + "!"),
      "description": ("<:TiltedRocket:637829833312960512> **" + player + "** currently has a total score of **" + leaderboard.global[player].score + 
                     "**, ranking **#" + rank + "** on the global leaderboard!"),
      "url": "https://www.hyperpad.com/projects/6u3jezje",
      "color": "5814783",
      "fields": [
      ],
      "author": {
        "name": "Join the event and take your chances on free prizes!"
      }
    }
  ];
  
  let packet = JSON.stringify({
    'placeholder': ("<:TiltedRocket:637829833312960512> **" + player + "** currently has a total score of **" + leaderboard.global[player].score + 
                     ", ranking **#" + rank + "** on the global leaderboard!"),
    'embeds': embed
  });
  
  let options = {
    hostname: 'discord.com',
    path: '/api/webhooks/805080253206233099/v13Qj84Ftye-V09AFrtwlB6fyAZ2tIHwwwIpheoim4fFDEgqyStEB_Cmwfd-IyRuuDwf',
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
}

// function: announce verification
var verificationAnnounce = function (player) {
  let embed = [{
      "title": "New Contestant Verified!",
      "description": ("<:TiltedRocket:637829833312960512> **" + player + "** has been verified!"),
      "url": "https://www.hyperpad.com/projects/6u3jezje",
      "color": "10574079",
      "fields": [
      ],
      "author": {
        "name": "Join the event and take your chances on free prizes!"
      }
    }
  ];
  
  let packet = JSON.stringify({
    'placeholder': ("<:TiltedRocket:637829833312960512> **" + player + "** has been verified!"),
    'embeds': embed
  });
  
  let options = {
    hostname: 'discord.com',
    path: '/api/webhooks/805080253206233099/v13Qj84Ftye-V09AFrtwlB6fyAZ2tIHwwwIpheoim4fFDEgqyStEB_Cmwfd-IyRuuDwf',
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

// function: announce global attempts
var attemptsAnnounce = function (count) {
  let embed = [{
      "title": "New Global Milestone!",
      "description": ("<:TiltedRocket:637829833312960512> We have reached **" + count + "** global runs count!"),
      "url": "https://www.hyperpad.com/projects/6u3jezje",
      "color": "16756568",
      "fields": [
      ],
      "author": {
        "name": ("Next milestone: " + parseInt(count + 50))
      }
    }
  ];
  
  let packet = JSON.stringify({
    "placeholder": ("<:TiltedRocket:637829833312960512> We have reached **" + count + "** global runs count!"),
    'embeds': embed
  });
  
  let options = {
    hostname: 'discord.com',
    path: '/api/webhooks/805080253206233099/v13Qj84Ftye-V09AFrtwlB6fyAZ2tIHwwwIpheoim4fFDEgqyStEB_Cmwfd-IyRuuDwf',
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

// function: announce new high score
var newHighScore = function (player, score, level) {
  if (score == 0) {
    return false;
  }
  globalScores();
  let embed = [{
      "title": "New High Score!",
      "description": ("<:TiltedRocket:637829833312960512> **" + player + "** got a new personal high score of **" + score + "** on " + level + "!"),
      "url": "https://www.hyperpad.com/projects/6u3jezje",
      "color": "16726586",
      "fields": [
      ],
      "author": {
        "name": (player + " now has a total score of " + leaderboard.global[player].score + ".")
      }
    }
  ];
  
  let packet = JSON.stringify({
    'placeholder': ("<:TiltedRocket:637829833312960512> **" + player + "** got a new personal high score of **" + score + "** on " + level + "!"),
    'embeds': embed
  });
  
  let options = {
    hostname: 'discord.com',
    path: '/api/webhooks/805080253206233099/v13Qj84Ftye-V09AFrtwlB6fyAZ2tIHwwwIpheoim4fFDEgqyStEB_Cmwfd-IyRuuDwf',
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

// function: sync to database handler
var syncData = function() {
  
  io.emit('console log', "sync started.");
  io.emit('console log', leaderboard);

  let packet = querystring.stringify({
    'pw': "8043EBACC7CAE08DC1A09B2B5DF472B2D44A06EEE3AEA12B0E6FB66CB7839788",
    'data': JSON.stringify(leaderboard),
    'replays': JSON.stringify(replays)
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

// leaderboard score updates
var updateLeaderboard = function () {
  io.emit("console log","scanning...");
  let targets = ["Volcanic Ashes","Hot Springs","Soul Creek"];
  let changes = 0;
  let iterations = 0;
  for (var i = 0; i < targets.length; i++) {
    let lead = leaderboard[targets[i]];
    Object.keys(lead).forEach(function(key) {
      iterations++;
      let discord = displayNames[key];
      if (replays[discord] !== undefined) {
        let replayData = replays[discord][targets[i]];
        if (replayData !== undefined) {
          leaderboard[targets[i]][key].time = replayData.length * (1 / 30);
          leaderboard[targets[i]][key].score = replayData.length * 4000 * levelWeights[targets[i]];
          changes++;
        }
      }
    });
  }
  io.emit("console log", changes + " changes were made.");
  io.emit("console log", iterations + " iterations.");
};

// backup every 15 minutes
var backups = setInterval(() => {
  leaderboard.discordTags = discordTags;
  leaderboard.displayNames = displayNames;
  leaderboard.highScores = highScores;
  leaderboard.levelAttempts = levelAttempts;
  leaderboard.world = world;
  leaderboard.verification = verification;
  syncData();
},
  1000 * 15 * 60
)


// socket connection handler
io.on('connection', function(socket) {
  socket.main = false;
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
    
    if (data !== {} && displayNames[data.name] == data.discord && data.hasOwnProperty("name") && data.hasOwnProperty("discord")) {
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
    let output = JSON.parse(sortLeaderboard(input));
    let rank = "--";
    for (var i = 0; i < output.length; i++) {
      if (JSON.parse(output[i]).name == socket.name) {
        rank = i + 1;
      }
    }
    callback(output, rank);
  });
  
  // global leaderboard fetch
  socket.on('global leaderboard', function(input, callback) {
    let output = JSON.parse(globalScores());
    let rank = "--";
    for (var i = 0; i < output.length; i++) {
      if (JSON.parse(output[i]).name == socket.name) {
        rank = i + 1;
      }
    }
    callback(output, rank);
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
        if (world.runs == undefined) {
          world.runs = 1;
        } else {
          world.runs += 1;
        }
        io.emit("attempt", world.runs);
        
        // set score & high score
        let scoring = 0;
        let timing = 0;
        if (data.replay !== undefined) {
          let replayData = data.replay.split("*");
          scoring = replayData.length * 4000 * parseFloat(levelWeights[data.level]);
          timing = replayData.length * 1 / 30;
        } else {
          callback("error");
        }
        setScore(data.level, socket.name, scoring, data.coins, timing, socket.discord);
        if (highScores[socket.discord] == undefined) {
          highScores[socket.discord] = {};
        }
        if (highScores[socket.discord][data.level] == undefined) {
          highScores[socket.discord][data.level] = parseInt(data.score);
        } else {
          if (highScores[socket.discord][data.level] < data.score) {
            highScores[socket.discord][data.level] = parseInt(data.score);
            if (data.replay !== undefined) {
              if (replays[socket.discord] == undefined) {
                replays[socket.discord] = {};
              }
              replays[socket.discord][data.level] = data.replay;
            }
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
        if (world.runs % 50 == 0) {
          attemptsAnnounce(world.runs);
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
          "Best": JSON.stringify(highScores[displayNames[input]]),
          "Attempts": JSON.stringify(levelAttempts[displayNames[input]])
        };
        callback(JSON.stringify(playerPacket));
      }
    }
  });
  
  // individual player replays fetch
  socket.on('player replays', function(input, callback) {
    let success = false;
    if (displayNames[input] !== undefined) {
      let discord = displayNames[input];
      if (replays[discord] !== undefined) {
        success = true;
        callback(replays[discord]);
      }
    }
    if (success == false) {
      callback("error");
    }
  });

  // notify server that player is in main menu
  socket.on('main menu', function(input, callback) {
    socket.main = true;
  });
  
  // fetch amount of global attempts
  socket.on('global attempts', function(input, callback) {
    callback(world.runs);
  });
  
  // fetch unix timestamp
  socket.on('timestamp', function(input, callback) {
    callback(Date.now() / 1000);
  });
  
  // fetch unix timestamp
  socket.on('local', function(input, callback) {
    let delta = Math.max((Date.now / 1000) - input);
    if (delta > 10) {
      socket.disconnect();
    }
  });
  
  // handle disconnection
  socket.on('disconnect', function(reason) {
    if (socket.auth && socket.main) {
      scoreAnnounce(socket.name);
    }
  });
  
  // commands from console
  socket.on('console input', function(input, callback) {
    if (input == "data") { // view data
      io.emit('console log', JSON.stringify(leaderboard));
      io.emit('console log', JSON.stringify(highScores));
    }
    if (input == "sync") { // backup
      io.emit('console log', "syncing...");
      syncData();
    }
    if (input.startsWith("verify")) {
      let discord = input.substring(7);
      if (discordTags[discord] !== undefined) {
        verification[discord] = true;
        io.emit('console log', "successfully verified discord user.");
        verificationAnnounce(discordTags[discord]);
      }
    }
    if (input == "discord") {
      io.emit('console log', "Unverified users:");
      let output = "";
      Object.keys(discordTags).forEach(function(key) {
        if (verification[key] == undefined) {
          output += key;
          output += "\n";
        }
      });
      io.emit('console log', output);
    }
    if (input == "replays") {
      io.emit('console log', JSON.stringify(replays));
    }
    let command = input.split(" ");
    if (command[0] == "setscore") {
      leaderboard[command[2].replace("_"," ")][command[1]].score = parseInt(command[3]);
      highScores[displayNames[command[1]]][command[2].replace("_"," ")] = parseInt(command[3]);
    }
    if (command[0] == "settime") {
      leaderboard[command[2].replace("_"," ")][command[1]].time = parseFloat(command[3]);
    }
    if (input == "updateLeaderboard") {
      updateLeaderboard();
    }
  });
});

// end
  
http.listen(port, function() {
  console.log('listening on *:' + port);
});
