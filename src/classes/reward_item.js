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
			case "credits": 
				return `${this.quantity} Credits`;
			case "potion": 
				let potion = splinterlands.Potion.get_potion(this.potion_type);
				return `${this.quantity} ${potion.name} Potion Charge${this.quantity > 1 ? 's' : ''}`;
			case "pack":
				let packtext = 'Untamed Edition Booster Pack';
				if (this.edition == 2) {
					packtext = 'Essence Orb';
				} else if (this.edition == 4) {
					packtext = 'Untamed Edition Booster Pack';
				} else if (this.edition == 5) {
					packtext = 'ΛZMΛRÉ Dice';
				} else if (this.edition == 7) {
					packtext = 'Chaos Legion Booster Pack';
				} else {					
					packtext = 'Booster Pack';					
				}	
				return this.quantity + ' ' + packtext;
		}
	}

	get image_url() {
		switch(this.type) {
			case "reward_card": 
				return 'https://d36mxiodymuqjm.cloudfront.net/website/card-back_3.png';
			case "dec": 
				return "https://d36mxiodymuqjm.cloudfront.net/website/icons/img_dec_fx_256.png";
			case "credits": 
				return "https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/shop/img_credits.png";
			case "potion": 
				return splinterlands.Potion.get_potion(this.potion_type).image_url;
			case "pack":
				if (this.edition == 2) {
					return 'https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/open_packs/img_essence-orb%402x.png';
				} else if (this.edition == 4) {
					return 'https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/shop/img_pack_untamed.png';
				} else if (this.edition == 5) {
					return 'https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/open_packs/img_azmare-dice%402x.png';
				} else if (this.edition == 7) {
					return 'https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/shop/img_pack_chaos-legion.png';
				} else {					
					return 'https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/shop/img_pack_chaos-legion.png';					
				}								
		}		
	}
}