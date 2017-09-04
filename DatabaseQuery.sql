DROP TABLE IF EXISTS `rounds`, `deaths`, `switchingPlayers`, `positions`, `nades_detonated`, `nades_expired`;

CREATE TABLE `positions` (
	`position_id` int(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	`client_id` int(11) UNSIGNED,
	`timestamp` int(11),
	`pos_x` float(10,6),
	`pos_y` float(10,6),
	`pos_z` float(10,6)
);
CREATE TABLE `switchingPlayers` (
	`id` int(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	`new_team_side` int(1) UNSIGNED,
	`old_team_side` int(1) UNSIGNED,
	`client_id` int(11) UNSIGNED,
	`client_name` varchar(25)
);
CREATE TABLE `deaths` (
	`id` int(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	`attacker_id` int(11) UNSIGNED, 
	`attacker_name` varchar(25), 
	`victim_id` int(11) UNSIGNED, 
	`victim_name` varchar(25), 
	`headshot` boolean, 
	`weapon` varchar(25)
);
CREATE TABLE `rounds` (
	`id` int(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	`time_start` DATETIME DEFAULT CURRENT_TIMESTAMP,
	`time_end` DATETIME,
	`prev_round_id` int
);
CREATE TABLE `nades_detonated` (
	`id` int(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	`type_of_nade` int(11),
	`entity_id` int(11),
	`entity_pos_x` float(10,6),
	`entity_pos_y` float(10,6),
	`entity_pos_z` float(10,6),
	`client_id` int(11) UNSIGNED,
	`client_pos_x` float(10,6),
	`client_pos_y` float(10,6),
	`client_pos_z` float(10,6)
);
CREATE TABLE `nades_expired` (
	`id` int(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	`entity_id` int(11)
);

