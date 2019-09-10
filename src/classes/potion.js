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

	get image_url() {
		return `https://s3.amazonaws.com/steemmonsters/website/ui_elements/shop/potions/potion_${this.id}.png`;
	}

	static async get_active(type) {
		let potions = await splinterlands.get_potions();
		let active_potion = potions.slice().sort((a, b) => b.value - a.value).find(p => p.subtype == type && p.charges_remaining > 0);
		return active_potion || potions.find(p => p.subtype == type);
	}
}