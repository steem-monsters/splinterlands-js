splinterlands.CardDetails = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);
	}

	get splinter() { return this.splinter_mapping[this.color]; }

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
}