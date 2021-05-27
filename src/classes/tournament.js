splinterlands.Tournament = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);
	}

	static async find_brawl(tournament_id, guild_id) {
		return new splinterlands.Tournament(await splinterlands.api('/tournaments/find_brawl', { id: tournament_id, guild_id }));
	}

	static async battles(tournament_id, round, player, reverse) {
		return new splinterlands.Tournament(await splinterlands.api('/tournaments/battles', { id: tournament_id, round, player, reverse }));
	}

	static async fray_count(tournament_id) {
		return new splinterlands.Tournament(await splinterlands.api('/tournaments/fray_count', { id: tournament_id }));
	}
}