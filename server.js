// server.js

// set up ========================
var express  = require('express');
var app      = express(); 								// create our app w/ express
var mongoose = require('mongoose'); 					// mongoose for mongodb
var http     = require('http');
var server   = http.createServer(app);
var io       = require('socket.io').listen(server);


// configuration =================

mongoose.connect('mongodb://localhost/follow-along'); 	// connect to mongoDB database on localhost

app.configure(function() {
	app.use(express.static(__dirname + '/public')); 		// set the static files location /public/img will be /img for users
	app.use(express.logger('dev')); 						// log every request to the console
	app.use(express.bodyParser()); 							// pull information from html in POST
	app.use(express.methodOverride()); 						// simulate DELETE and PUT
});

// define model =================
var State = mongoose.model('State', {
	room: String,
	json: String
});

function saveState(room, data, callback) {
	State.update(
		{room: room},
		{room: room, json: JSON.stringify(data)},
		{upsert: true},
		callback || function() { }
	);
}

function getState(room, callback) {
	State.findOne(
		{room: room},
		{json: 1},
		function(err, document) {
			if (err == null && document && document.json) {
				callback(null, JSON.parse(document.json));
			} else {
				callback(err, null);
			}
		}
	);
}

// application -------------------------------------------------------------
app.get('*', function(req, res) {
	res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});

// listen (start app with node server.js) ======================================

server.listen(8000);
console.log("Server listening on port 8000");

io.sockets.on('connection', function (socket) {
	socket.on('subscribe', function(data) {
		socket.join(data.room);
		io.sockets.in(data.room).emit('room-count-update', io.sockets.clients(data.room).length);
		
		if (data.role == 'follower') {
			getState(data.room, function(err, state) {
				if (err == null) {
					socket.json.emit('state-update', state);
				}
			});
		}
	});
	
	socket.on('unsubscribe', function(data) {
		socket.leave(data.room);
		io.sockets.in(data.room).emit('room-count-update', io.sockets.clients(data.room).length);
	});
	
	socket.on('state-update', function(data) {
		if (data.role == 'leader') {
			saveState(data.room, data);
			socket.broadcast.json.to(data.room).emit('state-update', data);
		}
	});
	
	socket.on('restore-session', function(data) {
		getState(data.room, function(err, state) {
			if (err == null) {
				socket.emit('restore-session', state);
			}
		});
	});
});