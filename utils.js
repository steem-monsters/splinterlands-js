if(!window.splinterlands)
	window.splinterlands = {};

window.splinterlands.utils = (function() {
	function randomStr(length) {
    var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
	}

	function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

	function get_cur_block_num() {
		return Math.max(Math.floor((Date.now() - splinterlands.get_settings().timestamp) / 3000), 0) + splinterlands.get_settings().last_block;
	}

	function is_playable(card) {
		if(card.market_id)
			return false;

		if(!card.last_transferred_block || !card.last_used_block)
			return true;

		var cooldown_expiration = get_cur_block_num() - splinterlands.get_settings().transfer_cooldown_blocks;
		return card.last_transferred_block <= cooldown_expiration || card.last_used_block <= cooldown_expiration;
	}

	function get_league(rating) {
		if(rating < 100)
			return 0;

		if(rating >= 4700)
			return 15;

		if(rating >= 4200)
			return 14;

		if(rating >= 3700)
			return 13;

		return Math.min(parseInt((rating - 100) / 300) + 1, 15);
	}

	function get_league_level(rating) {
		return Math.max(Math.min(Math.floor((get_league(rating) - 1) / 3) + 1, 4), 0);
	}

	function get_league_name(rating) {
		var num = get_league(rating);

		var name = num < 4 ? 'Bronze' : (num < 7 ? 'Silver' : (num < 10 ? 'Gold' : (num < 13 ? 'Diamond' : 'Champion')));
		var tier = (num - 1) % 3;
		return name + ' ' + (tier == 0 ? 'III' : (tier == 1 ? 'II' : 'I'));
	}

	function get_summoner_level(rating_level, card) {
		var rarity = splinterlands.get_card(card.card_detail_id).rarity;
		var max_level = 10 - (rarity - 1) * 2;
		return Math.min(card.level, Math.max(Math.round(max_level / 4 * rating_level), 1));
	}

	function get_monster_level(rating_level, summoner_card, monster_card) {
		if(rating_level == 0)
			return 1;

		var summoner_rarity = splinterlands.get_card(summoner_card.card_detail_id).rarity;
		var monster_rarity = splinterlands.get_card(monster_card.card_detail_id).rarity;
		var summoner_level = get_summoner_level(rating_level, summoner_card);

		var monster_max = 10 - (monster_rarity - 1) * 2;
		var summoner_max = 10 - (summoner_rarity - 1) * 2;
		return Math.min(monster.level, Math.max(Math.round(monster_max / summoner_max * summoner_level), 1));
	}

	function get_bcx(card) {
		var details = splinterlands.get_card(card.card_detail_id);
		var xp_property = (card.edition == 0 || (card.edition == 2 && card.card_detail_id < 100)) ? (card.gold ? 'gold_xp' : 'alpha_xp') : (card.gold ? 'beta_gold_xp' : 'beta_xp');
		var bcx_xp = splinterlands.get_settings()[xp_property][details.rarity - 1];

		return Math.max(card.gold ? card.xp / bcx_xp : (card.xp + bcx_xp) / bcx_xp, 1);
	}

	function get_dec(card) {
		var details = splinterlands.get_card(card.card_detail_id);
	
		var alpha_bcx = 0, alpha_dec = 0;
		var xp = Math.max(card.xp - card.alpha_xp, 0);
	
		if(card.alpha_xp) {
			var alpha_bcx_xp = splinterlands.get_settings()[card.gold ? 'gold_xp' : 'alpha_xp'][details.rarity - 1];
			alpha_bcx = Math.max(card.gold ? card.alpha_xp / alpha_bcx_xp : card.alpha_xp / alpha_bcx_xp, 1);
			alpha_dec = splinterlands.get_settings().dec.burn_rate[details.rarity - 1] * alpha_bcx * splinterlands.get_settings().dec.alpha_burn_bonus;
	
			if(card.gold)
				alpha_dec *= splinterlands.get_settings().dec.gold_burn_bonus;
		}
	
		var xp_property = (card.edition == 0 || (card.edition == 2 && details.id < 100)) ? (card.gold ? 'gold_xp' : 'alpha_xp') : (card.gold ? 'beta_gold_xp' : 'beta_xp');
		var bcx_xp = splinterlands.get_settings()[xp_property][details.rarity - 1];
	
		var bcx = Math.max(card.gold ? xp / bcx_xp : (xp + bcx_xp) / bcx_xp, 1);
	
		if(card.alpha_xp)
			bcx--;
	
		var dec = splinterlands.get_settings().dec.burn_rate[details.rarity - 1] * bcx;
	
		if(card.gold)
			dec *= splinterlands.get_settings().dec.gold_burn_bonus;
	
		if(card.edition == 0)
			dec *= splinterlands.get_settings().dec.alpha_burn_bonus;
	
		if(card.edition == 2)
			dec *= splinterlands.get_settings().dec.promo_burn_bonus;
	
		var total_dec = dec + alpha_dec;
		
		// Give a bonus if burning a max level card
		if(card.xp >= splinterlands.get_settings().xp_levels[details.rarity - 1][splinterlands.get_settings().xp_levels[details.rarity - 1].length - 1])
			total_dec *= splinterlands.get_settings().dec.max_burn_bonus;
	
		return total_dec;
	}

	function get_ecr(capture_rate, last_reward_block) {
		return Math.min((isNaN(parseInt(capture_rate)) ? 10000 : capture_rate) + (splinterlands.get_settings().last_block - last_reward_block) * splinterlands.get_settings().dec.ecr_regen_rate, 10000);
	}

	return { randomStr, timeout, get_cur_block_num, is_playable, get_league, get_league_level, get_league_name, get_summoner_level, get_monster_level, get_bcx, get_dec, get_ecr };
})();