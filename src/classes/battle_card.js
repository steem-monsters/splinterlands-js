splinterlands.BattleCard = class extends splinterlands.Card {
	constructor(data) {
		super(data);
	}

	get stats() {
		return {
			attack: this.state.stats[0],
			melee: this.state.stats[0],
			ranged: this.state.stats[1],
			magic: this.state.stats[2],
			armor: this.state.stats[3],
			health: this.state.stats[4],
			speed: this.state.stats[5],
			abilities: this.abilities,
			level: this.level
		};
	}

	get alive() { return this.state.alive; }
	get effects() { return this.state.other ? this.state.other.map(e => e[0]) : []; }

	update(new_state) { this.state = new_state; }
}