var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var cors = require('cors');

var rooms = require('./data/geo.json');

Number.prototype.toRad = function() {
    return this * Math.PI / 180;
}


function calculate_distance(long1,lat1,long2 , lat2) {
    var R = 6371; // Radius of the earth in km
    var dLat = (lat2-lat1).toRad();  // Javascript functions in radians
    var dLon = (long2-long1).toRad(); 
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c * 1000; // Distance in m
    return d;
} // CalculateDistance

function find_room(code){
    return rooms.find(function(room){ return room.code === code;});
};

function pop_client_room(socket){
    var r = rooms.find(function(room){ return room.users.indexOf(socket) != -1 ? true : false});
    console.log(r);
    r.users.splice(r.users.indexOf(socket),1);
    return r;
    
};

app.use(cors());

app.get('/rooms/lat/:lat/long/:long', function(req, res){
    var available = rooms.filter(function(room){
        if(room.position) {
        console.log(room.display_name, room.position.lat, req.params.lat, room.position.long, req.params.long);
        console.log(calculate_distance(room.position.lat, room.position.long,  parseFloat(req.params.lat),  parseFloat(req.params.long)));
        }
        return room.level == 0 || calculate_distance(room.position.lat, room.position.long, parseFloat(req.params.lat), parseFloat(req.params.long)) < room.position.radius;
    });
    res.json(200, {rooms:available});
});

io.on('connection', function(socket){

    //Emit the rooms array
    socket.emit('setup');

    //Listens for new user
    socket.on('setup', function(data) {
        var r = find_room(data.room);
        socket.join(data.room);
        r.users.push(socket);
        socket.emit('room update', {users: r.users.length});
        socket.broadcast.to(data.room).emit('user joined', data);
    });

    socket.on('chat message', function(data){
        var r = find_room(data.room);
        r.messages.push(data);
        socket.broadcast.to(data.room).emit('chat message', data);
    });
    
    socket.on('disconnect', function(data){
        var r = pop_client_room(socket);
        
        io.in(r.code).emit('user left', {});
    });

});

var port = process.env.PORT || 3000;

http.listen(port, function(){
    console.log('listening on port: '+ port);
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

