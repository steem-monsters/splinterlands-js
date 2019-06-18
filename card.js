splinterlands.Card = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);
		this.details = splinterlands.get_card_details(this.card_detail_id);
	}

	get bcx() {
		if(this._bcx)
			return this._bcx;

		var xp_property = (this.edition == 0 || (this.edition == 2 && this.card_detail_id < 100)) ? (this.gold ? 'gold_xp' : 'alpha_xp') : (this.gold ? 'beta_gold_xp' : 'beta_xp');
		var bcx_xp = splinterlands.get_settings()[xp_property][this.details.rarity - 1];

		this._bcx = Math.max(this.gold ? this.xp / bcx_xp : (this.xp + bcx_xp) / bcx_xp, 1);
		return this._bcx;
	}

	get dec() {	
		if(this._dec)
			return this._dec;

		var alpha_bcx = 0, alpha_dec = 0;
		var xp = Math.max(this.xp - this.alpha_xp, 0);
	
		if(this.alpha_xp) {
			var alpha_bcx_xp = splinterlands.get_settings()[this.gold ? 'gold_xp' : 'alpha_xp'][details.rarity - 1];
			alpha_bcx = Math.max(this.gold ? this.alpha_xp / alpha_bcx_xp : this.alpha_xp / alpha_bcx_xp, 1);
			alpha_dec = splinterlands.get_settings().dec.burn_rate[details.rarity - 1] * alpha_bcx * splinterlands.get_settings().dec.alpha_burn_bonus;
	
			if(this.gold)
				alpha_dec *= splinterlands.get_settings().dec.gold_burn_bonus;
		}
	
		var xp_property = (this.edition == 0 || (this.edition == 2 && details.id < 100)) ? (this.gold ? 'gold_xp' : 'alpha_xp') : (this.gold ? 'beta_gold_xp' : 'beta_xp');
		var bcx_xp = splinterlands.get_settings()[xp_property][details.rarity - 1];
	
		var bcx = Math.max(this.gold ? xp / bcx_xp : (xp + bcx_xp) / bcx_xp, 1);
	
		if(this.alpha_xp)
			bcx--;
	
		var dec = splinterlands.get_settings().dec.burn_rate[details.rarity - 1] * bcx;
	
		if(this.gold)
			dec *= splinterlands.get_settings().dec.gold_burn_bonus;
	
		if(this.edition == 0)
			dec *= splinterlands.get_settings().dec.alpha_burn_bonus;
	
		if(this.edition == 2)
			dec *= splinterlands.get_settings().dec.promo_burn_bonus;
	
		var total_dec = dec + alpha_dec;
		
		// Give a bonus if burning a max level card
		if(this.xp >= splinterlands.get_settings().xp_levels[details.rarity - 1][splinterlands.get_settings().xp_levels[details.rarity - 1].length - 1])
			total_dec *= splinterlands.get_settings().dec.max_burn_bonus;
	
		this._dec = total_dec;
		return this._dec;
	}

	get playable() {
		if(this.market_id)
			return false;

		if(!this.last_transferred_block || !this.last_used_block)
			return true;

		var cooldown_expiration = splinterlands.utils.get_cur_block_num() - splinterlands.get_settings().transfer_cooldown_blocks;
		return this.last_transferred_block <= cooldown_expiration || this.last_used_block <= cooldown_expiration;
	}
}