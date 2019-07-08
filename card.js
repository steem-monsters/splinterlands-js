splinterlands.Card = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);
		this.details = splinterlands.get_card_details(this.card_detail_id);
	}

	get bcx() {
		if(this._bcx)
			return this._bcx;

		this._bcx = Math.floor(Math.max(this.gold ? this.xp / this.base_xp : (this.xp + this.base_xp) / this.base_xp, 1));
		return this._bcx;
	}

	get base_xp() {
		if(this._base_xp)
			return this._base_xp;

		let xp_property = (this.edition == 0 || (this.edition == 2 && this.card_detail_id < 100)) ? (this.gold ? 'gold_xp' : 'alpha_xp') : (this.gold ? 'beta_gold_xp' : 'beta_xp');
		this._base_xp = splinterlands.get_settings()[xp_property][this.details.rarity - 1];

		return this._base_xp;
	}

	get dec() {	
		if(this._dec)
			return this._dec;

		let alpha_bcx = 0, alpha_dec = 0;
		let xp = Math.max(this.xp - this.alpha_xp, 0);
	
		if(this.alpha_xp) {
			let alpha_bcx_xp = splinterlands.get_settings()[this.gold ? 'gold_xp' : 'alpha_xp'][this.details.rarity - 1];
			alpha_bcx = Math.max(this.gold ? this.alpha_xp / alpha_bcx_xp : this.alpha_xp / alpha_bcx_xp, 1);
			alpha_dec = splinterlands.get_settings().dec.burn_rate[this.details.rarity - 1] * alpha_bcx * splinterlands.get_settings().dec.alpha_burn_bonus;
	
			if(this.gold)
				alpha_dec *= splinterlands.get_settings().dec.gold_burn_bonus;
		}
	
		let bcx = Math.max(this.gold ? xp / this.base_xp : (xp + this.base_xp) / this.base_xp, 1);
	
		if(this.alpha_xp)
			bcx--;
	
		let dec = splinterlands.get_settings().dec.burn_rate[this.details.rarity - 1] * bcx;
	
		if(this.gold)
			dec *= splinterlands.get_settings().dec.gold_burn_bonus;
	
		if(this.edition == 0)
			dec *= splinterlands.get_settings().dec.alpha_burn_bonus;
	
		if(this.edition == 2)
			dec *= splinterlands.get_settings().dec.promo_burn_bonus;
	
		let total_dec = dec + alpha_dec;
		
		// Give a bonus if burning a max level card
		if(this.xp >= splinterlands.get_settings().xp_levels[this.details.rarity - 1][splinterlands.get_settings().xp_levels[this.details.rarity - 1].length - 1])
			total_dec *= splinterlands.get_settings().dec.max_burn_bonus;
	
		this._dec = total_dec;
		return this._dec;
	}

	get playable() {
		if(this.market_id)
			return false;

		if(!this.last_transferred_block || !this.last_used_block)
			return true;

		let cooldown_expiration = splinterlands.utils.get_cur_block_num() - splinterlands.get_settings().transfer_cooldown_blocks;
		return this.last_transferred_block <= cooldown_expiration || this.last_used_block <= cooldown_expiration;
	}

	get stats() {
		if(this._stats)
			return this._stats;
			
    let stats = this.details.stats;

    if (!stats)
      return {
        mana: 0,
        attack: 0,
        magic: 0,
        armor: 0,
        health: 0,
        speed: 0,
        abilities: [],
        level: 1
      };

    if (this.details.type == 'Summoner') {
			this._stats = Object.assign({ abilities: [], level: this.level }, stats);
			return this._stats;
		}

    let abilities = [];
    for (let i = 0; i < this.level; i++)
      stats.abilities[i].filter(a => a != '').forEach(a => abilities.push(a));

		this._stats = {
      mana: stats.mana[this.level - 1],
      attack: stats.attack[this.level - 1],
      ranged: stats.ranged ? stats.ranged[this.level - 1] : 0,
      magic: stats.magic[this.level - 1],
      armor: stats.armor[this.level - 1],
      health: stats.health[this.level - 1],
      speed: stats.speed[this.level - 1],
      abilities: abilities,
      level: this.level
		};
		
		return this._stats;
	}

	get value() {
		if(this._value)
			return this._value;

		let price_per_bcx = 0;
		let market_item = splinterlands.get_market().find(i => i.card_detail_id == this.card_detail_id && i.edition == this.edition && i.gold == this.gold);

		if(market_item)
			price_per_bcx = market_item.low_price_bcx;

		this._value = price_per_bcx * this.bcx;
		return this._value;
  }
  
  render(size) {
    let element = document.createElement('div');
    element.setAttribute('class', 'sl-card');
    element.setAttribute('card_id', this.id);
    element.setAttribute('card_details_id', this.details.id);
    element.setAttribute('gold', this.gold);
    element.setAttribute('edition', this.edition);

    let img = document.createElement('img');
    img.setAttribute('src', this.get_image_url());
    img.setAttribute('class', 'sl-card-img');
    element.appendChild(img);

    let name = document.createElement('div');
    name.setAttribute('class', 'sl-rel-pos');

    let name_bg = document.createElement('div');
    name_bg.setAttribute('class', `sl-name-bg ${this.gold ? 'sl-name-bg-gold' : 'sl-name-bg-' + this.details.color.toLowerCase()}`);

    let name_text = document.createElement('div');
    name_text.setAttribute('class', 'sl-name-text');

    let name_text_text = document.createElement('div');
    name_text_text.setAttribute('class', 'sl-name-text-text');
    name_text_text.innerText = this.details.name;
    name_text.appendChild(name_text_text);

    let name_text_lvl = document.createElement('div');
    name_text_lvl.setAttribute('class', 'sl-name-text-lvl');
    name_text_lvl.innerText = `★ ${this.level || 1}`;
    name_text.appendChild(name_text_lvl);

    name.appendChild(name_bg);
    name.appendChild(name_text);
    element.appendChild(name);

    return element;
  }

  get_image_url() {
		return ((this.edition == 1 || this.edition == 3) ? BETA_CARD_URL : ALPHA_CARD_URL) +
			(this.skin ? this.skin + '/' : '') +
			encodeURIComponent(this.details.name) +
			(this.gold ? '_gold' : '') +
			'.png';
  }
}