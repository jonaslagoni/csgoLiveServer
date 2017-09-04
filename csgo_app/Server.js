var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var mysql = require('mysql');
var fs = require('fs');
var url = require('url');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "csgo_test",
    password: "123"
});

var killBackgroundImage = fs.readFileSync('./public_html/img/kill/background.png');
var de_dust_background = fs.readFileSync('./public_html/maps/de_dust_radar_spectate.png');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/public_html/map_test.html');
});

app.get('/img/kill/background.png', function(req, res){
  res.writeHead(200, {'Content-Type': 'image/png'});
  res.end(killBackgroundImage , 'binary');
  console.log("sending picture");
});

app.get('/maps/de_dust_radar_spectate.png', function(req, res){
  res.writeHead(200, {'Content-Type': 'image/png'});
  res.end(de_dust_background , 'binary');
  console.log("sending picture");
});

app.get('/js/map.js', function(req, res){
  res.sendFile(__dirname + '/public_html/js/map.js');
  //res.writeHead(200, {'content-type' : 'application/javascript', 'charset' : 'utf-8'});
  // 'X-Content-Type-Options': 'nosniff'
  //res.end(__dirname + '/public_html/js/map.js');
  console.log("sending map js");
});

con.connect(function(err){
  if(err) throw err;
  console.log("Connected to mysql");
});

var prev_id = 0;
var last_position_id = 0;
var last_switch_team_id = 0;
var lastRound_id = 0;
var last_nades_detonated = 0;
var last_nades_expired = 0;


setInterval(function(){
  var query = "SELECT * FROM nades_detonated WHERE id > " + last_nades_detonated;
  con.query(query, function(error, rows, fields){
    if(error) throw error;
    if(rows.length > 0){
      for(var i = 0; i < rows.length; i++){
        switch (rows[i].type_of_nade) {
          case 1:
            io.emit('detonated_smoke', rows[i].entity_id, rows[i].entity_pos_x, rows[i].entity_pos_y, rows[i].entity_pos_z, rows[i].client_pos_x, rows[i].client_pos_y, rows[i].client_pos_z);
            break;
          case 2:
            //more nades
            break;
        }
        last_nades_detonated = rows[i].id;
      }
    }
  });
}, 200);

setInterval(function(){
  var query = "SELECT * FROM nades_expired WHERE id > " + last_nades_expired;
  con.query(query, function(error, rows, fields){
    if(error) throw error;
    if(rows.length > 0){
      for(var i = 0; i < rows.length; i++){
        io.emit('expired_nade', rows[i].entity_id);
        last_nades_expired = rows[i].id;
      }
    }
  });
}, 200);

io.sockets.on('connection', function(socket){
  var query = "SELECT * FROM switchingPlayers WHERE id > 0";
  con.query(query, function(error, rows, fields){
    if(error) throw error;
    if(rows.length > 0){
      for(var i = 0; i < rows.length; i++){
          if(rows[i].old_team_side == 0) {
            console.log("found multiple team join");
            socket.emit('team_join', rows[i].new_team_side, rows[i].old_team_side, rows[i].client_id, rows[i].client_name);
          }else{
            console.log("found multiple team switch");
            socket.emit('team_switch', rows[i].new_team_side, rows[i].old_team_side, rows[i].client_id, rows[i].client_name);
          }
          last_switch_team_id = rows[i].id;
      }
    }
  });
});

setInterval(function(){
  var query = "SELECT * FROM deaths WHERE id > " + prev_id;
  con.query(query, function(error, rows, fields){
    if(error) throw error;
    if(rows.length > 0){
      for(var i = 0; i < rows.length; i++){
        io.emit('newKill', rows[i].attacker_id, rows[i].attacker_name, rows[i].victim_id, rows[i].victim_name, rows[i].headshot, rows[i].weapon);
        prev_id = rows[i].id;
      }
    }
  });
}, 200);

setInterval(function(){
  var query = "SELECT * FROM positions WHERE position_id > " + last_position_id;
  con.query(query, function(error, rows, fields){
    if(error) throw error;
    if(rows.length > 0){
      console.log("found footstep");
      if(rows.length == 1){
        io.emit('position', rows[0].pos_x, rows[0].pos_y, rows[0].pos_z, rows[0].client_id);
        last_position_id = rows[0].position_id;
      }else{
        console.log("length = " + rows.length);
        var o = {};
        var key = '0';
        o[key] = [];
        for(var i = 0; i < rows.length; i++){
          console.log("found footstep " + i + " of " + rows.length);
          var data = {
            pos_x : rows[i].pos_x,
            pos_y : rows[i].pos_y,
            pos_z : rows[i].pos_z,
            client_id : rows[i].client_id
          };
          o[key].push(data);
          last_position_id = rows[i].position_id;
        }
        io.emit('positions', o);
      }
    }
  });
}, 100);

setInterval(function(){
  var query = "SELECT * FROM switchingPlayers WHERE id > " + last_switch_team_id;
  con.query(query, function(error, rows, fields){
    if(error) throw error;
    if(rows.length > 0){
      if(rows.length == 1){
        if(rows[0].old_team_side == 0) {
          console.log("found team join");
          io.emit('team_join', rows[0].new_team_side, rows[0].old_team_side, rows[0].client_id, rows[0].client_name);
        }else{
          console.log("found team switch");
          io.emit('team_switch', rows[0].new_team_side, rows[0].old_team_side, rows[0].client_id, rows[0].client_name);
        }
        last_switch_team_id = rows[0].id;
      }else{
        for(var i = 0; i < rows.length; i++){
            if(rows[i].old_team_side == 0) {
              console.log("found multiple team join");
              io.emit('team_join', rows[i].new_team_side, rows[i].old_team_side, rows[i].client_id, rows[i].client_name);
            }else{
              console.log("found multiple team switch");
              io.emit('team_switch', rows[i].new_team_side, rows[i].old_team_side, rows[i].client_id, rows[i].client_name);
            }
            last_switch_team_id = rows[i].id;
        }
      }
    }
  });
}, 200);
setInterval(function(){
  var query = "SELECT * FROM rounds WHERE id > " + lastRound_id;
  con.query(query, function(error, rows, fields){
    if(error) throw error;
    if(rows.length > 0){
      io.emit('new_round');
      lastRound_id = rows[0].id;
    }
  });
}, 500);


http.listen(port, function(){
  console.log('listening on *:' + port);
});
