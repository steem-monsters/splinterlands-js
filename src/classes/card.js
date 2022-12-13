splinterlands.Card = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);
    this.details = splinterlands.get_card_details(this.card_detail_id);
    
    if(!this.level)
			this.level = splinterlands.utils.get_level(this);
			
		if(!this.alpha_xp)
			this.alpha_xp = 0;
	}

	get bcx() {
		if(this._bcx)
			return this._bcx;

		this._bcx = (this.edition >= 4 || this.details.tier >= 4) ? this.xp : Math.floor(Math.max(this.gold ? this.xp / this.base_xp : (this.xp + this.base_xp) / this.base_xp, 1));
		return this._bcx;
	}

	get base_xp() {
		if(this._base_xp)
			return this._base_xp;

		let xp_property = (this.edition == 0 || (this.edition == 2 && this.card_detail_id < 100)) ? (this.gold ? 'gold_xp' : 'alpha_xp') : (this.gold ? 'beta_gold_xp' : 'beta_xp');
		this._base_xp = splinterlands.get_settings()[xp_property][this.details.rarity - 1];

		return this._base_xp;
	}
	
	get max_xp() { 
		if(this.edition >= 4 || this.details.tier >= 4) {
			let rates = splinterlands.get_settings()[this.gold ? 'combine_rates_gold' : 'combine_rates'][this.details.rarity - 1];
			return rates[rates.length - 1];
		} else
			return splinterlands.get_settings().xp_levels[this.details.rarity - 1][this.details.max_level - 2]; 
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

		if(this.edition >= 4 || this.details.tier >= 4) {
			let rates = splinterlands.get_settings()[this.gold ? 'combine_rates_gold' : 'combine_rates'][this.details.rarity - 1];

			this._next_level_progress = { 
				current: this.bcx - rates[this.level - 1] || 0, 
				total: rates[this.level] - rates[this.level - 1],
				progress: (this.bcx - rates[this.level - 1] || 0) / (rates[this.level] - rates[this.level - 1]) * 100
			};
		} else {
			let bcx = this.gold ? this.bcx : Math.max(this.bcx - 1, 0);
			let xp_levels = splinterlands.get_settings().xp_levels[this.details.rarity - 1];
			let next_lvl_bcx = Math.ceil(xp_levels[this.level - 1] / this.base_xp);
			let cur_lvl_bcx = this.level <= 1 ? 0 : Math.ceil(xp_levels[this.level - 2] / this.base_xp);

			this._next_level_progress = { 
				current: bcx - cur_lvl_bcx || 0, 
				total: next_lvl_bcx - cur_lvl_bcx, 
				progress: ((bcx - cur_lvl_bcx) || 0) / (next_lvl_bcx - cur_lvl_bcx) * 100
			};
		}

    return this._next_level_progress;
	}
	
	cards_to_level(level) {
		if(this.edition == 4 || this.details.tier >= 4) {
			let rates = splinterlands.get_settings()[this.gold ? 'combine_rates_gold' : 'combine_rates'][this.details.rarity - 1];
			let cards = rates[level - 1];
			return cards <= 0 ? 'N/A' : cards;
		} else {
			let gold_na = [3, 2, 2, 1];
			let xp_levels = splinterlands.get_settings().xp_levels[this.details.rarity - 1];

			return this.gold ? 
				(level <= gold_na[this.details.rarity - 1] ? 0 : Math.ceil(xp_levels[level - 2] / this.base_xp)) : 
				(level == 1 ? 1 : Math.ceil(xp_levels[level - 2] / this.base_xp) + 1);
		}
	}

	get dec() {	
		if(this._dec)
			return this._dec;

		let alpha_bcx = 0, alpha_dec = 0;
		let xp = Math.max(this.xp - this.alpha_xp, 0);
		let burn_rate = splinterlands.get_settings().dec[(this.edition >= 4 || this.details.tier >= 4) ? 'untamed_burn_rate' : 'burn_rate'][this.details.rarity - 1];
	
		if(this.alpha_xp) {
			let alpha_bcx_xp = splinterlands.get_settings()[this.gold ? 'gold_xp' : 'alpha_xp'][this.details.rarity - 1];
			alpha_bcx = Math.max(this.gold ? this.alpha_xp / alpha_bcx_xp : this.alpha_xp / alpha_bcx_xp, 1);
			alpha_dec = burn_rate * alpha_bcx * splinterlands.get_settings().dec.alpha_burn_bonus;
	
			if(this.gold)
				alpha_dec *= splinterlands.get_settings().dec.gold_burn_bonus;
		}
	
		let bcx = Math.max(this.gold ? xp / this.base_xp : (xp + this.base_xp) / this.base_xp, 1);
	
		if(this.edition >= 4 || this.details.tier >= 4)
			bcx = this.xp;

		if(this.alpha_xp)
			bcx--;
	
		let dec = burn_rate * bcx;
	
		if(this.gold) {
			const gold_burn_bonus_prop = (this.details.tier >= 7) ? 'gold_burn_bonus_2' : 'gold_burn_bonus';
			dec *= splinterlands.get_settings().dec[gold_burn_bonus_prop];
		}
			
		if(this.edition == 0)
			dec *= splinterlands.get_settings().dec.alpha_burn_bonus;
	
		if(this.edition == 2)
			dec *= splinterlands.get_settings().dec.promo_burn_bonus;
	
		let total_dec = dec + alpha_dec;
		
		// Give a bonus if burning a max level card
		if(this.xp >= this.max_xp)
			total_dec *= splinterlands.get_settings().dec.max_burn_bonus;

		// Tier 7 cards give half the DEC and CP
		if(this.details.tier >= 7) total_dec = total_dec / 2;
	
		this._dec = total_dec;
		return this._dec;
	}

	get playable() {
		// If it's listed for sale on the market it's not playable
		if(this.market_id && this.market_listing_status == 0)
			return false;

		// If it's delegated to another player it's not playable
		if(this.delegated_to && this.delegated_to != splinterlands.get_player().name)
			return false;

		return true;
	}

	// Is the card playable in ranked battles?
	get playable_ranked() {
		if(!this.playable)
			return false;

		return this.cooldown <= 0;
	}

	get transferrable() {
		return !this.market_id && !this.delegated_to;
	}

	get combinable() {
		return this.transferrable && this.level < this.max_level;
	}

	get stats() {
		if(this._stats && this._stats.level == this.level)
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
	
	get cooldown() {
		if(!this.last_transferred_date || !this.last_used_date)
			return 0;

		let cooldown_start = new Date(Date.now() - splinterlands.get_settings().transfer_cooldown_blocks * 3000);
		let last_transferred_date = new Date(this.last_transferred_date);
		let last_used_date = new Date(this.last_used_date);
		let different_last_used_player = this.delegated_to ? this.delegated_to != this.last_used_player : this.player != this.last_used_player;

		if(last_transferred_date > cooldown_start && last_used_date > cooldown_start && different_last_used_player) {
			let seconds_since_last_used = (Date.now() - last_used_date.getTime()) / 1000;
			return (splinterlands.get_settings().transfer_cooldown_blocks * 3) - seconds_since_last_used;
		}

		return 0;
	}

	get suggested_price() {
		let market_card = splinterlands.get_market().find(c => c.card_detail_id == this.details.id && c.gold == this.gold && c.edition == this.edition);
		return market_card ? (market_card.low_price_bcx * this.bcx).toFixed(2) : 'Not Available';
	}

  get is_alpha() { return this.edition == 0 || (this.edition == 2 && this.details.id < 100); }
  get max_level() { return this.details.max_level; }
  
  render(size) {
    let element = document.createElement('div');
    element.setAttribute('class', `sl-card sl-${size || 'med'} sl-${this.is_alpha ? 'alpha' : 'beta'} sl-foil-${this.gold ? 'gold' : 'reg'}`);
    element.setAttribute('card_id', this.uid);
    element.setAttribute('card_details_id', this.details.id);
    element.setAttribute('gold', this.gold);
    element.setAttribute('edition', this.edition);

    let img = document.createElement('img');
    img.setAttribute('src', this.image_url);
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
      name_bg_img.setAttribute('src', 'https://d36mxiodymuqjm.cloudfront.net/website/gold_name_bg.png');
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
    mana_img.setAttribute('src', 'https://d36mxiodymuqjm.cloudfront.net/website/stats/stat_bg_mana.png');
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
				ab.setAttribute('src', splinterlands.utils.get_ability_image(ability));
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
    img.setAttribute('src', `https://d36mxiodymuqjm.cloudfront.net/website/stats/${stat}.png`);
    stat_element.appendChild(img);

    let text = document.createElement('div');
    text.setAttribute('class', 'sl-stat-text');
    text.innerText = this.details.type == 'Summoner' && this.stats[stat] > 0 ? '+' + this.stats[stat] : this.stats[stat];
    stat_element.appendChild(text);
    
    container.appendChild(stat_element);
  }

  get image_url() {
		// Get proper Runi image
		if(this.card_detail_id === 505) {
			return `${RUNI_CARD_URL}cards/${this.uid}.jpg`
		} else {
			return CARD_URLS[this.edition] +
				(this.skin ? this.skin + '/' : '') +
				encodeURIComponent(this.details.name.replace(/'/g, '')) +
				(this.gold ? '_gold' : '') +
				((this.details.edition == 7 || this.details.tier == 7) ? '.jpg' : '.png');
		}
	}

	get image_url_battle() {
		return BATTLE_CARD_URLS[this.edition] +
			(this.skin ? this.skin + '/' : '') +
			encodeURIComponent(this.details.name.replace(/'/g, '')) +
			(this.gold ? '_gold' : '') +
			((this.details.edition == 7 || this.details.tier == 7) ? '.jpg' : '.png');;
	}

	get image_url_battle_mobile() {
		if(this.details.type == 'Summoner') {
			return SUMMONER_CARD_URL_MOBILE + 
				(this.team_num == 2 ? 'Right/' : 'Left/') + 
				encodeURIComponent(this.details.name.replace(/'/g, '')) + 
				((this.details.edition == 7 || this.details.tier == 7) ? '.jpg' : '.png');
		}

		let edition = (this.edition == 1 || this.edition == 3) ? 1 : 0;

		// Get proper Runi image
		if(this.card_detail_id === 505) {
			return `${RUNI_CARD_URL}battle-cards-mobile/${this.uid}.jpg`
		} else {
			return BATTLE_CARD_URLS_MOBILE[edition] +
				encodeURIComponent(this.details.name.replace(/'/g, '')) +
				(this.gold ? '_gold' : '') +
				((this.details.edition == 7 || this.details.tier == 7) ? '.jpg' : '.png');
		}
	}
	
	async lore() { return await splinterlands.load_card_lore(this.card_detail_id); }
	async market_cards() { return await splinterlands.Market.load_market_cards(this.card_detail_id, this.gold, this.edition); }

	static get_combine_result(cards) {
		// Filter out any cards that are uncombinable (max level or on the market/delegated)
		cards = cards.filter(c => c.combinable);

		if(cards.length < 2)
			return { error: 'Must choose two or more cards that are able to be combined.' };

		cards.sort((a, b) => b.xp - a.xp);
		let first_card = cards.shift();
		let gold = first_card.gold;
		let total = first_card.xp;
		let cards_to_combine = [];

		for(let i = 0; i < cards.length; i++) {
			let card = cards[i];
			cards_to_combine.push(card);
			total += card.xp;

			// Get the XP for each base card (gold cards start with XP so don't need to add XP for the base card)
			if(!gold && first_card.edition < 4 && card.details.tier < 4)
				total += (card.edition == 0 || (card.edition == 2 && card.details.id < 100)) ? splinterlands.get_settings().xp_levels[card.details.rarity - 1][0] : splinterlands.get_settings().beta_xp[card.details.rarity - 1];

			// Stop combining if we got to max level
			if(total >= card.max_xp)
				break;
		}

		return new splinterlands.Card({ 
			uid: first_card.uid, 
			card_detail_id: first_card.card_detail_id, 
			xp: total, 
			edition: first_card.edition, 
			gold: gold,
			count: cards_to_combine.length + 1
		});
	}

	get is_starter() { return this.uid && this.uid.startsWith('starter-'); }
}