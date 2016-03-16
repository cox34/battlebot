var Discord = require("discord.js");
var Config = require("./config.json");
var Trans = require("./translation.json");
var fs = require('fs');
var bot = new Discord.Client();

var Log;
fs.access("./log.json", fs.F_OK, function(err) {
    if (!err) {
			Log = require("./log.json");
			console.log("Log file exists.");
    }
		else {      
			Log = {"battleCount": 0};
			fs.writeFile("log.json", JSON.stringify(Log, null, "\t"));
			console.log("Starting new log.");
    }
});

var games = {};
var types = ["Normal","Fire","Water","Electric","Grass","Ice","Fighting","Poison","Ground","Flying","Psychic","Bug","Rock","Ghost","Dragon","Dark","Steel"];
var typesMatch = 
	[
		[1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
		[1, 0.5, 2, 1, 0.5, 0.5, 1, 1, 2, 1, 1, 0.5, 2, 1, 1, 1, 0.5],
		[1, 0.5, 0.5, 2, 2, 0.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5],
		[1, 1, 1, 0.5, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 1, 1, 1, 0.5],
		[1, 2, 0.5, 0.5, 0.5, 2, 1, 2, 0.5, 2, 1, 2, 1, 1, 1, 1, 1],
		[1, 2, 1, 1, 1, 0.5, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2],
		[1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 0.5, 0.5, 1, 1, 0.5, 1],
		[1, 1, 1, 1, 0.5, 1, 0.5, 0.5, 2, 1, 2, 0.5, 1, 1, 1, 1, 1],
		[1, 1, 2, 0, 2, 2, 1, 0.5, 1, 1, 1, 1, 0.5, 1, 1, 1, 1],
		[1, 1, 1, 2, 0.5, 2, 0.5, 1, 0, 1, 1, 0.5, 2, 1, 1, 1, 1],
		[1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 0.5, 2, 1, 2, 1, 2, 1],
		[1, 2, 1, 1, 0.5, 1, 0.5, 1, 0.5, 2, 1, 1, 2, 1, 1, 1, 1],
		[0.5, 0.5, 2, 1, 2, 1, 2, 0.5, 2, 0.5, 1, 1, 1, 1, 1, 1, 2],
		[0, 1, 1, 1, 1, 1, 0, 0.5, 1, 1, 1, 0.5, 1, 2, 1, 2, 1],
		[1, 0.5, 0.5, 0.5, 0.5, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1],
		[1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0, 2, 1, 0.5, 1, 0.5, 1],
		[0.5, 2, 1, 1, 0.5, 0.5, 2, 0, 2, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
	];
var msgType;
var msgCrit;

bot.on("ready", () => {
	console.log("Started successfully. Serving in " + bot.servers.length + " servers");
	console.log("Translation loaded. Using " + Config.lang);
});

bot.on("message", msg => {
	//Checks if the message is a command
	if (msg.content[0] === '!') {
		var command = msg.content.toLowerCase().split(" ")[0].substring(1);
		var suffix = msg.content.substring(command.length + 2);
		var cmd = commands[command];
		if (cmd) {
			if (!games[msg.channel.id]) {
				if (command === "go" || command === "use") {
					//console.log("No game instance."); 
					return null;
				}
			}
			else if (games[msg.channel.id]) {
				if((command === "go" || command === "use") && command !== "battle"){
					if (msg.author.username === games[msg.channel.id].players[0].name) {
						games[msg.channel.id].origin = 0;
					}
					else if (games[msg.channel.id].players[1] && msg.author.username === games[msg.channel.id].players[1].name) {
						games[msg.channel.id].origin = 1;
					}
					else {
						bot.sendMessage(msg.channel.id, "You are not a part of this battle."); 
						return;
					}
				}
			}
			cmd.process(bot, msg, suffix);
		}
	}
});

var commands = {	
	"battle": {
		process: function(bot, msg, suffix) {
			if(!games[msg.channel.id]){
				games[msg.channel.id] = new game.createInstance();
			}
			l = games[msg.channel.id].players.length;
			if(l === 0){
				games[msg.channel.id].players.push({"name": msg.author.username, "id": "<@" + msg.author.id + ">"});
				//bot.sendMessage(msg.channel.id, msg.author + " challenges someone to battle!\n(!battle, !go <name>, !use <attack>)");
				bot.sendMessage(msg.channel.id, Trans[Config.lang].battleChallenge.replace(/_PLAYER0_/g, msg.author.username));
				console.log(msg.author.username + " started a battle.");
			}
			else if(l === 1 && games[msg.channel.id].players[0].name !== msg.author.username){
				games[msg.channel.id].players.push({"name": msg.author.username, "id": "<@" + msg.author.id + ">"});
				bot.sendMessage(msg.channel.id, Trans[Config.lang].battleAccept.replace(/_PLAYER0_/g, msg.author.username));
			}
			else if(l === 2){
				bot.sendMessage(msg.channel.id, Trans[Config.lang].battleExists.replace(/_PLAYER0_/g, games[msg.channel.id].players[0].name).replace(/_PLAYER1_/g, games[msg.channel.id].players[1].name));
			}
		}
	},
	"go": {
		process: function(bot, msg, suffix) {
			if(!games[msg.channel.id].players[games[msg.channel.id].origin].mon){
				if(suffix === ""){
					suffix = "Mon" + Math.floor(Math.random() * 100);
				}
				games[msg.channel.id].players[games[msg.channel.id].origin].mon = new game.createMon(suffix);
				var send = Trans[Config.lang].goMon.replace(/_PLAYER0_/g, msg.author.username).replace(/_MON0_/g, suffix) + 
					"\n**ATK**: " + games[msg.channel.id].players[games[msg.channel.id].origin].mon.atk + 
					",\n**DEF**: " + games[msg.channel.id].players[games[msg.channel.id].origin].mon.def + 
					",\n**SPE**: " + games[msg.channel.id].players[games[msg.channel.id].origin].mon.spe + 
					",\n**SPC**: " + games[msg.channel.id].players[games[msg.channel.id].origin].mon.spc + 
					",\n**HP**: " + games[msg.channel.id].players[games[msg.channel.id].origin].mon.hp +
					",\n**Type**: " + game.displayType(games[msg.channel.id].players[games[msg.channel.id].origin].mon.type);
				if(games[msg.channel.id].turn === -1 && games[msg.channel.id].players[1] && games[msg.channel.id].players[1].mon && games[msg.channel.id].players[0].mon) {
					games[msg.channel.id].turn = (games[msg.channel.id].players[0].mon.spe >= games[msg.channel.id].players[1].mon.spe ? 0 : 1);
					send += "\n" + Trans[Config.lang].goIsFirst.replace(/_MON0_/g, games[msg.channel.id].players[games[msg.channel.id].turn].mon.name);
				}
				bot.sendMessage(msg.channel.id, send);
			}
		}
	},
	"use": {
		process: function(bot, msg, suffix){
			if(games[msg.channel.id].turn === games[msg.channel.id].origin) {
				game.doAttack(
					games[msg.channel.id].players[games[msg.channel.id].origin].mon, 
					games[msg.channel.id].players[games[msg.channel.id].origin === 0 ? 1 : 0].mon, 
					suffix,
					msg.channel.id
				);
				game.changeTurn(
					msg.channel.id, 
					games[msg.channel.id].players[games[msg.channel.id].origin].mon, 
					games[msg.channel.id].players[games[msg.channel.id].origin === 0 ? 1 : 0].mon
				);	
				bot.sendMessage(msg.channel.id, games[msg.channel.id].queue);
				games[msg.channel.id].queue = "";
				if (games[msg.channel.id].ended === true) {
					game.endGame(msg.channel.id);
				}
			}
			else {
				bot.sendMessage(msg.channel.id, Trans[Config.lang].useNotYourTurn);
			}
		}
	}, 
	"help": {
		process: function(bot, msg, suffix) {
			bot.sendMessage(
			  msg.channel.id, 
			  "!battle, !go <name>, !use <attack>, !endbattle, !battlestats <\@username>, !battleconfig <key>,<value>"
			);
		}
	},
	"endbattle": {
		process: function(bot, msg, suffix) {
			game.endGame([msg.channel.id]);
			bot.sendMessage(msg.channel.id, Trans[Config.lang].endGame.replace(/_PLAYER0_/g, msg.author.username));
		}
	},
	"battleconfig": {
		process: function(bot, msg, suffix) {
			//console.log(msg.author.id);
			//console.log(msg.author.equals(Log));
			//if (msg.author.id === Config.id) {
				var key = suffix.split(",")[0];
				var value = suffix.split(",")[1];
				if (Config[key] !== undefined) { // !battleconfig statRange,atk,100,200
					if (key === "statRange") {
						var stat = suffix.split(",")[1];
						var min = parseInt(suffix.split(",")[2], 10);
						var max = parseInt(suffix.split(",")[3], 10);
						var prev = Config[key][stat][0] + "," + Config[key][stat][1];
						Config[key][stat] = [min, max];
						key = key + "." + stat;
						value = min + "," + max;
					}
					else {
						switch (value) {
							case "true": value = true; break;
							case "false": value = false; break;
							default: value = parseFloat(value); break;
						} 
						var prev = Config[key];
						Config[key] = value;
					}
					fs.writeFile("Config.json", JSON.stringify(Config, null, "\t"));
					//console.log("Config." + key + " changed from " + prev + " to " + value + ".");
					bot.sendMessage(msg.channel.id, "Config." + key + " changed from " + prev + " to " + value + ".");
				}
				else {
					//console.log("Change failed. Undefined key.");
					bot.sendMessage(msg.channel.id, "Change failed. Undefined key.");
				}
			/* }
			else {
				//console.log("Unauthorized");
				bot.sendMessage(msg.channel.id, "Unauthorized");
			} */
		}
	},
	"battlestats": {
		process: function(bot, msg, suffix) {
			if(suffix){
				if (Log[suffix]) {
					bot.sendMessage(msg.channel.id, suffix + " has fought " + Log[suffix][0] + " battles and won " + Log[suffix][1] + " battles.");
				}
				else {
					bot.sendMessage(msg.channel.id, "That user has not fought any battles.");
				}
			}
			else {
				bot.sendMessage(msg.channel.id, Log.battleCount + " battles have been fought.");
			}
		}
	}
};

var game = {
	"createInstance": function() {
		this.turn = -1;
		this.players = [];
		this.queue = "";
		this.ended = false;
	},
	"createMon": function(name) {
		this.name = name;
		this.atk = stats.set.rand(Config.statRange.atk[0], Config.statRange.atk[1]);
		this.def = stats.set.rand(Config.statRange.def[0], Config.statRange.def[1]);
		this.spe = stats.set.rand(Config.statRange.spe[0], Config.statRange.spe[1]);
		this.spc = stats.set.rand(Config.statRange.spc[0], Config.statRange.spc[1]);
		this.hpmax = stats.set.rand(Config.statRange.hp[0], Config.statRange.hp[1]);
		this.hp = this.hpmax;
		this.type = game.setType();
		this.mod = {"atk": 0, "def": 0, "spe": 0, "spc": 0};
		this.status = -1;
		this.recharge = false;
	},
	"doAttack": function(offMon, defMon, atkName, channel){
		if (statuses.checkStart(offMon, channel) === 1) {
			var attack = {};
			if(atkName === ""){
				atkName = "attack";
			}
			attack.effect = "d";
			//attack.acc = game.occurRate(defMon, Config.rateFail, "spe");
			attack.failed = game.occurRate(defMon, Config.rateFail, "spe") > Math.random() ? true : false;
			attack.type = offMon.type[(offMon.type[1] ? Math.floor(Math.random() * 2) : 0)];
			attack.power = damage.power();
			attack.effect += "s0" + Math.floor(Math.random() * 7) + game.occurRate(offMon, Config.rateStatusEffect, "spc");
			attack.effect += "f" + game.occurRate(offMon, Config.rateFlinch, "spc");
			if (game.occurRate(offMon, Config.rateRecover, "spc") > Math.random()) {
				attack.effect += "h" + (Math.random() < 0.15 ? 0 : 1) + Config.modRecover;
			}
			if (game.occurRate(defMon, Config.rateRecoil, "spc") > Math.random()) {
				attack.effect += "r" + (Math.random() < 0.50 ? 0 : 1) + Config.modRecoil;
			}
			if(atkName === "suicide" || atkName === "selfdestruct" || atkName === "explosion") {
				attack.effect += "r11";
			}
			
			var i = Math.floor(Math.random() * 2);
			attack.effect += "m" + i + Math.floor(Math.random() * 4) + game.occurRate(offMon, Config.rateStatMod, "spc") + (i === 0 ? "-" : "+") + 1;

			
			if (attack.failed === true && attack.effect.indexOf("d") >= 0) {
				games[channel].queue += offMon.name + "\'s **" + atkName + "** missed!\n";
			}
			/*
			;Parameters
			;d - Damage: d
			;m - Stat modifier: m[# - 0:defender, 1:attacker][# - 0:atk, 1:def, 2:spe, 3:spc, 4:random][### - % chance]["+"/"-" - increase/decrease][# - amount] 
			;s - Give status: s[# - 0:defender, 1:attacker][# - status Effect][### - % chance]
			;c - Cures status: c
			;f - Flinch: f[### - % chance]
			;h - Heal: h[# - 0:percentage of max HP, 1:percentage of damage][%%%]
			;r - Recoil: r[# - 0:based on dmg, 1:based on your current hp][### - %]
			;w - Recharge next turn: w
			;u - Unequip: u[### - % chance]
			;Pwr = -1 is One Hit Knock Out
			;Acc = -1 is Never Miss
			;Ctg (Category) is currently unused. 
			*/
			else {
				eff = attack.effect.match(/m.*[\+\-]\d*|d|f[\d\.]*|s[\d\.]*|r[\d\.]*|c[\d\.]*|h[\d\.]*|w/gi);
				//console.log(eff);
				for (var i=0; i < eff.length; i++) {
					switch(eff[i].charAt(0)) {
						case "d":
							switch (attack.power) {
								case -1:
									attack.damage = defMon.hpmax;
									break;
								case 0:
									attack.damage = 0;
									break;
								default: 
									attack.damage = Math.floor(((0.84 * attack.power * (offMon.atk * stats.get(offMon, "atk")) / (defMon.def * stats.get(defMon, "def"))) + 2) * damage.crit(offMon) * (Math.random() * 39 + 85) / 100 * damage.stab(offMon.type, attack.type) * damage.type(attack.type, defMon.type) * Config.modDamage);
									break;
							}
							defMon.hp - attack.damage < 0 ? defMon.hp = 0 : defMon.hp -= attack.damage;
							games[channel].queue += msgCrit + msgType + offMon.name + "\'s **" + atkName + "** did " + attack.damage + " damage!" + "\n" + game.displayHp(defMon) + "\n";
							break;
						case "h":
							var heal = Math.ceil((eff[i].charAt(1) === "0" ? offMon.hpmax : attack.damage) * parseFloat(eff[i].slice(2)));
							offMon.hp = offMon.hp + heal > offMon.hpmax ? offMon.hpmax : offMon.hp + heal;
							games[channel].queue += offMon.name + " recovered " + heal + " HP!\n" + game.displayHp(offMon) + "\n";
							break;
						case "m":
							if(parseFloat(eff[i].slice(3).match(/^.*[\+\-]/gi)[0].replace(/[\+\-]/gi, "")) > Math.random()) {
								var stat = parseInt(eff[i].charAt(2), 10);
								if (stat === 4) { Math.floor(Math.random() * 4); }
								stat = ["atk", "def", "spe", "spc"][stat];
								games[channel].queue += stats.set.rel((eff[i].charAt(1) === "0" ? defMon : offMon), stat, parseInt(eff[i].match(/[\+\-].*/)[0], 10));
							}
							break;
						case "r":
							var recoil = Math.ceil((eff[i].charAt(1) === "0" ? attack.damage : offMon.hp) * parseFloat(eff[i].slice(2)));
							offMon.hp = offMon.hp - recoil < 0 ? 0 : offMon.hp - recoil;
							games[channel].queue += offMon.name + " took " + recoil + " recoil damage!\n" + game.displayHp(offMon) + "\n";
							break;
						case "s":
							if(parseFloat(eff[i].slice(3)) > Math.random()) {
								statuses.set(eff[i].charAt(1) === "0" ? defMon : offMon, parseInt(eff[i].charAt(2), 10), channel);
							}
							break;
						case "f":
							if(parseFloat(eff[i].slice(1)) > Math.random()) {
								games[channel].queue += defMon.name + " flinched!\n";
								games[channel].turn = games[channel].turn === 0 ? 1 : 0;
							}
							break;
/* 					case "w":
							offMon.recharge = true;
							break; */
					}
				}
			}
		}
		statuses.checkEnd(offMon, channel);
	},
	"displayHp": function(mon) {
		return mon.name + ": " + mon.hp + "\/" + mon.hpmax + " HP";
	},
	"displayType": function(type) {
		if (Config.enableType === true) {
			return (types[type[0]] + (type[1] !== undefined ? (", " + types[type[1]]) : ""));
		}
		else {
			return "???";
		}
	},
	"changeTurn": function(channel, offMon, defMon) {
		if (defMon.hp > 0 && offMon.hp > 0) {
			games[channel].turn = games[channel].turn === 0 ? 1 : 0;		
/* 			if (defMon.recharge === true) {
				defMon.recharge = false;
				games[channel].turn = games[channel].turn === 0 ? 1 : 0;	
				games[channel].queue += mon.name + " must recharge!";
			} */
		}
		else {
			if (offMon.hp <= 0) { //check the attackers's HP first, if both are 0, the defender wins
				var loser = games[channel].players[games[channel].origin];
				var winner = games[channel].players[games[channel].origin === 0 ? 1 : 0];
			}
			else {
				var winner = games[channel].players[games[channel].origin];
				var loser = games[channel].players[games[channel].origin === 0 ? 1 : 0];
			}
			games[channel].queue += "Congratulations, **" + winner.name + "**, you've defeated **" + loser.name + "**!";
			games[channel].ended = true;
			logs.set(winner.id, loser.id);
		}
	},
	"endGame": function(channel) {
		games[channel] = null;
	},
	"occurRate": function(mon, maxOccurRate, stat) {
		//if the calculated occurance rate ends up greater than the maximum occ. rate, use the max occ. rate, else just use the calculated one
		var r = (maxOccurRate * mon[stat] * stats.get(mon, stat) / Config.statRange[stat][1]);
		return r >= maxOccurRate ? maxOccurRate : r;
	}, 
	"setType": function() {
		if(Math.random() > 0.50){
			type0 = Math.floor(Math.random()*17);
			type1 = Math.floor(Math.random()*17);
			while(type0 === type1){
				type1 = Math.floor(Math.random()*17);
			}
			return [type0, type1];
		}
		else{
			return [Math.floor(Math.random()*17)];
		}
	}
};

var damage = {
	"power": function() {
		var a = Math.random();
		if(a >= .985) {return 140;}
		else if(a >= .90 && a < .985) {return 110;}
		else if(a >= .65 && a < .90) {return 90;}
		else if(a >= .35 && a < .65) {return 70;}
		else if(a >= .10 && a < .35) {return 50;}
		else if(a >= .015 && a < .10) {return 30;}
		else {return 15;}
	},
	"crit": function(mon) {
		if (game.occurRate(mon, Config.rateCrit, "spe") > Math.random()) {
			msgCrit = "Critical hit!\n";
			return 2;
		}
		else {
			msgCrit = "";
			return 1;
		}
	},
	"stab": function (monType, moveType) { //same type attack bonus
		if(monType[0] === moveType || monType[1] === moveType) {return 2;}
		else {return 1;}
	},
	"mod1": function (mon) { //if burned, half power
		return mon.status === 1 ? 0.5 : 1;
	},
	"type": function (moveType, defMonTypes) {
		msgType = "";
		if(Config.enableType === true) {
			var t = typesMatch[defMonTypes[0]][moveType] * (defMonTypes[1] ? typesMatch[defMonTypes[1]][moveType] : 1);
			if (t === 0) {t = 0.5} //types that would negate dmg are changed to 1/2
			if (t > 1) {msgType = "It's very effective!\n";}
			else if (t < 1) {msgType = "It's not very effective...\n";}
			return t;
		}
		else {
			return 1;
		}
	}
};

var stats = {
	"get": function (mon, stat) { //like modded in the games, except no +/-6 limit
		return mon.mod[stat] >= 0 ? (mon.mod[stat] + 2) / 2 : 2 / (-mon.mod[stat] + 2);
	},
	"set": {
		"abs": function (mon, stat, i) {
			mon[stat] = i;
			return "**" + mon.name + "**\'s **" + stat.toUpperCase() + "** went to **" + -i +"**!\n"
		},
		"rel": function (mon, stat, i) {
			mon.mod[stat] += i;
			if(i < 0) {
				return "**" + mon.name + "**\'s **" + stat.toUpperCase() + "** decreased by **" + -i +"**!\n"
			}
			else {
				return "**" + mon.name + "**\'s **" + stat.toUpperCase() + "** increased by **" + i +"**!\n"
			}
		},
		"per": function (mon, stat, i) {
			mon[stat] += Math.floor(mon[stat] * i / 100);
			if(i < 0) {
				return "**" + mon.name + "**\'s **" + stat.toUpperCase() + "** decreased by **" + -i +"**%!\n"
			}
			else {
				return "**" + mon.name + "**\'s **" + stat.toUpperCase() + "** increased by **" + i +"**%!\n"
			}
		},
		"rand": function(min, max) {
			return Math.ceil(Math.random() * (max - min) + min);
		}
	}
};

var statuses = {
	"set": function (mon, status, channel) {
		if (mon.status === -1) {
				switch (status) {	
					case 0: games[channel].queue += mon.name + " fell asleep!\n";break;
					case 1: games[channel].queue += mon.name + " was burned!\n";break;
					case 2: games[channel].queue += mon.name + " was poisoned!\n";break;
					case 3: games[channel].queue += mon.name + " was paralysed!\n";break;
					case 4: games[channel].queue += mon.name + " was frozen!\n";break;
					case 5: games[channel].queue += mon.name + " is confused!\n";break;
					case 6: games[channel].queue += mon.name + " fell in love!\n";break;
				}
				mon.status = status;
		}
	},
	"checkStart": function (mon, channel) {
/* 		if (mon.recharge === true) {
			games[channel].queue += mon.name + " must recharge!\n";
			mon.recharge = false;
			return 0;
		} */
		switch (mon.status) {
			case 0: //Sleeping
				if (Math.random() < 0.5) {
					games[channel].queue += mon.name + " is asleep!";
					return 0;
				}
				else {
					games[channel].queue += mon.name + " woke up!\n";
					mon.status = -1;
					return 1;
				}
			case 3: //Paralysed
				if (Math.random() < 0.5) {
					games[channel].queue += mon.name + " is completely paralysed!";
					return 0;
				}
				else {
					games[channel].queue += mon.name + " overcame its paralysis!\n";
					mon.status = -1;
					return 1;
				}
			case 4: //Frozen
				if (Math.random() < 0.5) {
					games[channel].queue += mon.name + " is frozen solid!";
					return 0;
				}
				else {
					games[channel].queue += mon.name + " defrosted!\n";
					mon.status = -1;
					return 1;
				}
			case 5: //Confused
				if (Math.random() < 0.5) {
					mon.hp -= Math.floor(mon.hpmax / 16);
					games[channel].queue += mon.name + " hurt itself in its confusion!\n" + game.displayHp(mon);
					return 0;
				}
				else {
					games[channel].queue += mon.name + " snapped out of its confusion!\n";
					mon.status = -1;
					return 1;
				}
			case 6: //Infatuated
				if (Math.random() < 0.333) {
					games[channel].queue += mon.name + " is immobilized by love!";
					return 0;
				}
				else {
					return 1;
				}
		}
		return 1;
	},
	"checkEnd": function (mon, channel) {
		switch (mon.status) {
			case 1: //Burn
				mon.hp -= Math.floor(mon.hpmax / 16);
				games[channel].queue += mon.name + " is hurt by the burn!\n" + game.displayHp(mon);
				break;
			case 2: //Poison
				mon.hp -= Math.floor(mon.hpmax / 16);
				games[channel].queue += mon.name + " is hurt by the poison!\n" + game.displayHp(mon);
				break;
			default: //None
				break;
		}
	}
};

var logs = {
	"set": function (winner, loser) {
		Log.battleCount += 1;
		console.log("battleCount: " + Log.battleCount);
		if (!Log[winner]){Log[winner] = [0, 0];}
		if (!Log[loser]){Log[loser] = [0, 0];}
		Log[winner] = [Log[winner][0]+1, Log[winner][1]+1];
		Log[loser] = [Log[loser][0]+1, Log[loser][1]];
		fs.writeFile("log.json", JSON.stringify(Log, null, "\t"));
	}
}

bot.login(Config.email, Config.password);
