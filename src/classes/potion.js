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
}