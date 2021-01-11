splinterlands.Match = class {
	constructor(data) { this.update(data); }

	update(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);

		if(this.match_date) {
			this.inactive = this.inactive.split(',');
			this.ruleset = this.ruleset.split('|');
			this.settings = splinterlands.utils.try_parse(this.settings);
			this.rating_level = this.settings ? this.settings.rating_level : null;
			this.allowed_cards = this.settings ? this.settings.allowed_cards : null;
		}

		return this;
	}

	get ruleset_images() {
		return this.ruleset.map(r => splinterlands.utils.asset_url(`website/icons/rulesets/new/img_combat-rule_${r.toLowerCase().replace(/[^a-zA-Z]+/g, '_')}_150.png`));
	}
}