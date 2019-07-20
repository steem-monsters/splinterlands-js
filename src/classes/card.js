splinterlands.Card = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);
    this.details = splinterlands.get_card_details(this.card_detail_id);
    
    if(!this.level)
      this.level = 1;
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
  
  get next_level_progress() {
    if(this._next_level_progress)
      return this._next_level_progress;

    if(this.level >= this.max_level) {
      this._next_level_progress = { current: 0, total: 0, progress: 100 };
      return this._next_level_progress;
    }

    if(!this.level || isNaN(this.level) || this.level <= 0) {
      this._next_level_progress = { current: 0, total: 1, progress: 0 };
      return this._next_level_progress;
    }

    let bcx = this.gold ? this.bcx : Math.max(this.bcx - 1, 0);
    let xp_levels = splinterlands.get_settings().xp_levels[this.details.rarity - 1];
    let next_lvl_bcx = Math.ceil(xp_levels[this.level - 1] / this.base_xp);
    let cur_lvl_bcx = this.level <= 1 ? 0 : Math.ceil(xp_levels[this.level - 2] / this.base_xp);

    this._next_level_progress = { 
      current: bcx - cur_lvl_bcx || 0, 
      total: next_lvl_bcx - cur_lvl_bcx, 
      progress: ((bcx - cur_lvl_bcx) || 0) / (next_lvl_bcx - cur_lvl_bcx) * 100
    };

    return this._next_level_progress;
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

  get is_alpha() { return this.edition == 0 || (this.edition == 2 && this.details.id < 100); }
  get max_level() { return 10 - (this.details.rarity - 1) * 2; }
  
  render(size) {
    let element = document.createElement('div');
    element.setAttribute('class', `sl-card sl-${size || 'med'} sl-${this.is_alpha ? 'alpha' : 'beta'} sl-foil-${this.gold ? 'gold' : 'reg'}`);
    element.setAttribute('card_id', this.id);
    element.setAttribute('card_details_id', this.details.id);
    element.setAttribute('gold', this.gold);
    element.setAttribute('edition', this.edition);

    let img = document.createElement('img');
    img.setAttribute('src', this.get_image_url());
    img.setAttribute('class', 'sl-card-img');
    element.appendChild(img);

    let rel_container = document.createElement('div');
    rel_container.setAttribute('class', 'sl-rel-pos');

    let stats_container = document.createElement('div');
    stats_container.setAttribute('class', 'sl-stats-container');

    // Card name & level
    let name_bg = document.createElement('div');
    name_bg.setAttribute('class', `sl-name-bg ${this.gold ? 'sl-name-bg-gold' : 'sl-name-bg-' + this.details.color.toLowerCase()}`);

    if(this.gold && this.is_alpha) {
      let name_bg_img = document.createElement('img');
      name_bg_img.setAttribute('src', 'https://s3.amazonaws.com/steemmonsters/website/gold_name_bg.png');
      name_bg.appendChild(name_bg_img);
    }

    let name_text = document.createElement('div');
    name_text.setAttribute('class', 'sl-name-text');

    let name_text_size = (this.details.name.length >= 19) ? 'xxs' : ((this.details.name.length >= 17) ? 'xs' : ((this.details.name.length >= 14) ? 'sm' : 'm'));

    let name_text_text = document.createElement('div');
    name_text_text.setAttribute('class', `sl-name-text-text sl-${name_text_size}`);
    name_text_text.innerText = this.details.name;
    name_text.appendChild(name_text_text);

    let name_text_lvl = document.createElement('div');
    name_text_lvl.setAttribute('class', `sl-name-text-lvl ${this.level >= 10 ? 'sl-sm' : ''}`);
    name_text_lvl.innerText = `★ ${this.level || 1}`;
    name_text.appendChild(name_text_lvl);

    stats_container.appendChild(name_bg);
    stats_container.appendChild(name_text);

    // Card XP bar
    let bar = document.createElement('div');
    bar.setAttribute('class', 'sl-card-level');

    let progress = document.createElement('div');
    progress.setAttribute('class', 'sl-card-level-bar');
    progress.setAttribute('style', `width: ${this.next_level_progress.progress.toFixed()}%;`)

    bar.appendChild(progress);
    stats_container.appendChild(bar);

    // Card stats
    let mana = document.createElement('div');
    mana.setAttribute('class', 'sl-stat-mana');

    let mana_img = document.createElement('img');
    mana_img.setAttribute('src', 'https://s3.amazonaws.com/steemmonsters/website/stats/stat_bg_mana.png');
    mana.appendChild(mana_img);

    let mana_text = document.createElement('div');
    mana_text.setAttribute('class', 'sl-stat-text-mana');
    mana_text.innerText = this.stats.mana;
    mana.appendChild(mana_text);
		stats_container.appendChild(mana);
		
		let container = stats_container;

    if(this.details.type == 'Summoner') {
			container = document.createElement('div');
			container.setAttribute('class', 'sl-summoner-stats');
			stats_container.appendChild(container);
		}

		this.render_stat(container, 'health');
		this.render_stat(container, 'speed');
		this.render_stat(container, 'attack');
		this.render_stat(container, 'ranged', this.stats.attack > 0);
		this.render_stat(container, 'magic', this.stats.attack > 0 || this.stats.ranged > 0);
		this.render_stat(container, 'armor');

		// Abilities
		if(this.stats.abilities.length > 0) {
			let abilities = document.createElement('div');
			abilities.setAttribute('class', 'sl-abilities');
				
			this.stats.abilities.forEach(ability => {
				let ab = document.createElement('img');
				ab.setAttribute('src', `https://s3.amazonaws.com/steemmonsters/website/abilities/ability_${ability.toLowerCase().replace(' ', '-')}.png`);
				ab.setAttribute('class', 'sl-ability-img');
				ab.setAttribute('title', ability);
				abilities.append(ab);
			});

			stats_container.appendChild(abilities);
		}

    rel_container.appendChild(stats_container);
    element.appendChild(rel_container);
    return element;
  }

  render_stat(container, stat, is_second) {
		if(this.stats[stat] == 0) 
			return;

    let stat_element = document.createElement('div');
    stat_element.setAttribute('class', `sl-stat-${stat} ${is_second ? 'sl-second-attack' : ''}`);

    let img = document.createElement('img');
    img.setAttribute('src', `https://s3.amazonaws.com/steemmonsters/website/stats/${stat}.png`);
    stat_element.appendChild(img);

    let text = document.createElement('div');
    text.setAttribute('class', 'sl-stat-text');
    text.innerText = this.details.type == 'Summoner' && this.stats[stat] > 0 ? '+' + this.stats[stat] : this.stats[stat];
    stat_element.appendChild(text);
    
    container.appendChild(stat_element);
  }

  get_image_url() {
		return ((this.edition == 1 || this.edition == 3) ? BETA_CARD_URL : ALPHA_CARD_URL) +
			(this.skin ? this.skin + '/' : '') +
			encodeURIComponent(this.details.name) +
			(this.gold ? '_gold' : '') +
			'.png';
  }
}