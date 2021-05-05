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
			progress: (this.contributions) ? this.contributions - total_to_level : this.contrib_dec - total_to_level,
			remaining: (this.contributions) ? total_to_level + levels[this.level] - this.contributions : Math.max(total_to_level + levels[this.level] - this.contrib_dec, 0),
			crowns_total: (this.contributions) ? 0 : splinterlands.get_settings().guilds[this.type].cost[1].levels[this.level],
			crowns_progress: (this.contributions) ? 0 : this.contrib_crowns - total_to_level_crowns,
			crowns_remaining: (this.contributions) ? 0 : Math.max(total_to_level_crowns + levels_crowns[this.level] - this.contrib_crowns, 0),
		};
	}

	get symbol() {
		return splinterlands.get_settings().guilds[this.type].symbol;
	}

	get levels() {
		let bldg = splinterlands.get_settings().guilds[this.type];
		let bonus1 = this.type == 'guild_hall' ? bldg.member_limit : splinterlands.get_settings().guilds.dec_bonus_pct;
		let bonus2 = this.type == 'guild_hall' ? [1,2,3,4,5,6,7,8,9,10] : splinterlands.get_settings().guilds.shop_discount_pct;

		return bldg.levels.map((l, i) => {
			return {
				level: i + 1,
				contributions: l,
				bonus_1: bonus1[i],
				bonus_2: bonus2[i]
			}
		})
	}

	get image_url() {
		return `https://d36mxiodymuqjm.cloudfront.net/website/guilds/hall/${this.type}_level-${this.level}.png`
	}
}