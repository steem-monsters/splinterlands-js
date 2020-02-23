splinterlands.RewardItem = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);

		if(this.card)
			this.card = new splinterlands.Card(this.card);
	}

	get name() {
		switch(this.type) {
			case "reward_card": 
				return "Reward Card";
			case "dec": 
				return `${this.quantity} Dark Energy Crystals`;
			case "potion": 
				let potion = splinterlands.Potion.get_potion(this.potion_type);
				return `${this.quantity} ${potion.name} Potion Charge${this.quantity > 1 ? 's' : ''}`;
			case "pack":
				return this.quantity + ' ' + (this.edition == 2 ? 'Essence Orb' : 'Untamed Edition Booster Pack');
		}
	}

	get image_url() {
		switch(this.type) {
			case "reward_card": 
				return 'https://d36mxiodymuqjm.cloudfront.net/website/card-back_3.png';
			case "dec": 
				return "https://d36mxiodymuqjm.cloudfront.net/website/icons/img_dec_fx_256.png";
			case "potion": 
				return splinterlands.Potion.get_potion(this.potion_type).image_url;
			case "pack":
				return this.edition == 2 ? 'https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/open_packs/img_essence-orb%402x.png' : 'https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/shop/img_pack_untamed.png';
		}
		
	}
}