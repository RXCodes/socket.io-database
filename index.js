// prepare and launch socket.io server
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
var behavior = require('./behaviors');
var functions = require('./functions');
var output = {};
var SocketCount = {"Current": 0, "All-time": 0};

// initialize variables for behaviors
var Foreach_Array = {};
var Foreach_Array1 = {};
// initialize predefined global variables
output.Rooms = behavior.Set_Variable("Rooms","Global",{});


io.on('connection', function(socket) {
  SocketCount.Current++; SocketCount["All-Time"]++;
  let local = {};
  io.emit("console log",Someone joined!);
  socket.emit(id,socket.id);
  
  socket.on('id', function(input, callback) {
    let local = {};
    socket.emit(id,socket.id);
  });
  
  socket.on('kill', function(input, callback) {
    let local = {};
    output.Check_for_Tag3 = behavior.Check_for_Tag(io.sockets[socket.id],"Impostor");
    if (output["Check_for_Tag3"].Condition == true) {
      output.Remove_Tag2 = behavior.Remove_Tag(io.sockets[output["On_Kill"].Data],"Crewmate");
      output.Remove_Tag3 = behavior.Remove_Tag(io.sockets[output["On_Kill"].Data],"Alive");
      output.Get_Socket_Variable9 = behavior.Get_Socket_Variable(io.sockets[output["On_Kill"].Socket_ID],"Room","1");
      io.in(output["Get_Socket_Variable9"].Value).emit(kill,output["On_Kill"].Data);
    }
  });
  
  socket.on('event', function(input, callback) {
    let local = {};
    output.Get_Socket_Variable8 = behavior.Get_Socket_Variable(io.sockets[output["On_Event"].Socket_ID],"Room","0");
    output.If20 = behavior.If(output["Get_Socket_Variable8"].Value,"is not equal",0);
    output.Emit_Event_in_Room1 = behavior.Emit_Event_in_Room("event",output["On_Event"].Data,output["Get_Socket_Variable8"].Value,"All Clients");
  });
  
  socket.on('start', function(input, callback) {
    let local = {};
    output.Check_for_Tag1 = behavior.Check_for_Tag(io.sockets[output["Start_Game"].Socket_ID],"Owner");
    output.If17 = behavior.If(output["Check_for_Tag1"].Condition,"is equal to",true);
    output.Get_Socket_Variable7 = behavior.Get_Socket_Variable(output["Start_Game"].Socket_ID,"Room","0");
    output.Emit_Event_in_Room = behavior.Emit_Event_in_Room("start","now",output["Get_Socket_Variable7"].Value,"All Clients");
    Get_Sockets_in_Room1 = {"Sockets": Object.keys(io.nsps["/"].adapter.rooms[output["Get_Socket_Variable7"].Value])};
    output.Sort_Array = behavior.Sort_Array(output["Get_Sockets_in_Room1"].Sockets,"Shuffle","Ascending");
    output.Foreach_Array.Index = -1;
    output.Foreach_Array.Array = output["Sort_Array"].Sorted_Array; 
    for (output.Foreach_Array.Value of output.Foreach_Array.Array) {
    output.Foreach_Array.Index++;
      output.If18 = behavior.If(output["Foreach_Array"].Index,"is equal to",0);
      output.Emit_Event3 = behavior.Emit_Event("role","Impostor","Target Client",output["Foreach_Array"].Index);
      output.Add_Tag2 = behavior.Add_Tag(io.sockets[output["Foreach_Array"].Index],"Impostor");
      output.If19 = behavior.If(output["Foreach_Array"].Index,"greater than",0);
      output.Emit_Event4 = behavior.Emit_Event("role","Crewmate","All Clients","Socket ID");
      output.Add_Tag3 = behavior.Add_Tag(output["Foreach_Array"].Index,"Crewmate");
      output.Add_Tag4 = behavior.Add_Tag(output["Foreach_Array"].Value,"Alive");
    }
  });
  
  socket.on('chat', function(input, callback) {
    let local = {};
    output.Get_Socket_Variable5 = behavior.Get_Socket_Variable(output["Leave_Room"].Socket_ID,"Room","0");
    output.If14 = behavior.If(output["Get_Socket_Variable5"].Value,"is not equal",0);
    socket.leave(output["Leave_Room"].Data);
    try {Execute_Function = functions.Leave(output["Leave_Room"].Socket_ID)} catch(e) {}
  });
  
  socket.on('join', function(input, callback) {
    let local = {};
    output.To_Dictionary2 = behavior.To_Dictionary(behavior.Get_Variable_Value("Rooms","Global",null).Value);
    output.Check_for_Key = behavior.Check_for_Key(output["To_Dictionary2"].Result,output["Request_Join_Room"].Data);
    output.If5 = behavior.If(output["Check_for_Key"].Check,"is equal to",true);
    output.Get_Dictionary_Value = behavior.Get_Dictionary_Value(output["To_Dictionary2"].Result,output["Request_Join_Room"].Data,foo);
    output.To_Dictionary3 = behavior.To_Dictionary(output["Get_Dictionary_Value"].Value);
    output.Get_Dictionary_Value1 = behavior.Get_Dictionary_Value(output["To_Dictionary3"].Result,Players,1);
    output.If6 = behavior.If(output["Get_Dictionary_Value1"].Value,"less than",8);
    socket.join(output["Request_Join_Room"].Data);
    output.To_Number = behavior.To_Number(output["Get_Dictionary_Value1"].Value);
    output.Add_Values = behavior.Add_Values(output["To_Number"].Result,1);
    output.Modify_Dictionary6 = behavior.Modify_Dictionary(output["To_Dictionary3"].Result,"Set Key",Players,output["Add_Values"].Sum);
    output.Set_Variable2 = behavior.Set_Variable("Rooms","Global",output["Modify_Dictionary6"].Result);
    output.Set_Socket_Variable2 = behavior.Set_Socket_Variable(io.sockets[output["Request_Join_Room"].Socket_ID],"Room",output["Request_Join_Room"].Data);
    callback(success);
    output.If7 = behavior.If(output["Get_Dictionary_Value1"].Value,"greater than and equal to",8);
    callback(The room is full.);
    output.If8 = behavior.If(output["Check_for_Key"].Check,"is equal to",false);
    callback(Room does not exist.);
  });
  
  socket.on('create', function(input, callback) {
    let local = {};
    output.Get_Socket_Variable = behavior.Get_Socket_Variable(output["Create_Room"].Socket_ID,"Created","0");
    output.If = behavior.If(output["Get_Socket_Variable"].Value,"is equal to",0);
    output.Set_Socket_Variable = behavior.Set_Socket_Variable(output["Create_Room"].Socket_ID,"Created","1");
    // console log room details
    output.Concatenate = behavior.Concatenate(output["Create_Room"].Socket_ID,"True","Created a room:");
    output.Concatenate1 = behavior.Concatenate(output["Concatenate"].Result,"True",output["Create_Room"].Data);
    io.emit("console log",output["Concatenate1"].Result);
    output.Comment3 = behavior.Comment("create room");
    output.Modify_Dictionary = behavior.Modify_Dictionary({},"Set Key",ID,output["Create_Room"].Socket_ID);
    output.Get_Time = behavior.Get_Time();
    output.Modify_Dictionary1 = behavior.Modify_Dictionary(output["Modify_Dictionary"].Result,"Set Key",Start,output["Get_Time"].Timestamp);
    output.Get_Socket_Variable3 = behavior.Get_Socket_Variable(output["Create_Room"].Socket_ID,"Name","Unnamed");
    output.Modify_Dictionary2 = behavior.Modify_Dictionary(output["Modify_Dictionary1"].Result,"Set Key",Name,output["Get_Socket_Variable3"].Value);
    output.Modify_Dictionary3 = behavior.Modify_Dictionary(output["Modify_Dictionary2"].Result,"Set Key",Players,1);
    output.To_Dictionary1 = behavior.To_Dictionary(behavior.Get_Variable_Value("Rooms","Global",null).Value);
    output.Modify_Dictionary4 = behavior.Modify_Dictionary(output["To_Dictionary1"].Result,"Set Key",output["Create_Room"].Socket_ID,output["Modify_Dictionary3"].Result);
    output.Set_Variable1 = behavior.Set_Variable("Rooms","Global",output["Modify_Dictionary4"].Result);
    output.Comment4 = behavior.Comment("join room");
    output.Join_Room = behavior.Join_Room("Self",output["Create_Room"].Socket_ID,"Socket ID");
    output.Set_Socket_Variable4 = behavior.Set_Socket_Variable(output["Create_Room"].Socket_ID,"Room",output["Create_Room"].Socket_ID);
    output.Add_Tag = behavior.Add_Tag(output["Create_Room"].Socket_ID,"Owner");
    output.Callback = behavior.Callback(success);
    output.If1 = behavior.If(output["Get_Socket_Variable"].Value,"is not equal",0);
    output.Callback1 = behavior.Callback(error);
  });
  
  socket.on('fetch', function(input, callback) {
    let local = {};
    output.Emit_Event = behavior.Emit_Event("rooms",behavior.Get_Variable_Value("Rooms","Global",null).Value,"Self","Socket ID");
  });
  
  socket.on('disconnect', function(reason) {
    SocketCount.Current--;
    let local = {};
    output.Execute_Function1 = behavior.Execute_Function(,socket.id);
    io.emit("console log",Someone Left!);
    output.Execute_Function2 = behavior.Execute_Function(,socket.id);
  });
  
  socket.on('console input', function(input) {
    let local = {};
    output.If4 = behavior.If(input,"is equal to",fetch);
    io.emit("console log",behavior.Get_Value_Variable("Rooms","Global",null).Value);
  });
});

http.listen(port, function() {
  console.log('listening on *:' + port);
});