var express = require('express'); // Express contains some boilerplate to for routing and such
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http); // Here's where we include socket.io as a node module 

// Serve the index page 
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/index.html'); 
});
debugger
// Serve the assets directory
app.use('/assets',express.static('assets'))

// Listen on port 5000
app.set('port', (process.env.PORT || 5000));
http.listen(app.get('port'), function(){
  console.log('listening on port',app.get('port'));
});

var players = {}; //Keeps a table of all players, the key is the socket id
var bullet_array = []; // Keeps track of all the bullets to update them on the server 
// Tell Socket.io to start accepting connections
io.on('connection', function(socket){
	// Listen for a new player trying to connect
	socket.on('new-player',function(state){
    console.log("new playeeeer");
		console.log("New player joined with state:",state);
		players[socket.id] = state;
		// Broadcast a signal to everyone containing the updated players list
		io.emit('update-players',players);
	})
  
  // Listen for a disconnection and update our player table 
  socket.on('disconnect',function(state){
    delete players[socket.id];
    io.emit('update-players',players);
  }) 
  
  // Listen for move events and tell all other clients that something has moved 
  socket.on('move-player',function(position_data){
    if(players[socket.id] == undefined) return; // Happens if the server restarts and a client is still connected 
    players[socket.id].x = position_data.x;  
    players[socket.id].y = position_data.y; 
    players[socket.id].angle = position_data.angle; 
    io.emit('update-players',players);
  })
  
  // Listen for shoot-bullet events and add it to our bullet array
  socket.on('shoot-bullet',function(data){
    if(players[socket.id] == undefined) return;
    var new_bullet = data;
    data.owner_id = socket.id; // Attach id of the player to the bullet 
    if(Math.abs(data.speed_x) > 20 || Math.abs(data.speed_y) > 20){
      console.log("Player",socket.id,"is cheating!");
    }
    bullet_array.push(new_bullet);
  });
})
