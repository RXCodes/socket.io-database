// setup environment
var behavior = require('./behaviors');
var functions = require('./functions');
var SocketCount = {"Current": 0, "All-time": 0};
var output = {};

// initialize functions
exports.end = function(input) {
  let local = {};
  output.Get_Sockets_in_Room2 = behavior.Get_Sockets_in_Room(input);
  output.Foreach_Array1.Index = -1;
  output.Foreach_Array1.Array = output["Get_Sockets_in_Room2"].Sockets; 
  for (output.Foreach_Array1.Value of output.Foreach_Array1.Array) {
  output.Foreach_Array1.Index++;
    output.Remove_Tag = behavior.Remove_Tag(io.sockets[output["Foreach_Array1"].Value],"Crewmate");
    output.Remove_Tag1 = behavior.Remove_Tag(io.sockets[output["Foreach_Array1"].Value],"Impostor");
    output.Remove_Tag4 = behavior.Remove_Tag(io.sockets[output["Foreach_Array1"].Value],"Alive");
  }
};

exports.Leave = function(input) {
  let local = {};
  output.Get_Socket_Variable4 = behavior.Get_Socket_Variable(output["Disconnect"].Parameter,"Room","0");
  output.If9 = behavior.If(output["Get_Socket_Variable4"].Value,"is not equal",0);
  output.To_Dictionary4 = behavior.To_Dictionary(behavior.Get_Variable_Value("Rooms","Global",null).Value);
  output.Get_Dictionary_Value2 = behavior.Get_Dictionary_Value(output["To_Dictionary4"].Result,output["Get_Socket_Variable4"].Value,error);
  output.If10 = behavior.If(output["Get_Dictionary_Value2"].Value,"is not equal",error);
  output.To_Dictionary5 = behavior.To_Dictionary(output["Get_Dictionary_Value2"].Value);
  output.Get_Dictionary_Value3 = behavior.Get_Dictionary_Value(output["To_Dictionary5"].Result,Players,1);
  output.To_Number1 = behavior.To_Number(output["Get_Dictionary_Value3"].Value);
  output.Subtract_Values = behavior.Subtract_Values(output["To_Number1"].Result,1);
  output.If12 = behavior.If(output["Subtract_Values"].Difference,"greater than",1);
  output.Modify_Dictionary7 = behavior.Modify_Dictionary(output["To_Dictionary5"].Result,"Set Key",Players,output["Subtract_Values"].Difference);
  output.Modify_Dictionary8 = behavior.Modify_Dictionary(output["To_Dictionary4"].Result,"Set Key",output["Get_Socket_Variable4"].Value,output["Modify_Dictionary7"].Result);
  output.Set_Variable3 = behavior.Set_Variable("Rooms","Global",output["Modify_Dictionary8"].Result);
  output.If13 = behavior.If(output["Subtract_Values"].Difference,"is equal to",0);
  output.Modify_Dictionary10 = behavior.Modify_Dictionary(output["To_Dictionary4"].Result,"Delete Key",output["Get_Socket_Variable4"].Value,foo);
  output.Set_Variable5 = behavior.Set_Variable("Rooms","Global",output["Modify_Dictionary10"].Result);
  output.Check_for_Tag = behavior.Check_for_Tag(output["Disconnect"].Parameter,"Owner");
  output.If15 = behavior.If(output["Check_for_Tag"].Condition,"is equal to",true);
  output.Get_Sockets_in_Room = behavior.Get_Sockets_in_Room(output["Get_Socket_Variable4"].Success);
  output.Get_Array_Value = behavior.Get_Array_Value(output["Get_Sockets_in_Room"].Sockets,"Get Random Value",None,0);
  output.If16 = behavior.If(output["Get_Array_Value"].Result,"is not equal",None);
  output.Emit_Event1 = behavior.Emit_Event("owner","owner","Target Client",output["Get_Array_Value"].Result);
  output.Add_Tag1 = behavior.Add_Tag(output["Get_Array_Value"].Result,"Owner");
  output.Check_for_Tag2 = behavior.Check_for_Tag(output["Disconnect"].Parameter,"Impostor");
  output.If21 = behavior.If(output["Check_for_Tag2"].Condition,"is equal to",true);
  output.Execute_Function3 = behavior.Execute_Function(,output["Get_Socket_Variable4"].Value);
  output.Emit_Event_in_Room2 = behavior.Emit_Event_in_Room("end","Impostor left the game.",output["Get_Socket_Variable4"].Value,"All Clients");
  output.Emit_Event_in_Room4 = behavior.Emit_Event_in_Room("leave",output["Disconnect"].Parameter,output["Get_Socket_Variable4"].Value,"All Clients");
  output.Remove_All_Tags = behavior.Remove_All_Tags(io.sockets[output["Disconnect"].Parameter]);
};

exports.Destroy Room = function(input) {
  let local = {};
  output.Get_Socket_Variable2 = behavior.Get_Socket_Variable(output["Delete_Room"].Parameter,"Created","0");
  output.If3 = behavior.If(output["Get_Socket_Variable2"].Value,"is equal to",1);
  output.To_Dictionary = behavior.To_Dictionary(Parse JSON - Parsed JSON);
  output.Modify_Dictionary5 = behavior.Modify_Dictionary(output["To_Dictionary"].Result,"Delete Key",output["Delete_Room"].Parameter,foo);
  output.Set_Variable = behavior.Set_Variable("Rooms","Global",output["Modify_Dictionary5"].Result);
};

// resistor overflow functions
exports.resistor = function(intent) {
}