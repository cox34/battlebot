Battlebot - Battles with Discord

##Installation

Install [node.js](https://nodejs.org/en/)

Install [discord.js](https://github.com/hydrabolt/discord.js) \(read the [documentation](https://discord.js.org/#/docs/main/stable/general/welcome)\)
	 
## Basic Commands
- `!battle` - start or accept a battle.
- `!endbattle` - end an unfinished battle.
- `!go [name]` - send out a mon. If name is omitted, a random name will be used.
- `!use [attack]` - use an attack. If attack is omitted, 'attack' will be used.
- `!bs [@name]` - displays user score. If name is omitted, displays score of message author. 
- `!bsall` - displays all scores. 
- `!mons` - displays user mons.
- `!help` - display basic commands. 
	 
## Currency Commands
- `!$shop` -

## Encounter Commands
- `!!encounter` -

## Admin Commands
- `!>plus ### @name_of_user` - give currency.
- `!>minus ### @name_of_user` - take currency. 
- `!>give @name_of_user "mon_name_in_quotes";atk[,max_range];def[,max_range];spe[,max_range];spc[,max_range];hp[,max_range];[type1,type2]` - create mon.
-      example: `!>give @me "good mon";300;300;300;300;500;13,15`
- `!>modify @name_of_user "mon_name_in_quotes";key;value` - modify mon.
- `!>clone @name_of_mon_owner "mon_name_in_quotes" @name_of_receiving_user` - copy mon.
- `!>release @name_of_mon_owner "mon_name_in_quotes"` - delete mon.
- `!>savelog` - save log.
- `!>cheat;###`

Types
0: Normal,

1: Fire,

2: Water,

3: Electric,

4: Grass,

5: Ice,

6: Fighting,

7: Poison,

8: Ground,

9: Flying,

10: Psychic,

11: Bug,

12: Rock,

13: Ghost,

14: Dragon,

15: Dark,

16: Steel