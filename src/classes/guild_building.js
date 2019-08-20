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
		if(this.level == 10)
			return -1;

		let levels = splinterlands.get_settings().guilds[this.type].levels;
		let total = 0;

		for(let i = 0; i < this.level + 1; i++)
			total += levels[i];

		return total - this.contributions;
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
}