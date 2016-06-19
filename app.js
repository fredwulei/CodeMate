// var http = require("http")
    // socketio = require("socket.io"),
    // fs = require("fs");


var express = require('express');
var app     = express();
var server  = app.listen(3457);
var io      = require('socket.io').listen(server);


var spawn = require("child_process").spawn;
var process;

var fs = require('fs');


var anonymous = ['alligator', 'anteater', 'armadillo', 'auroch', 'axolotl', 'badger', 'bat', 'beaver', 'buffalo',
 'camel', 'chameleon', 'cheetah', 'chipmunk', 'chinchilla', 'chupacabra', 'cormorant', 'coyote', 'crow', 'dingo', 
 'dinosaur', 'dolphin', 'duck', 'elephant', 'ferret', 'fox', 'frog', 'giraffe', 'gopher', 'grizzly', 'hedgehog', 
 'hippo', 'hyena', 'jackal', 'ibex', 'ifrit', 'iguana', 'koala', 'kraken', 'lemur', 'leopard', 'liger', 'llama', 
 'manatee', 'mink', 'monkey', 'narwhal', 'nyan cat', 'orangutan', 'otter', 'panda', 'penguin', 'platypus', 'python', 
 'pumpkin', 'quagga', 'rabbit', 'raccoon', 'rhino', 'sheep', 'shrew', 'skunk', 'slow loris', 'squirrel', 'turtle', 
 'walrus', 'wolf', 'wolverine', 'wombat'];


function getAnonymousName(socketid){
  var sum = 0;
  for (var i = 0, len = socketid.length; i < len; i++) {
    sum += socketid[i].charCodeAt(0);
  }
  return anonymous[sum % anonymous.length];
}

// fs.writeFile("/tmp/test", "Hey there!", function(err) {
//     if(err) {
//         return console.log(err);
//     }

//     console.log("The file was saved!");
// }); 


app.use(express.static(__dirname + '/static'));
app.use(express.static(__dirname + '/user'));

console.log('CodeMate is running on port: 3457');

// var roomid = 'default';

var before = ["from functools import wraps", "import traceback, sys, errno, os, signal", "TIME_LIMIT = 2", "class TimeoutError(Exception):", "    pass", "def timeout(seconds=10, error_message=os.strerror(errno.ETIME)):", "    def decorator(func):", "        def _handle_timeout(signum, frame):", "            raise TimeoutError(error_message)", "        def wrapper(*args, **kwargs):", "            signal.signal(signal.SIGALRM, _handle_timeout)", "            signal.alarm(seconds)", "            try:", "                result = func(*args, **kwargs)", "            finally:", "                signal.alarm(0)", "            return result", "        return wraps(func)(wrapper)", "    return decorator", "@timeout(TIME_LIMIT)", "def main():"]
var after = ["try:", "    exc_info = sys.exc_info()", "    main()", "except TimeoutError:", "    print 'Error: Time out! Current time limit is', TIME_LIMIT, 'sec.' ", "finally:", "    if any(exc_info) > 0:", "        traceback.print_exception(*exc_info)", "        del exc_info"];
// process.stdout.on('data', function (data){
//     console.log(data.toString('utf8'));
// });

var rooms = {};
var users = {};

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};


io.sockets.on("connection", function(socket){

    console.log("A user joined in the server. User ID is: " + socket.id);

    // var name = 'Fred';

    // var user = {"id": socket.id, "name": name, 'roomid': roomid};
    
    // if(!(socket.id in players)){
    //     players[socket.id] = player; 
    // }



    io.to(socket.id).emit('connected', socket.id);

    users[socket.id] = {name: getAnonymousName(socket.id), roomid:'default'};
    


    socket.on("changeName",function(data){
        users[socket.id]['name'] = data.name;
    });

    socket.on("joinOrCreateRoom",function(data){
        var roomid = data.roomid;
        users[socket.id].roomid = roomid;
        socket.join(roomid);
        if(roomid in rooms){ // join a existed room
            var usernames = [];
            for(var i = 0; i < rooms[roomid]['users'].length; i++){
                usernames.push(users[rooms[roomid]['users'][i]].name);
            }
            console.log('getExistedInfo');
            io.to(socket.id).emit('getExistedInfo', { usernames: usernames, document: rooms[roomid]['document'], deltas: rooms[roomid]['deltas']});
            // io.to(socket.id).emit('getExistedUsers', { usernames: usernames});
            rooms[roomid]['users'].push(socket.id);
        }else{ // create a new room
            var newRoom = {'users':[], 'deltas':[]};
            rooms[roomid] = newRoom;
            rooms[roomid]['users'].push(socket.id);
            io.to(socket.id).emit('getDocument');
        }
        io.to(roomid).emit('joinRoom', { uid: socket.id, name: users[socket.id].name});
    });


    socket.on("changeCursor",function(data){
        var roomid = users[socket.id].roomid;
        io.to(roomid).emit('changeCursor', { uid: socket.id, pos: data.pos});
    });


    socket.on("changeDoc",function(data){
        var roomid = users[socket.id].roomid;
        var deltas = rooms[roomid]['deltas'];
        for(var i = 0; i < data.deltas.length; i++){
            deltas.push(data.deltas[i]);
        }
        if(deltas.length > 50){
            io.to(socket.id).emit('getDocument');
        }
        io.to(roomid).emit('changeDoc', { uid: socket.id, deltas: data.deltas});
    });


    socket.on("run",function(data){
        var roomid = users[socket.id].roomid;
        var lines = data.lines;
        var filename = roomid + '.py';
        var stream = fs.createWriteStream(filename);
        stream.once('open', function(fd) {
            for(var i=0; i < before.length; i++){
                stream.write(before[i]+'\n');
            }
            for(var i=0; i < lines.length; i++){
                // console.log(lines[i]);
                stream.write("    "+lines[i]+'\n');
            }
            for(var i=0; i < after.length; i++){
                stream.write(after[i]+'\n');
            }
            stream.end();

            process = spawn('python',[filename]);
            process.stdout.on('data', function (data){
                io.to(roomid).emit('runResult', { uid: socket.id, name: users[socket.id].name, result: data.toString('utf8')});
            });
        });
    });

    
    socket.on("updateProblem",function(data){
        // console.log(data);
        var roomid = users[socket.id].roomid;
        var ts = Date.now() / 1000 | 0;

        fs.writeFile('user/'+roomid+'_'+ts+'.png', data.blob, 'base64', function(err) {
            io.to(roomid).emit('updateProblem', { url: roomid+'_'+ts+'.png'});
        });
        rooms[roomid]['problem'] = roomid+'_'+ts+'.png';

        
    });

    socket.on("chat",function(data){
        var roomid = users[socket.id].roomid;
        // console.log(roomid);
        // console.log({ uid: socket.id, name: users[socket.id].name, msg: data.msg});
        io.to(roomid).emit('chat', { uid: socket.id, name: users[socket.id].name, msg: data.msg});
    });

    socket.on("saveDocument",function(data){
        var roomid = users[socket.id].roomid;
        rooms[roomid]['document'] = data.document;
        rooms[roomid]['deltas'] = [];
        // console.log(rooms);
    });


    socket.on('disconnect', function() {
        console.log('a user disconnect');
        var roomid = users[socket.id].roomid;
        if(roomid in rooms){
            rooms[roomid]['users'].remove(socket.id);
        }
        io.to(roomid).emit('leave', { uid: socket.id});
        delete users[socket.id];
    });


/*
    socket.on("end_turn",function(data){
        var roomid = data.roomid;
        var t = rooms[roomid].currentPlayerIndex;
        rooms[roomid].currentPlayerIndex = 1 - t;
        io.to(roomid).emit('end_turn', {pid:socket.id});
    });

    socket.on("start_turn",function(data){
        var roomid = data.roomid;
        var pid = getCurrentPlayerId(roomid);
        io.to(roomid).emit('start_turn', {pid:pid});

        // var card = getCard();
        // var cardLocator = Math.random().toString(36).substr(2);
        // io.to(roomid).emit('dispense_card', {pid:pid, card: card, locator: cardLocator});
    });

    socket.on("attack_minion", function(data){
        var roomid = data.roomid;
        io.to(roomid).emit('attack_minion', {pid:socket.id, attacker: data.attacker, target: data.target});
    });

    socket.on("attack_face", function(data){
        var roomid = data.roomid;
        io.to(roomid).emit('attack_face', {pid:socket.id, attacker: data.attacker});
    });


    socket.on("collection_cards", function(data){
        var pid = data.pid;
        var page = data.page ? parseInt(data.page) : 1;
        var filter = data.filter;
        console.log(pid);
        console.log(filter);
        console.log('emit collection');
        MongoClient.connect(url, function(err, db) {
            getCards(db, page, filter, function(cards) {
                io.to(pid).emit('collection_cards', {cards: cards});
                db.close();
            });
        });
    });


    socket.on("open_pack", function(data){
        console.log('open pack');
        var pid = data.pid;
        console.log(pid);

        MongoClient.connect(url, function(err, db) {
            getPackCards(db, function(cards) {
                console.log('open pack');
                console.log(cards);
                io.to(pid).emit('open_pack', {cards: cards});
                db.close();
            });
        });
    });

*/

});