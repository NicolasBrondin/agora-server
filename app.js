var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var cors = require('cors');



var rooms = [
    {name:"World", level: 0},
    {name:"France", level:1, position: {lat:47.052705, long: 2.766922, radius: 300000 } },  
    {name:"Marçay", level:2, position: {lat:46.470203, long: 0.226018, radius: 4000 } },
    {name:"Limoges", level:2, position: {lat:45.854794, long: 1.247002, radius: 6000 } } //, 
];


  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }


function calculate_distance(long1,lat1,long2 , lat2) {
    var R = 6371; // Radius of the earth in km
  var dLat = (lat2-lat1).toRad();  // Javascript functions in radians
  var dLon = (long2-long1).toRad(); 
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * 
          Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c * 1000; // Distance in m
  return d;
} // CalculateDistance

app.use(cors())

app.get('/rooms/lat/:lat/long/:long', function(req, res){
    var available = rooms.filter(function(room){
        if(room.position) {
        console.log(room.name, room.position.lat, req.params.lat, room.position.long, req.params.long);
        console.log(calculate_distance(room.position.lat, room.position.long,  parseFloat(req.params.lat),  parseFloat(req.params.long)));
        }
        return room.level == 0 || calculate_distance(room.position.lat, room.position.long, parseFloat(req.params.lat), parseFloat(req.params.long)) < room.position.radius;
    });
    res.json(200, {rooms:available});
});

io.on('connection', function(socket){
    
  var defaultRoom = 'general';
  var rooms = ["General", "angular", "socket.io", "express", "node", "mongo", "PHP", "laravel"];

  //Emit the rooms array
  socket.emit('setup', {
    rooms: rooms
  });
    
  //Listens for new user
  socket.on('setup', function(data) {
    socket.join(data.room);
    io.in(data.room).emit('user joined', data);
  });
    
  socket.on('chat message', function(data){
      io.in(data.room).emit('chat message', data);
  });

});

http.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});

/*
  //Listens for switch room
  socket.on('switch room', function(data) {
    //Handles joining and leaving rooms
    //console.log(data);
    socket.leave(data.oldRoom);
    socket.join(data.newRoom);
    io.in(data.oldRoom).emit('user left', data);
    io.in(data.newRoom).emit('user joined', data);

  });
*/

