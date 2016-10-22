var Discord = require("discord.js");
var Config = require("./config.json");
var Trans = require("./translation.json");
var Moves = require("./moves.json");
var fs = require('fs');
var bot = new Discord.Client();

var Log;
fs.access("./log.json", fs.F_OK, 
	function(err) {
		if (!err) {
			Log = require("./log.json");
			console.log("Log file exists.");
		}
		else {      
			Log = {"battleCount": 0};
			fs.writeFile("log.json", JSON.stringify(Log, null, "\t"));
			console.log("Starting new log.");
		}
	}
);

var games = {};
var types = Trans[Config.lang].types;
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
var cheatDmg;
var cheatEff;

bot.on("ready", () => {
	console.log("Started successfully. Serving in " + bot.servers.length + " servers");
	console.log("Using " + Config.lang + " translation");
});

bot.on("message", msg => {
	//Checks if the message is a command
	if (msg.content[0] === '!') {
		var command = msg.content.toLowerCase().split(" ")[0].substring(1);
		var suffix = msg.content.substring(command.length + 2);
		var cmd = commands[command];
		if (command.charAt(0) === ">" && msg.author.id !== Config.adminId){
			bot.sendMessage(msg.channel.id, "\'no\'"); 
			return null;
		}
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
						bot.sendMessage(msg.channel.id, Trans[Config.lang].cmdDeny); 
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
			if(suffix === "auto"){
				//console.log("Single player mode");
				//games[msg.channel.id].auto = true;
			}
			l = games[msg.channel.id].players.length;
			if(l === 0){
				games[msg.channel.id].players.push({"name": msg.author.username, "id": msg.author.id});
				if(games[msg.channel.id].auto === false){
					bot.sendMessage(msg.channel.id, Trans[Config.lang].battleChallenge.replace(/_PLAYER0_/, msg.author.username));
				}
				else{
					bot.sendMessage(msg.channel.id, Trans[Config.lang].battleAuto.replace(/_PLAYER0_/, msg.author.username));
				}
				console.log(msg.author.username + " started a battle.");
				logs.add(games[msg.channel.id].players[0]);
			}
			else if(l === 1 && games[msg.channel.id].players[0].name !== msg.author.username){
				games[msg.channel.id].players.push({"name": msg.author.username, "id": msg.author.id});
				bot.sendMessage(msg.channel.id, Trans[Config.lang].battleAccept.replace(/_PLAYER0_/, msg.author.username));
				logs.add(games[msg.channel.id].players[1]);
			}
			else if(l === 2){
				bot.sendMessage(msg.channel.id, Trans[Config.lang].battleExists.replace(/_PLAYER0_/, games[msg.channel.id].players[0].name).replace(/_PLAYER1_/, games[msg.channel.id].players[1].name));
			}
			
			/*single
			if (games[msg.channel.id].auto === true){
				games[msg.channel.id].players.push({"name": autobot.name, "id": "<@0>"});
				games[msg.channel.id].players[1].mon = new game.createMon(autobot.monName);
				var send = Trans[Config.lang].goMon.replace(/_PLAYER0_/, "HoloBot").replace(/_MON0_/, "RoboHolo") + 
					"\n**ATK**: " + games[msg.channel.id].players[1].mon.atk + 
					",\n**DEF**: " + games[msg.channel.id].players[1].mon.def + 
					",\n**SPE**: " + games[msg.channel.id].players[1].mon.spe + 
					",\n**SPC**: " + games[msg.channel.id].players[1].mon.spc + 
					",\n**HP**: " + games[msg.channel.id].players[1].mon.hp +
					",\n**Type**: " + game.displayType(games[msg.channel.id].players[1].mon.type);
				bot.sendMessage(msg.channel.id, send);
			}
			//single*/
			
		}
	},
	"go": {
		process: function(bot, msg, suffix) {
			if(!games[msg.channel.id].players[games[msg.channel.id].origin].mon){
				var custom = false;
				var playerMons = Log[msg.author.id].mons;
				for (mons in playerMons) {
					if(suffix.toLowerCase() === mons){
						games[msg.channel.id].players[games[msg.channel.id].origin].mon = playerMons[mons];
						games[msg.channel.id].players[games[msg.channel.id].origin].mon.hp = playerMons[mons].hpmax;
						games[msg.channel.id].players[games[msg.channel.id].origin].mon.mod = {"atk": 0, "def": 0, "spe": 0, "spc": 0};
						games[msg.channel.id].players[games[msg.channel.id].origin].mon.status = -1;
						games[msg.channel.id].players[games[msg.channel.id].origin].mon.recharge = false;
						custom = true;
					}
				}
				if(custom === false){
					games[msg.channel.id].players[games[msg.channel.id].origin].mon = new game.createMon(suffix, Config.statRange.atk, Config.statRange.def, Config.statRange.spe, Config.statRange.spc, Config.statRange.hp); 
				}
				var send = Trans[Config.lang].goMon.replace(/_PLAYER0_/, msg.author.username).replace(/_MON0_/, games[msg.channel.id].players[games[msg.channel.id].origin].mon.nick) + 
					"\n**ATK**: " + games[msg.channel.id].players[games[msg.channel.id].origin].mon.atk + 
					",\n**DEF**: " + games[msg.channel.id].players[games[msg.channel.id].origin].mon.def + 
					",\n**SPE**: " + games[msg.channel.id].players[games[msg.channel.id].origin].mon.spe + 
					",\n**SPC**: " + games[msg.channel.id].players[games[msg.channel.id].origin].mon.spc + 
					",\n**HP**: " + games[msg.channel.id].players[games[msg.channel.id].origin].mon.hp +
					",\n**Type**: " + game.displayType(games[msg.channel.id].players[games[msg.channel.id].origin].mon.type);
				if(games[msg.channel.id].turn === -1 && games[msg.channel.id].players[1] && games[msg.channel.id].players[1].mon && games[msg.channel.id].players[0].mon) {
					games[msg.channel.id].turn = (games[msg.channel.id].players[0].mon.spe >= games[msg.channel.id].players[1].mon.spe ? 0 : 1);
					send += "\n" + Trans[Config.lang].goIsFirst.replace(/_MON0_/, games[msg.channel.id].players[games[msg.channel.id].turn].mon.nick);
				}
				bot.sendMessage(msg.channel.id, send);
				
				/*single
				if(games[msg.channel.id].auto === true && games[msg.channel.id].turn === 1){
					games[msg.channel.id].origin = 1;
					game.doAttack(
						games[msg.channel.id].players[1].mon, 
						games[msg.channel.id].players[0].mon, 
						"awoo",
						msg.channel.id
					);
					game.changeTurn(
						msg.channel.id, 
						games[msg.channel.id].players[1].mon, 
						games[msg.channel.id].players[0].mon
					);	
					bot.sendMessage(msg.channel.id, games[msg.channel.id].queue);
					games[msg.channel.id].queue = "";
					if (games[msg.channel.id].ended === true) {
						game.endGame(msg.channel.id);
					}
				}
				//single*/
				
			}
		}
	},
	"use": {
		process: function(bot, msg, suffix){
			if(games[msg.channel.id].turn === games[msg.channel.id].origin) {
				if(games[msg.channel.id].endTimer !== null){
					clearTimeout(games[msg.channel.id].endTimer);
					games[msg.channel.id].endTimer = null;
					bot.sendMessage(msg.channel.id, Trans[Config.lang].timerInterrupt);
				}
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
					return null;
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
			  "`!battle, !go <name>, !use <attack>, !endbattle, !bs <\@username>, !bsall\n -- https://github.com/cox34/battlebot`"
			);
		}
	},
	"endbattle": {
		process: function(bot, msg, suffix) {
			if(games[msg.channel.id].endTimer === null){
				games[msg.channel.id].endTimer = setTimeout(function(){
						game.endGame([msg.channel.id]);
						bot.sendMessage(msg.channel.id, Trans[Config.lang].timerEnd);
					}, 15000);
				bot.sendMessage(msg.channel.id, Trans[Config.lang].timerStart);
			}
			else{
				bot.sendMessage(msg.channel.id, Trans[Config.lang].timerInProgress);
			}
		}
	},
	"bs": {
		process: function(bot, msg, suffix) {
			if(suffix){
				if(msg.mentions[0] === undefined){
					bot.sendMessage(msg.channel.id, "Invalid parameter");
					return null;
				}
				logs.add(msg.mentions[0]);
				var id = suffix.substring(2,20);
				damage.power();
				bot.sendMessage(msg.channel.id, Log[id].name + ": " + Log[id].money + " " + Config.moneyName + ", " + Log[id].win + "W\/" + Log[id].lose +"L");	
			}
			else{
				logs.add(msg.author);
				id = msg.author.id;
				bot.sendMessage(msg.channel.id, Log[id].name + ": " + Log[id].money + " " + Config.moneyName + ", " + Log[id].win + "W\/" + Log[id].lose +"L\n\n");
			}
		}
	},
	"bsall": {
		process: function(bot, msg, suffix) {
			var table = "```Name____________"+Config.moneyName+"_W\/L\n";
			var keys = []; 
			for(var key in Log) {keys.push(key);}
			var sorted = keys.sort(function(a,b){return Log[b].money-Log[a].money});
			sorted.shift();
			for(i=0;i<sorted.length;i++){
				table += Log[sorted[i]].name + logs.padTable(16-Log[sorted[i]].name.length, "_") + Log[sorted[i]].money + logs.padTable(8-Log[sorted[i]].money.toString().length, "_") + Log[sorted[i]].win + "\/" + Log[sorted[i]].lose + "\n" ;
			}
			table += "```";
			bot.sendMessage(msg.channel.id, table);
		}
	},
	"mons": {
		process: function(bot, msg, suffix) {
			logs.add(msg.author);
			var playerMons = Log[msg.author.id].mons;
			var table = "```";
			for(mon in playerMons){
				table += "name: " + mon + "; ";
				for(key in playerMons[mon]){
					if(key === 'mod') break;
					if(key === "type"){
						table += "type" + ": " + types[playerMons[mon].type[0]];
						table += playerMons[mon].type[1] ? ", " + types[playerMons[mon].type[1]] + "; " : "; ";
					}
					else{
						table += key + ": " + playerMons[mon][key] + "; ";
					}
				}
				table += "\n";
			}
			table += "```";
			bot.sendMessage(msg.channel.id, table);
		}
	},
	">savelog": {
		process: function(bot, msg, suffix) {
			logs.save();
		}
	},
	">plus": {
		process: function(bot, msg, suffix) {
			suffix = suffix.split(" ");
			var num = parseInt(suffix[0]);
			var id = suffix[1].substring(2,20);
			currency.add(id, num);
		}
	},
	">minus": {
		process: function(bot, msg, suffix) {
			suffix = suffix.split(" ");
			var num = parseInt(suffix[0]);
			var id = suffix[1].substring(2,20);
			currency.remove(id, num);
		}
	},
	">give": {
		process: function(bot, msg, suffix) {
			var monkey = suffix.match(/\"(.*?)\"/)[1].toLowerCase();
			suffix = suffix.split(";");
			var atk = suffix[1].split(","); atk = atk[1] ? [parseInt(atk[0]), parseInt(atk[1])] : parseInt(atk[0]);
			var def = suffix[2].split(","); def = def[1] ? [parseInt(def[0]), parseInt(def[1])] : parseInt(def[0]);
			var spe = suffix[3].split(","); spe = spe[1] ? [parseInt(spe[0]), parseInt(spe[1])] : parseInt(spe[0]);
			var spc = suffix[4].split(","); spc = spc[1] ? [parseInt(spc[0]), parseInt(spc[1])] : parseInt(spc[0]);
			var hpmax = suffix[5].split(","); hpmax = hpmax[1] ? [parseInt(hpmax[0]), parseInt(hpmax[1])] : parseInt(hpmax[0]);
			if(suffix[6]){
				var typ = suffix[6].split(","); typ = typ[1] ? [parseInt(typ[0]), parseInt(typ[1])] : [parseInt(typ[0])];
			}
			Log[msg.mentions[0].id].mons[monkey] = new game.createMon(monkey,atk,def,spe,spc,hpmax,typ);
		}
	},
	">clone": {
		process: function(bot, msg, suffix) {
			var monkey = suffix.match(/\"(.*?)\"/)[1];
			Log[msg.mentions[1].id].mons[monkey] = (Log[msg.mentions[0].id].mons[monkey]);
		}
	},
	">release": {
		process: function(bot, msg, suffix) {
			var monkey = suffix.match(/\"(.*?)\"/)[1];
			delete Log[msg.mentions[0].id].mons[monkey];
		}
	},
	">modify": {
		process: function(bot, msg, suffix) {
			var monkey = suffix.match(/\"(.*?)\"/)[1];
			suffix = suffix.split(";");
			switch(suffix[1]){
				case "nick": 
					Log[msg.mentions[0].id].mons[monkey].nick = suffix[2];
					break;
				case "type": 
					suffix = suffix[2].split(",");
					Log[msg.mentions[0].id].mons[monkey].type = suffix[1] ? [parseInt(suffix[0]), parseInt(suffix[1])] : [parseInt(suffix[0])];
					break;
				default: 
					Log[msg.mentions[0].id].mons[monkey][suffix[1]] = parseInt(suffix[2]);
			}
		}
	},
	">cheat": {
		process: function(bot, msg, suffix) {
			cheatEff = suffix.split(";")[0];
			cheatDmg = suffix.split(";")[1];
		}
	},
	"!encounter": {
		process: function(bot, msg, suffix) {
			//var amount = (suffix >>> 0 === parseFloat(suffix) ? parseFloat(suffix) : false);
			//var clear = ((amount && Log[msg.author.id].wildMon) ? false : true);
			var clear = true;
			//Log[msg.author.id].items.bait -= amount;
			if(clear === true){
				//bot.sendMessage(msg.channel.id, Trans[Config.lang].baitPlaced.replace(/_NUM0_/, amount));
				Log[msg.author.id].wildMon = new game.createMon("",[500,1000],[500,1000],[500,1000],[500,1000],[500,1000]);
				console.log(Log[msg.author.id].wildMon);
				var send = "";
				for(key in Log[msg.author.id].wildMon){
					if(key === 'mod') break;
					send += key + ": " + Log[msg.author.id].wildMon[key] + "; ";
				}
				bot.sendMessage(msg.channel.id, "A wild mon took the bait! Catch it?\n" + send);
			}
			else{
				bot.sendMessage(msg.channel.id, Trans[Config.lang].noBaitPlaced);
			}
		}
	},
	"!catch": {
		process: function(bot, msg, suffix) {
			return null;
		}
	},
	"!feed": {
		process: function(bot, msg, suffix) {
			return null;
		}
	},
	"$shop": {
		process: function(bot, msg, suffix) {
			suffix = suffix.split(" ");
			item = suffix[1];
			amount = suffix[0] >>> 0 === parseFloat(suffix[0]) ? parseFloat(suffix[0]) : false;
			if(item === 'ball' && amount){
				if(currency.remove(msg.author.id, 3*amount)){
					Log[msg.author.id].items[item] += amount;
				}
				else{
					bot.sendMessage(msg.channel.id, Trans[Config.lang].notEnoughMoney.replace(/_MONEY_/, Config.moneyName));
				}
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
		this.auto = false;
		this.endTimer = null;
	},
	"createMon": function(name, atkR, defR, speR, spcR, hpR, type) {
		this.nick = (name === "" ? [":frog:",":gun:",":hot_pepper:",":poop:",":apple:",":imp:",":mushroom:",":rabbit:"][Math.floor(Math.random() * 8)] : name);
		this.atk = stats.set.rand(atkR);
		this.def = stats.set.rand(defR);
		this.spe = stats.set.rand(speR);
		this.spc = stats.set.rand(spcR);
		this.hpmax = stats.set.rand(hpR);
		this.hp = this.hpmax;
		this.type = type ? type : game.setType();
		this.mod = {"atk": 0, "def": 0, "spe": 0, "spc": 0};
		this.status = -1;
		this.recharge = false;
	},
	"doAttack": function(offMon, defMon, atkName, channel){
		if (statuses.checkStart(offMon, channel) === 1) {
			var attack = {};
			if(atkName === ""){
				atkName = Trans[Config.lang].atkDefault;
			}
			if(Config.enableMoveDb === true && Moves[atkName] !== undefined) {//
				
				attack = Moves[atkName];
				attack.failed = (attack.acc === -1) ? false : (Math.random() < attack.acc/100 ? false : true);
			
				 
			}
			else { //randomly generated move
				attack.effect = "d";
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
			}
			
			if (attack.failed === true && attack.effect.indexOf("d") >= 0) {
				games[channel].queue += Trans[Config.lang].atkFail.replace(/_MON0_/, offMon.nick).replace(/_ATTACK_/, atkName) + "\n";
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
				if(cheatEff){attack.effect = cheatEff; cheatEff = null;}
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
							if(cheatDmg){attack.damage = parseInt(cheatDmg);cheatDmg = null;}
							defMon.hp - attack.damage < 0 ? defMon.hp = 0 : defMon.hp -= attack.damage;
							games[channel].queue += msgCrit + msgType + Trans[Config.lang].atkDamage.replace(/_MON0_/, offMon.nick).replace(/_ATTACK_/, atkName).replace(/_NUM0_/, attack.damage) + "\n" + game.displayHp(defMon) + "\n";
							break;
						case "h":
							var heal = Math.ceil((eff[i].charAt(1) === "0" ? offMon.hpmax : attack.damage) * parseFloat(eff[i].slice(2)));
							offMon.hp = offMon.hp + heal > offMon.hpmax ? offMon.hpmax : offMon.hp + heal;
							games[channel].queue += Trans[Config.lang].atkRecover.replace(/_MON0_/, offMon.nick).replace(/_NUM0_/, heal) + "\n" + game.displayHp(offMon) + "\n";
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
							games[channel].queue += Trans[Config.lang].atkRecoil.replace(/_MON0_/, offMon.nick).replace(/_NUM0_/, recoil) + "\n" + game.displayHp(offMon) + "\n";
							break;
						case "s":
							if(parseFloat(eff[i].slice(3)) > Math.random()) {
								statuses.set(eff[i].charAt(1) === "0" ? defMon : offMon, parseInt(eff[i].charAt(2), 10), channel);
							}
							break;
						case "f":
							if(parseFloat(eff[i].slice(1)) > Math.random()) {
								games[channel].queue += Trans[Config.lang].atkFlinch.replace(/_MON0_/, defMon.nick) + "\n";
								games[channel].turn = games[channel].turn === 0 ? 1 : 0;
							}
							break;
						case "w":
							offMon.recharge = true;
							break; 
					}
				}
			}
		}
		statuses.checkEnd(offMon, channel);
	},
	"displayHp": function(mon) {
		return mon.nick + ": " + mon.hp + "\/" + mon.hpmax + " HP";
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
 			if (defMon.recharge === true) {
				defMon.recharge = false;
				games[channel].turn = games[channel].turn === 0 ? 1 : 0;	
				games[channel].queue += mon.nick + " must recharge!";
			} 
			if (games[channel].auto === true && games[channel].turn === 1){
				games[channel].origin = 1;
				game.doAttack(
					games[channel].players[1].mon, 
					games[channel].players[0].mon, 
					"attack",
					channel
				);
				game.changeTurn(
					channel, 
					games[channel].players[1].mon, 
					games[channel].players[0].mon
				);	
				bot.sendMessage(channel, games[channel].queue);
				games[channel].queue = "";
				if (games[channel].ended === true) {
					game.endGame(channel);
				}
			}
		}
		else {
			if (offMon.hp <= 0) { //check the offender's HP first, if both are 0, the defender wins
				var loser = games[channel].players[games[channel].origin];
				var winner = games[channel].players[games[channel].origin === 0 ? 1 : 0];
			}
			else {
				var winner = games[channel].players[games[channel].origin];
				var loser = games[channel].players[games[channel].origin === 0 ? 1 : 0];
			}
			//games[channel].players[0].mon.hp = games[channel].players.mon.hpmax;
			//games[channel].players[1].mon.hp = games[channel].players.mon.hpmax;
			var award = Math.ceil(Math.random()*3);
			Log[winner.id].money += award;
			games[channel].queue += Trans[Config.lang].gameOver.replace(/_PLAYER0_/, winner.name).replace(/_PLAYER1_/, loser.name) + "\n";
			games[channel].queue += Trans[Config.lang].awardMoney.replace(/_PLAYER0_/, winner.name).replace(/_NUM0_/, award).replace(/_MONEY_/, Config.moneyName);
			games[channel].ended = true;
			logs.battleEnd(winner.id, loser.id);
		}
	},
	"endGame": function(channel) {
		games[channel] = null;
		logs.save();
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
		if(a >= 0.985) {return 140;}
		else if(a >= 0.90 && a < 0.985) {return 110;}
		else if(a >= 0.65 && a < 0.90) {return 90;}
		else if(a >= 0.35 && a < 0.65) {return 70;}
		else if(a >= 0.10 && a < 0.35) {return 50;}
		else if(a >= 0.015 && a < 0.10) {return 30;}
		else {return 15;}
	},
	"crit": function(mon) {
		if (game.occurRate(mon, Config.rateCrit, "spe") > Math.random()) {
			msgCrit = Trans[Config.lang].atkCrit + "\n";
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
			if (t > 1) {msgType = Trans[Config.lang].atkVeryEff + "\n";}
			else if (t < 1) {msgType = Trans[Config.lang].atkNotVeryEff + "\n";}
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
			return Trans[Config.lang].statsAbs.replace(/_MON0_/, mon.nick).replace(/_NUM0_/, -i).replace(/_STAT_/, stat.toUpperCase()) + "\n";
		},
		"rel": function (mon, stat, i) {
			mon.mod[stat] += i;
			if(i < 0) {
				return Trans[Config.lang].statsRelDn.replace(/_MON0_/, mon.nick).replace(/_NUM0_/, -i).replace(/_STAT_/, stat.toUpperCase()) + "\n";
			}
			else {
				return Trans[Config.lang].statsRelUp.replace(/_MON0_/, mon.nick).replace(/_NUM0_/, i).replace(/_STAT_/, stat.toUpperCase()) + "\n";
			}
		},
		"per": function (mon, stat, i) {
			mon[stat] += Math.floor(mon[stat] * i / 100);
			if(i < 0) {
				return Trans[Config.lang].statsPerDn.replace(/_MON0_/, mon.nick).replace(/_NUM0_/, -i).replace(/_STAT_/, stat.toUpperCase()) + "\n";
			}
			else {
				return Trans[Config.lang].statsPerUp.replace(/_MON0_/, mon.nick).replace(/_NUM0_/, i).replace(/_STAT_/, stat.toUpperCase()) + "\n";
			}
		},
		"rand": function(range) {
			if(typeof range === "number") {
				return range;
			}
			return Math.ceil(Math.random() * (range[1] - range[0]) + range[0]);
		}
	}
};

var statuses = {
	"set": function (mon, status, channel) {
		if (mon.status === -1) {
				switch (status) {	
					case 0: games[channel].queue += Trans[Config.lang].statusSlp.replace(/_MON0_/, mon.nick) + "\n";break;
					case 1: games[channel].queue += Trans[Config.lang].statusBrn.replace(/_MON0_/, mon.nick) + "\n";break;
					case 2: games[channel].queue += Trans[Config.lang].statusPsn.replace(/_MON0_/, mon.nick) + "\n";break;
					case 3: games[channel].queue += Trans[Config.lang].statusPrz.replace(/_MON0_/, mon.nick) + "\n";break;
					case 4: games[channel].queue += Trans[Config.lang].statusFrz.replace(/_MON0_/, mon.nick) + "\n";break;
					case 5: games[channel].queue += Trans[Config.lang].statusCfs.replace(/_MON0_/, mon.nick) + "\n";break;
					case 6: games[channel].queue += Trans[Config.lang].statusLov.replace(/_MON0_/, mon.nick) + "\n";break;
				}
				mon.status = status;
		}
	},
	"checkStart": function (mon, channel) {
 		if (mon.recharge === true) {
			games[channel].queue += Trans[Config.lang].mustRecharge.replace(/_MON0_/, mon.nick) + "\n";
			mon.recharge = false;
			return 0;
		} 
		switch (mon.status) {
			case 0: //Sleeping
				if (Math.random() < 0.5) {
					games[channel].queue += Trans[Config.lang].statusContSlp.replace(/_MON0_/, mon.nick);
					return 0;
				}
				else {
					games[channel].queue += Trans[Config.lang].statusHealSlp.replace(/_MON0_/, mon.nick) + "\n";
					mon.status = -1;
					return 1;
				}
			case 3: //Paralysed
				if (Math.random() < 0.5) {
					games[channel].queue += Trans[Config.lang].statusContPrz.replace(/_MON0_/, mon.nick);
					return 0;
				}
				else {
					games[channel].queue += Trans[Config.lang].statusHealPrz.replace(/_MON0_/, mon.nick) + "\n";
					mon.status = -1;
					return 1;
				}
			case 4: //Frozen
				if (Math.random() < 0.5) {
					games[channel].queue += Trans[Config.lang].statusContFrz.replace(/_MON0_/, mon.nick);
					return 0;
				}
				else {
					games[channel].queue += Trans[Config.lang].statusHealFrz.replace(/_MON0_/, mon.nick) + "\n";
					mon.status = -1;
					return 1;
				}
			case 5: //Confused
				if (Math.random() < 0.5) {
					mon.hp -= Math.floor(mon.hpmax / 16);
					games[channel].queue += Trans[Config.lang].statusContCfs.replace(/_MON0_/, mon.nick) + "\n" + game.displayHp(mon);
					return 0;
				}
				else {
					games[channel].queue += Trans[Config.lang].statusHealCfs.replace(/_MON0_/, mon.nick) + "\n";
					mon.status = -1;
					return 1;
				}
			case 6: //Infatuated
				if (Math.random() < 0.333) {
					games[channel].queue += Trans[Config.lang].statusContLov.replace(/_MON0_/, mon.nick);
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
				mon.hp - Math.floor(mon.hpmax / 16) < 0 ? mon.hp = 0 : mon.hp -= Math.floor(mon.hpmax / 16);
				games[channel].queue += Trans[Config.lang].statusContBrn.replace(/_MON0_/, mon.nick) + "\n" + game.displayHp(mon) + "\n";
				break;
			case 2: //Poison
				mon.hp - Math.floor(mon.hpmax / 16) < 0 ? mon.hp = 0 : mon.hp -= Math.floor(mon.hpmax / 16);
				games[channel].queue += Trans[Config.lang].statusContPsn.replace(/_MON0_/, mon.nick) + "\n" + game.displayHp(mon) + "\n";
				break;
			default: //None
				break;
		}
	}
};

var logs = {
	"add": function (player) {
		if(!Log[player.id]){
			Log[player.id] = {"name": player.name, "win": 0, "lose": 0, "money":0, "mons": {}, "items": {}};
		}
		else {
			Log[player.id].name = player.name;
		}
	},
	"battleEnd": function (id1, id2) {
		Log.battleCount++;
		Log[id1].win++;
		Log[id2].lose++;
	},
	"save": function () {
		fs.writeFile("log.json", JSON.stringify(Log, null, "\t"));
		logs.backup();
	}, 
	"backup": function () {
		var date = new Date();
		fs.access("./logs/"+date.yyyymmdd()+"log.json", err => {
			if(err){ //fiel doesn't exist
				fs.createReadStream('log.json').pipe(fs.createWriteStream("./logs/"+date.yyyymmdd()+"log.json"));
			}
			else {
				console.log('file exists');
			}
		});
	},
	"padTable": function (count, ch) {
		if (count == 0) {return "";}
		var count2 = count / 2;
		var result = ch;
		while (result.length <= count2) {result += result;}
		return result + result.substring(0, count - result.length);
	}
};

var currency = {
	
	"add": function(id, num) {
		Log[id].money += num;
	},
	"remove": function(id, num) {
		if(Log[id].money - num < 0){return false;}
		else{Log[id].money -= num;return true;}
	}

};

Date.prototype.yyyymmdd = function() {
	var mm = this.getMonth() + 1; // getMonth() is zero-based
	var dd = this.getDate();
	return [this.getFullYear(), !mm[1] && '0', mm, !dd[1] && '0', dd].join(''); // padding
};

logs.timer = setInterval(logs.save, 300000);
bot.login(Config.email, Config.password);
