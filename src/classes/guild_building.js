splinterlands.GuildBuilding = class {
	constructor(guild_id, type, data) {
		this.type = type;
		this.guild_id = guild_id;
		Object.keys(data).forEach(k => this[k] = data[k]);
	}

	async get_contributions() {
		return await splinterlands.api('/guilds/contributions', { guild_id: this.guild_id, type: this.type });
	}

	get to_next_level() {
		if(this.level == 10) {
			return {
				total: levels[this.level - 1],
				progress: levels[this.level - 1],
				remaining: 0
			};
		}

		let levels = (splinterlands.get_settings().guilds[this.type].levels) ? splinterlands.get_settings().guilds[this.type].levels : splinterlands.get_settings().guilds[this.type].cost[0].levels;
		let levels_crowns = (splinterlands.get_settings().guilds[this.type].levels) ? [] : splinterlands.get_settings().guilds[this.type].cost[1].levels;
		let total_to_level = 0;
		let total_to_level_crowns = 0;

		for(let i = 0; i < this.level; i++) {
			total_to_level += levels[i];
			total_to_level_crowns += levels_crowns[i];
		}
		
		return {
			total: levels[this.level],
			progress: ('contributions' in this) ? this.contributions - total_to_level : this.contrib_dec - total_to_level,
			remaining: ('contributions' in this) ? total_to_level + levels[this.level] - this.contributions : Math.max(total_to_level + levels[this.level] - this.contrib_dec, 0),
			crowns_total: ('contributions' in this) ? 0 : splinterlands.get_settings().guilds[this.type].cost[1].levels[this.level],
			crowns_progress: ('contributions' in this) ? 0 : this.contrib_crowns - total_to_level_crowns,
			crowns_remaining: ('contributions' in this) ? 0 : Math.max(total_to_level_crowns + levels_crowns[this.level] - this.contrib_crowns, 0),
		};
	}

	get symbol() {
		return splinterlands.get_settings().guilds[this.type].symbol;
	}

	get levels() {
		let bldg = null;				
		let bonus1 = [];
		let bonus2 = [];

		switch (this.type) {
			case 'guild_hall':
				bldg = splinterlands.get_settings().guilds[this.type];
				bonus1 = bldg.member_limit;
				bonus2 = [1,2,3,4,5,6,7,8,9,10];
				
				return bldg.levels.map((l, i) => {
					return {
						level: i + 1,
						contributions: l,
						bonus_1: bonus1[i],
						bonus_2: bonus2[i]
					}
				});
			case 'quest_lodge':
				bldg = splinterlands.get_settings().guilds[this.type];
				bonus1 = splinterlands.get_settings().guilds.dec_bonus_pct;
				bonus2 = splinterlands.get_settings().guilds.shop_discount_pct;
				
				return bldg.levels.map((l, i) => {
					return {
						level: i + 1,
						contributions: l,
						bonus_1: bonus1[i],
						bonus_2: bonus2[i]
					}
				});	
			case 'arena':
				// tier can range from 0 to 4 (corresponding to building levels 1&2, 3&4, 5&6, 7&8, 9&10)
				let dec_cost_levels = splinterlands.get_settings().guilds['arena'].cost[0].levels;
				let crown_cost_levels = splinterlands.get_settings().guilds['arena'].cost[1].levels;
				
				bonus1 = [1,1,2,2,3,3,4,4,5,5];
				bonus2 = splinterlands.get_settings().frays;
				let bonus3 = splinterlands.get_settings().guilds.crown_multiplier;
				
				return  dec_cost_levels.map((l, i) => {
					let arena_tier = Math.ceil((i+1) / 2) - 1;
					return {
						level: i + 1,
						contributions: l,
						contributions_crowns: crown_cost_levels[i],
						bonus_1: bonus1[i],
						bonus_2: bonus2[arena_tier].length,
						bonus_3: bonus3[i]
					}
				});
			case 'barracks':
				// tier can range from 0 to 4 (corresponding to building levels 1&2, 3&4, 5&6, 7&8, 9&10)
				let dec_barracks_cost_levels = splinterlands.get_settings().guilds['barracks'].cost[0].levels;
				let crown_barracks_cost_levels = splinterlands.get_settings().guilds['barracks'].cost[1].levels;
				
				let perks_names = ["Advantage", "Unleash I", "Banish I", "Surge I", "Unleash II", "Banish II", "Unleash III", "Surge II", "Ambush", "Unleash IV"];
				let perks_desc = ["Home Team wins when there’s a Draw. Home Team units go first in Tie.",
							  "Can use Gladiator cards up to the Bronze level cap.",
							  "Select one card that the Enemy Team cannot use in Home battles.",
							  "+1 added to the Mana Cap for all your guild’s Brawl battles.",
							  "Can use Gladiator cards up to the Silver level cap.",
							  "Select a second card that the Enemy Team cannot use in Home battles.",
							  "Can use Gladiator cards up to the Gold level cap.",
							  "+2 added to the Mana Cap for all your guild’s Brawl battles.",
							  "All Enemy units suffer a +/- 1 Speed disadvantage for Home Arena battles.",
							  "Can use Gladiator cards up to the MAX level cap."
							];
				
				return  dec_barracks_cost_levels.map((l, i) => {
					return {
						level: i + 1,
						contributions: l,
						contributions_crowns: crown_barracks_cost_levels[i],
						perk: perks_names[i],
						perk_desc: perks_desc[i],
						perk_img_url: `https://d36mxiodymuqjm.cloudfront.net/website/guilds/brawls/tactics/img_tactic-${i+1}_128.png`
					}
				});
			default:
				break;
		}
	}

	get image_url() {
		return `https://d36mxiodymuqjm.cloudfront.net/website/guilds/bldg/buildings/bldg_guild_${this.type}-${this.level}-v2.png`;		
	}
}