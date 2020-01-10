splinterlands.Battle = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);

		if(typeof this.details == 'string')
			this.details = splinterlands.utils.try_parse(this.details);

		if(typeof this.settings == 'string')
			this.settings = splinterlands.utils.try_parse(this.settings);

		if(this.details.team1) {
			this.details.team1.summoner = new splinterlands.BattleCard(Object.assign(this.details.team1.summoner, { team_num: 1 }));
			this.details.team1.monsters = this.details.team1.monsters ? 
				this.details.team1.monsters.map(m => new splinterlands.BattleCard(Object.assign(m, { team_num: 1 }))) : [];
		}

		if(this.details.team2) {
			this.details.team2.summoner = new splinterlands.BattleCard(Object.assign(this.details.team2.summoner, { team_num: 2 }));
			this.details.team2.monsters = this.details.team2.monsters ? 
				this.details.team2.monsters.map(m => new splinterlands.BattleCard(Object.assign(m, { team_num: 1 }))) : [];
		}

		this.inactive = this.inactive.split(',');
		this.ruleset = this.ruleset.split('|');
		this.rating_level = this.settings ? this.settings.rating_level : null;
		this.allowed_cards = this.settings ? this.settings.allowed_cards : null;
	}
	
	get ruleset_images() {
		return this.ruleset.map(r => splinterlands.utils.asset_url(`website/icons/rulesets/img_combat-rule_${r.toLowerCase().replace(/[^a-zA-Z]+/g, '_')}.png`));
	}

	static async load(id) { return new splinterlands.Battle(await splinterlands.api('/battle/result', { id })); }
}