splinterlands.GuildBuilding = class {
	constructor(type, data) {
		this.type = type;
		Object.keys(data).forEach(k => this[k] = data[k]);
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
}