splinterlands.Potion = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);

		if(!data.subtype)
			this.subtype = this.id;

		this.base_price_per_charge = this.price_per_charge;
		this.price_per_charge = splinterlands.utils.guild_discounted_cost(this.price_per_charge);
	}

	get charges_remaining() {
		return splinterlands.get_player().balance(this.id.toUpperCase());
	}

	get image_url() {
		return `https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/shop/potions/potion_${this.id}.png`;
	}

	static async get_active(type) {
		let potions = await splinterlands.get_potions();
		return potions.find(p => p.id == type);
	}

	static get_potion(type) {
		if(!splinterlands.Potion._potions || splinterlands.Potion._potions.length == 0)
			splinterlands.Potion._potions = splinterlands.get_settings().potions.map(p => new splinterlands.Potion(p));

		return splinterlands.Potion._potions.find(p => p.id == type);
	}
}