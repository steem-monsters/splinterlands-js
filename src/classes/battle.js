splinterlands.Battle = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);
		this.details = splinterlands.utils.try_parse(this.details);
		this.settings = splinterlands.utils.try_parse(this.settings);

		if(this.details.team1) {
			this.details.team1.summoner = new splinterlands.BattleCard(Object.assign(this.details.team1.summoner, { team_num: 1 }));
			this.details.team1.monsters = this.details.team1.monsters.map(m => new splinterlands.BattleCard(Object.assign(m, { team_num: 1 })));
		}

		if(this.details.team2) {
			this.details.team2.summoner = new splinterlands.BattleCard(Object.assign(this.details.team2.summoner, { team_num: 2 }));
			this.details.team2.monsters = this.details.team2.monsters.map(m => new splinterlands.BattleCard(Object.assign(m, { team_num: 1 })));
		}
	}

	static async load(id) { return new splinterlands.Battle(await splinterlands.api('/battle/result', { id })); }
}