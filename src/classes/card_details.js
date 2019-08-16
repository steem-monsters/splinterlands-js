splinterlands.CardDetails = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);

		// Handle old naming issue
		this.stats.melee = this.stats.attack;
	}

	get splinter() { return this.splinter_mapping[this.color]; }
	get available_editions() { return this.editions.split(',').map(e => parseInt(e)); }

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
		return [].concat.apply([], this.stats.abilities.slice(0, level)).filter(a => a != '');
	}
}