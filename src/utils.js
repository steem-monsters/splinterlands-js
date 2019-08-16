if(!window.splinterlands)
	window.splinterlands = {};

window.splinterlands.utils = (function() {
  BETA_CARD_URL = 'https://s3.amazonaws.com/steemmonsters/cards_beta/';
  ALPHA_CARD_URL = 'https://s3.amazonaws.com/steemmonsters/cards_v2.2/';

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

	function get_summoner_level(rating_level, card) {
		var rarity = splinterlands.get_card_details(card.card_detail_id).rarity;
		var max_level = 10 - (rarity - 1) * 2;
		return Math.min(card.level, Math.max(Math.round(max_level / 4 * rating_level), 1));
	}

	function get_monster_level(rating_level, summoner_card, monster_card) {
		if(rating_level == 0)
			return 1;

		var summoner_rarity = splinterlands.get_card_details(summoner_card.card_detail_id).rarity;
		var monster_rarity = splinterlands.get_card_details(monster_card.card_detail_id).rarity;
		var summoner_level = get_summoner_level(rating_level, summoner_card);

		var monster_max = 10 - (monster_rarity - 1) * 2;
		var summoner_max = 10 - (summoner_rarity - 1) * 2;
		return Math.min(monster.level, Math.max(Math.round(monster_max / summoner_max * summoner_level), 1));
	}

	function get_ecr(capture_rate, last_reward_block) {
		return Math.min((isNaN(parseInt(capture_rate)) ? 10000 : capture_rate) + (splinterlands.get_settings().last_block - last_reward_block) * splinterlands.get_settings().dec.ecr_regen_rate, 10000);
	}

	function get_token(symbol) {
		return splinterlands.get_settings().supported_currencies.find(c => c.currency == symbol);
	}

	function format_tx_id(id) {
		if(!id.startsWith('sm_'))
			id = `sm_${id}`;

		// Add dev mode prefix if specified in settings
		if(splinterlands.get_settings().test_mode && !id.startsWith(splinterlands.get_settings().prefix))
			id = `${splinterlands.get_settings().prefix}${id}`;

		return id;
	}

	function format_tx_data(data) {
		if(!data)
			data = {};

		data.app = `steemmonsters/${splinterlands.get_settings().version}`;

		// Generate a random ID for this transaction so we can look it up later
		data.sm_id = randomStr(10);

		// Append the prefix to the app name if in test mode
		if(splinterlands.get_settings().test_mode)
			data.app = `${splinterlands.get_settings().prefix}${data.app}`;

		if(JSON.stringify(data).length > 2000)
			throw new Error('Max custom_json data length exceeded.');
		
		return data;
	}

	function popup_center(url, title, w, h) {
    // Fixes dual-screen position                         Most browsers      Firefox
    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

    var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    var left = ((width / 2) - (w / 2)) + dualScreenLeft;
    var top = ((height / 2) - (h / 2)) + dualScreenTop;
    var newWindow = window.open(url, title, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

    // Puts focus on the newWindow
    if (window.focus) {
        newWindow.focus();
    }

    return newWindow;
	}
	
	async function steem_engine_transfer(to, token, quantity, memo) {
		var transaction_data = {
			"contractName": "tokens",
			"contractAction": "transfer",
			"contractPayload": {
				"symbol": token,
				"to": to,
				"quantity": quantity + '',
				"memo": memo
			}
		};

		if(splinterlands.use_keychain()) {
			var result = await new Promise(resolve => steem_keychain.requestCustomJson(splinterlands.get_player().name, splinterlands.get_settings().ssc.chain_id, 'Active', JSON.stringify(transaction_data), 'Transfer Token: ' + token, r => resolve(r)));
			
      if(!result.success)
				return { success: false, error: result.error };
    } else {
			var url = 'https://steemconnect.com/sign/custom-json?';
			url += 'required_posting_auths=' + encodeURI('[]');
			url += '&required_auths=' + encodeURI('["' + splinterlands.get_player().name + '"]');
			url += '&id=' + splinterlands.get_settings().ssc.chain_id;
			url += '&json=' + encodeURI(JSON.stringify(transaction_data));

			popup_center(url, `${currency} Payment`, 500, 560);
		}

		return { success: true };
  }
  
  function get_edition_str(edition) {
    return ['Alpha', 'Beta', 'Promo', 'Reward'][edition];
	}
	
	function param(object) {
    var encodedString = '';
    for (var prop in object) {
        if (object.hasOwnProperty(prop)) {
            if (encodedString.length > 0) {
                encodedString += '&';
            }
            encodedString += encodeURI(prop + '=' + object[prop]);
        }
    }
    return encodedString;
	}

	function try_parse(json) {
		try {
			return JSON.parse(json);
		} catch(err) {
			console.log('Error trying to parse JSON: ' + json);
			return null;
		}
	}

	async function validate_acct_name(name) {
		let error = steem.utils.validateAccountName(name);

		if(error)
			return { available: false, error };

		let existing_account = await steem.api.getAccountsAsync([name]);

		if(existing_account && existing_account.length > 0)
			return { available: false, error: 'That account name is already taken.' };

		return { available: true };
	}

	function get_ability_image(ability, small) {
		return `https://s3.amazonaws.com/steemmonsters/website/abilities${small ? '/small' : ''}/ability_${ability.toLowerCase().replace(' ', '-')}.png`;
	}

	function get_stat_image(stat) {
		stat = stat.toLowerCase();

		if(stat == 'armor')
			stat = 'defense';

		if(['melee', 'ranged', 'magic'].includes(stat))
			return `https://s3.amazonaws.com/steemmonsters/website/stats/${stat}-attack.png`;
		else
			return `https://s3.amazonaws.com/steemmonsters/website/stats/${stat}.png`;
	}

	return { 
		randomStr, 
		timeout, 
		get_cur_block_num,
		get_summoner_level, 
		get_monster_level, 
		get_ecr, 
		get_token,
		format_tx_id,
		format_tx_data,
		popup_center,
    steem_engine_transfer,
		get_edition_str,
		param,
		try_parse,
		validate_acct_name,
		get_ability_image,
		get_stat_image
	 };
})();