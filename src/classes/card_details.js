splinterlands.CardDetails = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);

		// Handle old naming issue
		this.stats.melee = this.stats.attack;
	}

	get splinter() { return this.splinter_mapping[this.color]; }
	get secondary_splinter() { return (this.secondary_color) ? this.splinter_mapping[this.secondary_color] : null; }
	get available_editions() { return this.editions.split(',').map(e => parseInt(e)); }
	get max_level() { return 10 - (this.rarity - 1) * 2; }
	get is_starter_card() { return this.rarity < 3 && !!this.available_editions.find(e => (splinterlands.get_settings().starter_editions || [7,12]).includes(e)); }
	get starter_edition() { 
		if(!this.is_starter_card)
			return -1;

		return this.available_editions.find(e => (splinterlands.get_settings().starter_editions || [7,12]).includes(e));
	}

	get splinter_mapping() {
		return {
			'Red': 'Fire',
			'Blue': 'Water',
			'Green': 'Earth',
			'White': 'Life',
			'Black': 'Death',
			'Gold': 'Dragon',
			'Gray': 'Neutral'
		}
	}

	get attack_types() {
		let types = [];

		if(this.stats.attack[this.stats.attack.length - 1] > 0)
			types.push('melee');

		if(this.stats.ranged[this.stats.ranged.length - 1] > 0)
			types.push('ranged');

		if(this.stats.magic[this.stats.magic.length - 1] > 0)
			types.push('magic');

		return types;
	}

	abilities_by_level(level) {
		if(this.type != 'Monster')
			return [];

		return [].concat.apply([], this.stats.abilities.slice(0, level)).filter(a => a != '');
	}

	level_limit_by_level_rarity(level, rarity) {
		let max_levels = [10, 8, 6, 4];
		return Math.round(max_levels[rarity - 1] / this.max_level * level);
	}
}