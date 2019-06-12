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

	function can_play_card(card) {
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
		return Math.max(Math.min(Math.floor((get_league(rating) - 1) / 3) + 1, 4), 1);
	}

	function get_league_name(rating) {
		var num = get_league(rating);

		var name = num < 4 ? 'Bronze' : (num < 7 ? 'Silver' : (num < 10 ? 'Gold' : (num < 13 ? 'Diamond' : 'Champion')));
		var tier = (num - 1) % 3;
		return name + ' ' + (tier == 0 ? 'III' : (tier == 1 ? 'II' : 'I'));
	}

	return { randomStr, timeout, get_cur_block_num, can_play_card, get_league, get_league_level, get_league_name };
})();