function Map(container2){
  container = container2;
}
function getPosX(pos_x){
  return ((Math.abs(pos_x+2850))/6.0)-10;
}
function getPosY(pos_y){
  return ((Math.abs(pos_y-4073))/6.0)-10;
}
var players = new Object();
Map.prototype = {
  constructor: Map,
  load:function(){
      $("#".concat(container)).css("background-image", "url('maps/de_dust_radar_spectate.png')");
      $("#".concat(container)).css("background-size", "1024px 1024px");
      $("#".concat(container)).css("background-repeat", "no-repeat");
  },
  drawPlayer:function(pos_x, pos_y, pos_z, client_id){
    var real_pos_x = getPosX(pos_x);
    var real_pos_y = getPosY(pos_y);
    $("#player".concat(client_id)).css("left", real_pos_x + "px");
    $("#player".concat(client_id)).css("top", real_pos_y + "px");
  },
  drawPlayers:function(data){
    for(var i = 0; i < data['0'].length; i++){
        var real_pos_x = getPosX(data['0'][i].pos_x);
        var real_pos_y = getPosY(data['0'][i].pos_y);
      $("#player".concat(data['0'][i].client_id)).css("left", real_pos_x + "px");
      $("#player".concat(data['0'][i].client_id)).css("top", real_pos_y + "px");
    }
  },
  removeNade:function(entity_id){
    $("#".concat(entity_id)).remove();
  },
  drawSmoke:function(entity_id, entity_pos_x, entity_pos_y, entity_pos_z, client_pos_x, client_pos_y, client_pos_z){
    $("#".concat(container)).append('<div id="' + entity_id +'" class="smoke" style="width:48px; height:48px;position:absolute;top:' + (((Math.abs(entity_pos_y-4073))/6.0)-24) + 'px;left:' + (((Math.abs(entity_pos_x+2850))/6.0)-24) + 'px;"></div>');
  },
  resetPlayers:function(){
    for(var key in players){
      switch (players[key]) {
        case 2:
          $("#dot".concat(key)).css('background-color', 'yellow');
          break;
        case 3:
          $("#dot".concat(key)).css('background-color', 'blue');
          break;
      }
    }
  },
  team_switch:function(new_team_side, old_team_side, client_id, client_name){
    players[client_id] = new_team_side;
    switch (new_team_side) {
      case 2:
        $("#player".concat(client_id)).css('left', '500px');
        $("#player".concat(client_id)).css('top', '100px');
        $("#dot".concat(client_id)).css('background-color', 'yellow');
        break;
      case 3:
        $("#player".concat(client_id)).css('left', '550px');
        $("#player".concat(client_id)).css('top', '925px');
        $("#dot".concat(client_id)).css('background-color', 'blue');
        break;
      default:
        $("#player".concat(client_id)).empty();
        $("#player".concat(client_id)).remove();
        delete players[client_id];
    }
  },
  team_join:function(new_team_side, old_team_side, client_id, client_name){
    console.log(client_id + " as name " + client_name);
    players[client_id] = new_team_side;
    switch (new_team_side) {
      case 2:
        $("#".concat(container)).append('<div id="player' + client_id + '" style="position:absolute;left:500px; top:100px; "><div id="dot' + client_id + '" style="background-color:yellow;width:10px;height:10px;border-radius:5px;"></div><label style="color:white; for="dot' + client_id + '">' + client_name + '</label></div>');
        break;
      case 3:
        $("#".concat(container)).append('<div id="player' + client_id + '" style="position:absolute;left:550px; top:925px;"><div id="dot' + client_id + '" style="background-color:blue;width:10px;height:10px;border-radius:5px;"></div><label style="color:white;" for="dot' + client_id + '">' + client_name + '</label></div>');
        break;
    }
  }
}
