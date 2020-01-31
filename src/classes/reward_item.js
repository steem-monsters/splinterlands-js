splinterlands.RewardItem = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);
	}

	get name() {
		switch(this.type) {
			case "reward_card": 
				return "Reward Cards";
			case "dec": 
				return "Dark Energy Crystals";
			case "potion": 
				let potion = splinterlands.Potion.get_active(this.potion_type);
				return `${potion.name} Potion Charge${this.quantity > 1 ? 's' : ''}`;
		}
	}

	get image_url() {
		switch(this.type) {
			case "reward_card": 
				return null;
			case "dec": 
				return "https://d36mxiodymuqjm.cloudfront.net/website/icons/img_dec_fx_256.png";
			case "potion": 
				return splinterlands.Potion.get_active(this.potion_type).image_url;
		}
		
	}
}