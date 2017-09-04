#include <sourcemod>

Database csgoDatabase = null;

public Plugin myinfo =
{
	name = "test",
	author = "LOL",
	description = "my first plugin",
	version = "0.0.3",
	url = "localhost:3000"
};

char pp_query[255];
char position_query[8191];

char switch_team_query[255];
int prev_round_id = 0;
new Handle: activePlayers;

public void OnPluginStart(){
	char sError[255];
	csgoDatabase = SQL_Connect("csgoSQLtest", true, sError, sizeof(sError));
	if(csgoDatabase == null){
		PrintToServer("Could not connect to database: %s", sError);
	}else{
		PrintToServer("MYSQL WAS CONNECTED SUCESSFULLY");
		activePlayers = CreateArray(1);
		HookEvent("player_team", E_player_changed_team);
		HookEvent("player_death", Event_PlayerDeath);
		HookEvent("round_start", Event_RoundStart);
		HookEvent("round_end", Event_RoundEnd);
		HookEvent("smokegrenade_detonate", Event_smokegrenade_detonate);
		HookEvent("smokegrenade_expired", Event_smokegrenade_expired);
		CreateTimer(0.1, Timer_player_positions, _, TIMER_REPEAT);
	}
}

public void Event_smokegrenade_detonate(Event event, const char[] name, bool dontBroadcast){
	char query[255];
	new float:position[3];
	new client = GetClientOfUserId(event.GetInt("userid"));
	GetEntPropVector(client, Prop_Send, "m_vecOrigin", position);
	float pos_x = position[0];
	float pos_y = position[1];
	float pos_z = position[2];
	Format(query, sizeof(query), "INSERT INTO nades_detonated (type_of_nade, entity_id, entity_pos_x, entity_pos_y, entity_pos_z, client_id, client_pos_x, client_pos_y, client_pos_z) VALUES (%d, %d, %f, %f, %f, %d, %f, %f, %f)", 1, event.GetInt("entityid"), event.GetFloat("x"), event.GetFloat("y"), event.GetFloat("z"), event.GetInt("userid"), pos_x, pos_y, pos_z);
	csgoDatabase.Query(T_queryDone, query);
}

public void Event_smokegrenade_expired(Event event, const char[] name, bool dontBroadcast){
	char query[255];
	Format(query, sizeof(query), "INSERT INTO nades_expired (entity_id) VALUES (%d)", event.GetInt("entityid"));
	csgoDatabase.Query(T_queryDone, query);
}

int activePlayersCount = 0;
public void E_player_changed_team(Event event, const char[] name, bool dontBroadcast){
	//might not need this:
	for(new i = 0; i < activePlayersCount; i++){
		new clientId = GetArrayCell(activePlayers, i);
		new client = GetClientOfUserId(clientId);
		if(!IsClientInGame(client)){
			char player_walked_name[64];
			GetClientName(client, player_walked_name, sizeof(player_walked_name));
			Format(switch_team_query, sizeof(switch_team_query), "INSERT INTO switchingPlayers (new_team_side, old_team_side, client_id, client_name) VALUES (%d, %d, %d, '%s')", 0, 0, clientId, player_walked_name);
			csgoDatabase.Query(T_queryDone, switch_team_query);
			RemoveFromArray(activePlayers, clientId);
			player_walked_name = "";
		}
	}
	//

	new playerValue = FindValueInArray(activePlayers, event.GetInt("userid"));
	new client = GetClientOfUserId(event.GetInt("userid"));
	char player_walked_name2[64];
	GetClientName(client, player_walked_name2, sizeof(player_walked_name2));
	Format(switch_team_query, sizeof(switch_team_query), "INSERT INTO switchingPlayers (new_team_side, old_team_side, client_id, client_name) VALUES (%d, %d, %d, '%s')", event.GetInt("team"), event.GetInt("oldteam"), event.GetInt("userid"), player_walked_name2);
	csgoDatabase.Query(T_queryDone, switch_team_query);
	if(event.GetInt("team") == 0){
		RemoveFromArray(activePlayers, playerValue);
	}else if(event.GetInt("oldteam") != 0){
		RemoveFromArray(activePlayers, playerValue);
		PushArrayCell(activePlayers, event.GetInt("userid"));
	}else{
		PushArrayCell(activePlayers, event.GetInt("userid"));
	}
	activePlayersCount = GetArraySize(activePlayers);
	player_walked_name2 = "";
}

public void T_queryDone(Database db, DBResultSet results, const char[] error, any data){
	if (results == null){
		PrintToServer("Query failed! %s", error);
	}
}
public void T_queryRoundStart(Database db, DBResultSet results, const char[] error, any data){
	if (results == null){
		PrintToServer("Query failed! %s", error);
	}else{
		prev_round_id = results.InsertId;
	}
}

public Action Timer_player_positions(Handle timer){
	if(activePlayersCount != 0){
		StrCat(position_query, sizeof(position_query), "INSERT INTO positions (client_id, timestamp, pos_x, pos_y, pos_z) VALUES");
		new ran = false;
		for(new i = 0; i < activePlayersCount; i++){
			new clientId = GetArrayCell(activePlayers, i);
			new client = GetClientOfUserId(clientId);
			if(IsClientInGame(client) && IsPlayerAlive(client)){
				if(ran){
					StrCat(position_query, sizeof(position_query), ",");
				}
				char player_walked_name[64];
				GetClientName(client, player_walked_name, sizeof(player_walked_name));
				new float:position[3];
				GetEntPropVector(client, Prop_Send, "m_vecOrigin", position);
				float pos_x = position[0];
				float pos_y = position[1];
				float pos_z = position[2];
				int timestamp = GetTime();
				Format(pp_query, sizeof(pp_query), " (%d, %d, %f, %f, %f)", clientId, timestamp, pos_x, pos_y, pos_z);
				StrCat(position_query, sizeof(position_query), pp_query);
				ran = true;
			}
		}
		if(ran){
			StrCat(position_query, sizeof(position_query), ";");
			csgoDatabase.Query(T_queryDone, position_query);
			position_query = "";
		}
	}
	return Plugin_Continue;
}

public void Event_RoundStart(Event event, const char[] name, bool dontBroadcast){
	char query[255];
	if(prev_round_id != 0){
		Format(query, sizeof(query), "INSERT INTO rounds (prev_round_id) VALUES (%d)", prev_round_id);
	}else{
		Format(query, sizeof(query), "INSERT INTO rounds VALUES ()");
	}
	csgoDatabase.Query(T_queryRoundStart, query);
}

public void Event_RoundEnd(Event event, const char[] name, bool dontBroadcast){
	char query[255];
	Format(query, sizeof(query), "UPDATE rounds SET time_end = now() WHERE id = %d", prev_round_id);
	csgoDatabase.Query(T_queryDone, query);
}

public void Event_PlayerDeath(Event event, const char[] name, bool dontBroadcast){
	char weapon[64];
	int victimId = event.GetInt("userid");
	int attackerId = event.GetInt("attacker");
	bool headshot = event.GetBool("headshot");
	event.GetString("weapon", weapon, sizeof(weapon));

	char attackerName[64];
	char victimName[64];
	int victim = GetClientOfUserId(victimId);
	int attacker = GetClientOfUserId(attackerId);
	GetClientName(attacker, attackerName, sizeof(attackerName));
	GetClientName(victim, victimName, sizeof(victimName));

	char query[255];
	if(headshot){
		Format(query, sizeof(query), "INSERT INTO deaths (attacker_id, attacker_name, victim_id, victim_name, headshot, weapon) VALUES (%d, '%s', %d, '%s', %s, '%s')", attackerId, attackerName, victimId, victimName, "true", weapon);
	}else{
		Format(query, sizeof(query), "INSERT INTO deaths (attacker_id, attacker_name, victim_id, victim_name, headshot, weapon) VALUES (%d, '%s', %d, '%s', %s, '%s')", attackerId, attackerName, victimId, victimName, "false", weapon);
	}
	csgoDatabase.Query(T_queryDone, query);
}

