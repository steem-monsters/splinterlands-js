splinterlands.Potion = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);
	}

	get charges_remaining() {
		return splinterlands.get_player().balance(this.id.toUpperCase());
	}

	get image_url() {
		return `https://s3.amazonaws.com/steemmonsters/website/ui_elements/shop/potions/potion_${this.id}.png`;
	}

	static async get_active(type) {
		let potions = await splinterlands.get_potions();
		return potions.find(p => p.id == type);
	}
}