splinterlands.Potion = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);
	}

	get player_potion() {
		let player = splinterlands.get_player();

		if(!player)
			return {};

		return player.items.find(i => i.item_id == this.id) || {};
	}

	get charges_remaining() {
		return this.player_potion.charges_remaining || 0;
	}
}