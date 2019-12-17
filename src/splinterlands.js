var splinterlands = (function() {
	let _config = {};
	let _player = null;
	let _settings = {};
	let _cards = [];
	let _market = [];
	let _potions = [];
	let _use_keychain = false;
	let _transactions = {};
	let _collection = [];
	let _browser_id = null;
	let _session_id = null;
	let _match = null;

	async function init(config) { 
		_config = config;

		// Load the browser id and create a new session id
		_browser_id = localStorage.getItem('splinterlands:browser_id');
		_session_id = 'sid_' + splinterlands.utils.randomStr(20);

		// Create a new browser id if one is not already set
		if(!_browser_id) {
			_browser_id = 'bid_' + splinterlands.utils.randomStr(20);
			localStorage.setItem('splinterlands:browser_id', _browser_id);
		}

		// Load the game settings
		await load_settings();
		setInterval(load_settings, 60 * 1000);

		// Load the card details
		_cards = (await api('/cards/get_details')).map(c => new splinterlands.CardDetails(c));

		// Load market data
		await load_market();
	}

	function get_card_details(card_detail_id) { 
		return card_detail_id ? _cards.find(c => c.id == card_detail_id) : _cards;
	}

	function api(url, data) {
		return new Promise((resolve, reject) => {
			if (data == null || data == undefined) data = {};

			// Add a dummy timestamp parameter to prevent IE from caching the requests.
			data.v = new Date().getTime();

			if (_player) {
				data.token = _player.token;
				data.username = _player.name;
			}

			var xhr = new XMLHttpRequest();
			xhr.open('GET', _config.api_url + url + '?' + splinterlands.utils.param(data));
			xhr.onload = function() {
				if (xhr.status === 200)
					resolve(splinterlands.utils.try_parse(xhr.responseText));
				else
					reject('Request failed.  Returned status of ' + xhr.status);
			};
			xhr.send();
		});
	}

	async function log_event(event_name, data) {
		return await api('/players/event', {
			browser_id: _browser_id,
			session_id: _session_id,
			event_name: event_name,
			page: '',
			user_agent: window.navigator.userAgent,
			browser_language: window.navigator.language,
			site_language: localStorage.getItem('splinterlands:locale'),
			data: JSON.stringify(data)
		});
	}

	async function load_settings() {
		let response = await api('/settings');

		if(_settings.version && _settings.version != response.version) {
			// Dispatch new version event
			window.dispatchEvent(new CustomEvent('splinterlands:version_change', { detail: response.version }));
		}

		_settings = response;
	}

	function has_saved_login() {
		let username = localStorage.getItem('splinterlands:username');

		if(!username)
			return null;

		let key = localStorage.getItem('splinterlands:key');
		return { username, use_keychain: !key };
	}

	async function email_login(email, password) {
		// Make sure the email address is all lowercase
		email = email.toLowerCase();

		let params = { email };
		let password_key = steem.auth.getPrivateKeys(email, password).owner;

		// Sign the login request using the private key generated from the email and password combination
		params.ts = Date.now();
		params.sig = eosjs_ecc.sign(email + params.ts, password_key);

		let response = await api('/players/login_email', params);

		if(response.error)
			return response;

		return await login(response.username, response.posting_key);
	}

	async function login(username, key) {
		if(!username) {
			username = localStorage.getItem('splinterlands:username');
			key = localStorage.getItem('splinterlands:key');

			if(!username)
				return { success: false, error: 'Username not specified.' };
		}

		// Format the username properly
		username = username.toLowerCase().trim();
		if(username.startsWith('@')) 
			username = username.substr(1);

		// They are logging in with an email address
		if(username.includes('@'))
			return await email_login(username, key);

		// Use the keychain extension if no private key is specified for login
		_use_keychain = !key;

		if(_use_keychain && !window.steem_keychain)
			return { success: false, error: 'Missing private posting key.' };

		let params = { name: username, ref: localStorage.getItem('splinterlands:ref') };

		if(!_use_keychain) {
			if(key.startsWith('STM'))
				return { success: false, error: 'This appears to be a public key. You must use your private posting key to log in.' };

			// Check if this is a master password, if so try to generate the private key
			if (key && !steem.auth.isWif(key))
				key = steem.auth.getPrivateKeys(username, key, ['posting']).posting;

			// Check that the key is a valid private key.
			try { steem.auth.wifToPublic(key); }
			catch (err) { return { success: false, error: `Invalid password or private posting key for account @${username}` }; }

			// Sign the login request using the provided private key
			params.ts = Date.now();
			params.sig = eosjs_ecc.sign(username + params.ts, key);
		}

		// Get the encrypted access token from the server
		let response = await api('/players/login', params);

		if(!response || response.error)
			return { success: false, error: 'Login Error: ' + response.error };

		if(_use_keychain) {
			// Request that the keychain extension decrypt the token
			let keychain_response = await new Promise(resolve => steem_keychain.requestVerifyKey(username, response.token, 'Posting', r => resolve(r)));

			if(!keychain_response || !keychain_response.success)
				return { success: false, error: `The login attempt for account @${username} was unsuccessful.` };

			response.token = keychain_response.result.startsWith('#') ? keychain_response.result.substr(1) : keychain_response.result;
		}

		_player = new splinterlands.Player(response);

		localStorage.setItem('splinterlands:username', username);

		if(!_use_keychain)
			localStorage.setItem('splinterlands:key', key);

		// Start the websocket connection if one is specified
		if(_config.ws_url)
			splinterlands.socket.connect(_config.ws_url, _player.name, _player.token);

		// Load the player's card collection
		await load_collection();

		return _player;
	}
	
	async function reset_password(email) {
		return await api('/players/forgot_password', { email });
	}
  
  function logout() {
    localStorage.removeItem('splinterlands:username');
    localStorage.removeItem('splinterlands:key');
    _player = null;
    _collection = null;
		splinterlands.socket.close();
	}
	
	async function send_tx_wrapper(id, display_name, data, on_success) {
		return new Promise((resolve, reject) => {
			send_tx(id, display_name, data).then(async result => {
				// If there is any type of error, just return the result object
				if(!result || !result.trx_info || !result.trx_info.success || result.error)
					reject(result);
				else {
					try { resolve(await on_success(new splinterlands.Transaction(result.trx_info))); }
					catch (err) { reject(err); }
				}
			});
		});
	}

	async function send_tx(id, display_name, data, retries) {
		if(!retries) retries = 0;

		id = splinterlands.utils.format_tx_id(id);

		try { data = splinterlands.utils.format_tx_data(data); }
		catch(err) {
			log_event('tx_length_exceeded', { type: id });
			return { success: false, error: err.toString() };
		}

		let data_str = JSON.stringify(data);

		// Start waiting for the transaction to be picked up by the server immediately
		let check_tx_promise = check_tx(data.sm_id);

		let broadcast_promise = null;

		if(_use_keychain) {
			broadcast_promise = new Promise(resolve => steem_keychain.requestCustomJson(_player.name, id, 'Posting', data_str, display_name, response => {
				resolve({ 
					type: 'broadcast',
					success: response.success, 
					trx_id: response.success ? response.result.id : null,
					error: response.success ? null : ((typeof response.error == 'string') ? response.error : JSON.stringify(response.error))
				})
			}));
		} else {
			broadcast_promise = new Promise(resolve => steem.broadcast.customJson(localStorage.getItem('splinterlands:key'), [], [_player.name], id, data_str, (err, response) => {
				resolve({
					type: 'broadcast',
					success: (response && response.id),
					trx_id: (response && response.id) ? response.id : null,
					error: err ? JSON.stringify(err) : null
				});
			}));
		}

		let result = await Promise.race([check_tx_promise, broadcast_promise]);

		// Check if the transaction was broadcast and picked up by the server before we got the result from the broadcast back
		if(result.type != 'broadcast')
			return result;

		if(result.success) {
			// Wait for the transaction to be picked up by the server
			return await check_tx_promise;
		} else {
			clear_pending_tx(data.sm_id);

			if(result.error == 'user_cancel')
				return result;
			else if(result.error.indexOf('Please wait to transact') >= 0) {
				// The account is out of Resource Credits, request an SP delegation
				let delegation_result = await api('/players/delegation');

				if(delegation_result && delegation_result.success) {
					// If the delegation succeeded, retry the transaction after 3 seconds
					await splinterlands.utils.timeout(3000);
					return await send_tx(id, display_name, data, retries + 1);
				} else {
				 	log_event('delegation_request_failed', { operation: id, error: result.error });
					return "Oops, it looks like you don't have enough Resource Credits to transact on the Steem blockchain. Please contact us on Discord for help! Error: " + result.error;
				}
			} else if(retries < 2) {
				// Retry the transaction after 3 seconds
				await splinterlands.utils.timeout(3000);
				return await send_tx(id, display_name, data, retries + 1);
			} else {
				log_event('custom_json_failed', { response: JSON.stringify(result) });
				return result;
			}
		}
	}

	async function steem_payment(to, amount, currency, memo) {
		let token = splinterlands.utils.get_token(currency);

		switch(token.type) {
			case 'steem':
				if(_use_keychain) {
					var result = await new Promise(resolve => steem_keychain.requestTransfer(_player.name, to, parseFloat(amount).toFixed(3), memo, currency, response => resolve(response)));
					return !result.success ? { success: false, error: result.error } : result;
				} else {
					let sc_url = `https://v2.steemconnect.com/sign/transfer?to=${to}&amount=${parseFloat(amount).toFixed(3)}%20${currency}&memo=${encodeURIComponent(memo)}`;
					splinterlands.utils.popup_center(sc_url, `${currency} Payment`, 500, 560);
				}
				break;
			case 'steem_engine':
				var result = await splinterlands.utils.steem_engine_transfer(to, currency, amount, memo);
				return !result.success ? { success: false, error: result.error } : result;
			case 'internal':
				return await splinterlands.ops.token_transfer(to, amount, splinterlands.utils.tryParse(memo));
		}
	}

	function check_tx(sm_id, timeout) {
		return new Promise(resolve => {
			_transactions[sm_id] = { resolve: resolve };
			
			_transactions[sm_id].timeout = setTimeout(() => {
				if(_transactions[sm_id] && _transactions[sm_id].status != 'complete')
					resolve({ success: false, error: 'Your transaction could not be found. This may be an issue with the game server. Please try refreshing the site to see if the transaction went through.' });

				delete _transactions[sm_id];
			}, (timeout || 30) * 1000);
		});
	}

	function clear_pending_tx(sm_id) {
		let tx = _transactions[sm_id];

		if(tx) {
			clearTimeout(tx.timeout);
			delete _transactions[sm_id];
		}
	}

	async function load_collection(player) {
		if(!player && _player)
			player = _player.name;

		_collection = (await api(`/cards/collection/${player}`)).cards.map(c => new splinterlands.Card(c));
		_collection_grouped = null;
		return _collection;
	}

	async function load_market() {
		_market = await api('/market/for_sale_grouped');
		return _market;
	}

	async function get_potions() {
		if(_potions.length == 0)
			_potions = (await api('/purchases/items')).map(p => new splinterlands.Potion(p));

		return _potions;
	}

	async function load_market_cards(card_detail_id, gold, edition) {
		let cards = await api('/market/for_sale_by_card', { card_detail_id, gold, edition });
		cards = cards.map(c => new splinterlands.Card(c));
		return cards;
	}

	let _lore = {};
	async function load_card_lore(card_detail_id) {
		if(!_lore[card_detail_id])
			_lore[card_detail_id] = (await api('/cards/lore', { card_detail_id })).text;

		return _lore[card_detail_id];
	}

	let _collection_grouped = null;
	function group_collection(collection, id_only) {
		if(!collection && _collection_grouped && !id_only)
			return _collection_grouped;

		let save = !collection && !id_only;
			
		if(!collection)
			collection = _collection;

		let grouped = [];

		// Group the cards in the collection by card_detail_id, edition, and gold foil
		_cards.forEach(details => {
			if(id_only) {
				grouped.push(Object.assign({ card_detail_id: details.id, owned: collection.filter(o => o.card_detail_id == details.id) }, details));	 
			} else {
				details.available_editions.forEach(edition => {
          let reg_cards = collection.filter(o => o.card_detail_id == details.id && o.gold == false && o.edition == parseInt(edition));

          if(reg_cards.length > 0) {
            grouped.push(new splinterlands.Card(Object.assign({ owned: reg_cards }, reg_cards[0])));
          } else {
            grouped.push(new splinterlands.Card({
              gold: false,
              card_detail_id: details.id,
              edition: parseInt(edition),
              owned: reg_cards
            }));
          }

          let gold_cards = collection.filter(o => o.card_detail_id == details.id && o.gold == true && o.edition == parseInt(edition));

          if(gold_cards.length > 0) {
            grouped.push(new splinterlands.Card(Object.assign({ owned: gold_cards }, gold_cards[0])));
          } else {
            grouped.push(new splinterlands.Card({
              gold: true,
              card_detail_id: details.id,
              edition: parseInt(edition),
              owned: gold_cards
            }));
          }
				});
			}
		});

		if(save)
			_collection_grouped = grouped;

		return grouped;
	}

	function group_collection_by_card(card_detail_id) {
		return group_collection().filter(c => c.card_detail_id == card_detail_id);
	}

	function get_battle_summoners(match) {
		return group_collection(_collection, true).filter(d => d.type == 'Summoner' && d.owned.length > 0).map(d => {
			// Check if the splinter is inactive for this battle
			if(match.inactive.includes(d.color))
				return null;

			// Check if it's an allowed card
			if(['no_legendaries', 'no_legendary_summoners'].includes(match.allowed_cards) && d.rarity == 4)
				return null;

			// Check if it is allowed but the current ruleset
			if(match.ruleset.includes('Little League') && d.stats.mana > 4)
				return null;

			let card = d.owned.find(o => 
				(match.allowed_cards != 'gold_only' || o.gold) && 
				(match.allowed_cards != 'alpha_only' || o.edition == 0) &&
				(match.match_type != 'Ranked' || o.playable) && 
				(!o.delegated_to || o.delegated_to == _player.name));

			if(card) {
				card = Object.assign({}, card);
				card.level = splinterlands.utils.get_summoner_level(match.rating_level, card);
			}

			return card;
		}).filter(c => c);
	}

	function get_battle_monsters(match, summoner_card, ally_color) {
		let summoner_details = get_card_details(summoner_card.card_detail_id);

		return group_collection(_collection, true)
			.filter(d => d.type == 'Monster' && d.owned.length > 0 && (d.color == summoner_details.color || d.color == 'Gray' || (summoner_details.color == 'Gold' && d.color == ally_color)))
			.map(d => {
				// Check if it's an allowed card
				if((match.ruleset.includes('Lost Legendaries') || match.allowed_cards == 'no_legendaries') && d.rarity == 4)
					return;

				if(match.ruleset.includes('Rise of the Commons') && d.rarity > 2)
					return;

				if(match.ruleset.includes('Taking Sides') && d.color == 'Gray')
					return;

				if(match.ruleset.includes('Little League') && d.stats.mana[0] > 4)
					return;

				let card = d.owned.find(o => 
					(match.allowed_cards != 'gold_only' || o.gold) && 
					(match.allowed_cards != 'alpha_only' || o.edition == 0) &&
					(match.match_type != 'Ranked' || o.playable) && 
					(!o.delegated_to || o.delegated_to == _player.name));

				if(card) {
					card.capped_level = splinterlands.utils.get_monster_level(match.rating_level, summoner_card, card);

					if(match.ruleset.includes('Up Close & Personal') && d.stats.attack[card.capped_level - 1] == 0)
						return;

					if(match.ruleset.includes('Keep Your Distance') && d.stats.attack[card.capped_level - 1] > 0)
						return;

					if(match.ruleset.includes('Broken Arrows') && d.stats.ranged[card.capped_level - 1] > 0)
						return;
				}

				return card;
			}).filter(c => c);
	}

	async function create_account_email(username, email, password, subscribe) {
		// Make sure the email address is all lowercase
		email = email.toLowerCase();

		// Generate a key pair based on the email and password
		let password_pub_key = steem.auth.getPrivateKeys(email, password).ownerPubkey;

		let params = { 
			purchase_id: 'new-' + splinterlands.utils.randomStr(6),	// We need to set a purchase ID even though not making a purchase for backwards compatibility
			name: username, 
			email: email, 
			password_pub_key: password_pub_key,
			subscribe: subscribe,
			is_test: splinterlands.get_settings().test_acct_creation,
			ref: localStorage.getItem('ref')
		};

		let response = await api('/players/create_email', params);

		if(response && !response.error)
			return await email_login(email, password);

		return response;
	}

	async function redeem_promo_code(code, purchase_id) {
		let response = await api('/purchases/start_code', { code, purchase_id });

		if(!response || response.error)
			return response;

		// Wait for completion of the purchase
		return await check_tx(purchase_id);
	}

	async function check_promo_code(code) {
		return await api('/purchases/check_code', { code });
	}

	async function get_available_packs(edition) {
		try {
			let packs = (await api('/purchases/stats')).packs;
			return packs.find(p => p.edition == edition).available;
		} catch(err) { return 0; }
	}

	function set_match(match_data) {
		if(!match_data) {
			_match = null;
			return;
		}

		_match = _match ? _match.update(match_data) : new splinterlands.Match(match_data);
		return _match;
	}
	
	function wait_for_match() {
		return new Promise((resolve, reject) => {
			if(!_match) {
				reject({ error: 'Player is not currently looking for a match.', code: 'not_looking_for_match' });
				return;
			}

			// Player has already been matched with an opponent
			if(_match.status == 1) {
				resolve(_match);
				return;
			}

			_match.on_match = resolve;
			_match.on_timeout = reject;
		});
	}

	function wait_for_result() {
		return new Promise((resolve, reject) => {
			if(!_match) {
				reject({ error: 'Player is not currently in a match.', code: 'not_in_match' });
				return;
			}

			// The battle is already resolved
			if(_match.status == 2) {
				resolve(_match);
				return;
			}

			_match.on_result = resolve;
			_match.on_timeout = reject;
		});
	}

	async function battle_history(player, limit) {
		let response = await api('/battle/history2', { player, limit });
		
		if(response && response.battles)
			return response.battles.map(r => new splinterlands.Battle(r));

		return response;
	}

	async function get_leaderboard(season) {
		let leaderboard = await api('/players/leaderboard_with_player', { season });

		if(leaderboard.leaderboard)
			leaderboard.leaderboard = leaderboard.leaderboard.map(p => new splinterlands.Player(p));

		leaderboard.player = leaderboard.player ? new splinterlands.Player(leaderboard.player) : _player;
		return leaderboard;
	}

	return { 
		init, api, login, logout, send_tx, send_tx_wrapper, load_collection, group_collection, get_battle_summoners, get_battle_monsters, get_card_details, 
		log_event, load_market, steem_payment, has_saved_login, create_account_email, email_login, check_promo_code, redeem_promo_code, reset_password,
		load_market_cards, load_card_lore, group_collection_by_card, get_available_packs, get_potions, wait_for_match, wait_for_result, battle_history,
		get_leaderboard,
		get_config: () => _config,
		get_settings: () => _settings,
		get_player: () => _player,
		get_market: () => _market,
		get_collection: () => _collection,
		get_transaction: (sm_id) => _transactions[sm_id],
		use_keychain: () => _use_keychain,
		get_match: () => _match,
		set_match
	};
})();