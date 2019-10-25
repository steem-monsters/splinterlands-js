splinterlands.Player = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);

    this.league = new splinterlands.League(data.rating);
		this.quest = new splinterlands.Quest(data.quest || {});

		if(data.guild)
			this.guild = new splinterlands.Guild(data.guild);
	}

	async load_balances() {
		this.balances = await splinterlands.api('/players/balances');
		return this.balances;
	}

	async get_balance(token, refresh) {
		if(!this.balances || refresh)
			await this.load_balances();

		let balance = this.balances.find(b => b.token == token);
		return balance ? parseFloat(balance.balance) : 0;
	}

	get ecr() {
		return Math.min((isNaN(parseInt(this.capture_rate)) ? 10000 : this.capture_rate) + (splinterlands.get_settings().last_block - this.last_reward_block) * splinterlands.get_settings().dec.ecr_regen_rate, 10000);
	}

	get profile_image() {
		return `https://steemitimages.com/u/${this.name}/avatar`;
	}

	static async load(name) {
		return await new Promise(async (resolve, reject) => {
			let response = await splinterlands.api('/players/details', { name });

			if(response.error)
				reject(response);
			else
				resolve(new splinterlands.Player(response));
		});
	}
}