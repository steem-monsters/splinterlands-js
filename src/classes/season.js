splinterlands.Season = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);
		this.league = new splinterlands.League(this.max_rating, this.max_league);
	}

	async claim_rewards() { return splinterlands.ops.claim_season_rewards(this.season); }
}