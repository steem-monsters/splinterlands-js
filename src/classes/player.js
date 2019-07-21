splinterlands.Player = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);

    this.league = new splinterlands.League(data.rating);
		this.quest = new splinterlands.Quest(data.quest || {});
	}

	async load_balances() {
		this.balances = await api('/players/balances');
		return this.balances;
	}

	async get_balance(token, refresh) {
		if(!this.balances || refresh)
			await this.load_balances();

		let balance = this.balances.find(b => b.token == token);
		return balance ? parseFloat(balance.balance) : 0;
	}
}