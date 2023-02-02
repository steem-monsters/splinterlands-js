if(!window.splinterlands)
	window.splinterlands = {};

window.splinterlands.socket = (function() {
	let _url = null;
	let _ws = null;
	let _ping_interval = null;
	let _session_id = null;
	let _connected = false;

	function connect(url, player, token, new_account) {
		// Make sure we don't already have an open connection
		if(_ws && _ws.readyState == 1)
			return;

		if(!_session_id)
			_session_id = splinterlands.utils.randomStr(10);

		_url = url;
		_ws = new WebSocket(_url);
		console.log('Opening socket connection...');

		_ws.onopen = function () {
			_connected = true;
			window.dispatchEvent(new CustomEvent('splinterlands:socket_connect', { detail: { url, player, new_account } }));

			if(new_account)
				send({ type: 'new_account', player: player, session_id: _session_id });
			else
				send({ type: 'auth', player: player, access_token: token, session_id: _session_id });
		};

		_ws.onmessage = on_message;
		_ws.onerror = on_error;
		_ws.onclose = on_close;

		if(_ping_interval)
			clearInterval(_ping_interval);

		_ping_interval = setInterval(ping, 60 * 1000);
	}

	function close() { _ws.close(); }

	function on_message(m) {
		console.log(m);

		var message = JSON.parse(m.data);

		if(message && message.server_time)
			splinterlands.set_server_time_offset(Date.now() - message.server_time);

		if(message.id && _message_handlers[message.id])
			_message_handlers[message.id](message.data);

		// Send acknowledgement if one is requested
		if(message.ack)
			send({ type: 'ack', msg_id: message.msg_id });
	}

	function on_error(e) {
		console.log('Socket error...');
		console.log(e);
	}

	function on_close(e) {
		console.log('Socket closed...');
		console.log(e);

		if(_connected) 
			window.dispatchEvent(new CustomEvent('splinterlands:socket_disconnect', { detail: { e } }));

		_connected = false;

		if(splinterlands.get_player())
			setTimeout(() => connect(_url, splinterlands.get_player().name, splinterlands.get_player().token), 1000);
	}

	function send(message) { _ws.send(JSON.stringify(message)); }
	function ping() { send({ type: 'ping' }); }

	let _message_handlers = {
		transaction_complete: function(data) {
			let trx = splinterlands.get_transaction(data.sm_id);

			if(trx) {
				clearTimeout(trx.timeout);
				trx.resolve(data);
			}
		},

		purchase_complete: async function(data) {
			let trx = splinterlands.get_transaction(data.uid);

			if(trx) {
				clearTimeout(trx.timeout);
				trx.resolve(data);
			} else {
				if(data.type == 'starter_pack') {
					splinterlands.get_player().starter_pack_purchase = true;

					splinterlands.utils.loadScript("https://platform.twitter.com/oct.js", () => {
						twttr.conversion.trackPid('o4d35', { tw_sale_amount: 10, tw_order_quantity: 1 });
					});

					let womplay_id = await splinterlands.get_player().get_womplay_id();
					if(womplay_id) {
						await splinterlands.ec_api("/womplay/tracking", { womplay_id, event_name: "purchased_spellbook"  });				
					}					
				}

				if(data.type == 'booster_pack') {
					let womplay_id = await splinterlands.get_player().get_womplay_id();
					if(womplay_id) {
						await splinterlands.ec_api("/womplay/tracking", { womplay_id, event_name: "purchased_booster_pack"  });				
					}			
				}

				window.dispatchEvent(new CustomEvent('splinterlands:purchase_complete', { detail: data }));
			}
		},

		match_found: function(data) {
			let match = splinterlands.get_match();

			//(match.id == data.opponent) check is for challenges 
			if(match && (match.id == data.id || match.id == data.opponent)) {
				match = splinterlands.set_match(data);

				if(match.on_match)
					match.on_match(match);
			}
		},

		battle_cancelled: function(data) {
			let match = splinterlands.get_match();

			if(match && match.id == data.id) {
				if(match.on_timeout)
					match.on_timeout({ error: 'Neither player submitted a team in the allotted time so the match has been cancelled.', code: 'match_cancelled' });
					
				splinterlands.set_match(null);
			}
		},

		match_not_found: function(data) {
			let match = splinterlands.get_match();

			if(match && match.id == data.id) {
				if(match.on_timeout)
					match.on_timeout({ error: 'No suitable opponent could be found, please try again.', code: 'match_not_found' });

				splinterlands.set_match(null);
			}
		},

		battle_result: async function(data) {
			let match = splinterlands.get_match();

			let player = splinterlands.get_player(); 
			if(player.battles == 0) {
				let womplay_id = await player.get_womplay_id();
				if(womplay_id) {
					await splinterlands.ec_api("/womplay/tracking", { womplay_id, event_name: "completed_first_battle"  });				
				}
			}

			if(match && match.id == data.id) {
				if(match.on_result)
					match.on_result(await splinterlands.Battle.load(data.id))

				splinterlands.set_match(null);
			}
		},

		opponent_submit_team: function(data) {
			let match = splinterlands.get_match();

			if(match && match.id == data.id) {
				match = splinterlands.set_match(data);

				if(match.on_opponent_submit)
					match.on_opponent_submit(match);
			}
		},

		guild_chat: function(data) {
			if(data.player_info) {
				data.player = new splinterlands.Player(data.player_info);
				delete data['player_info'];
			}

			window.dispatchEvent(new CustomEvent('splinterlands:chat_message', { detail: Object.assign({ type: 'guild' }, data) }));
		},

		guild_update: function(data) {
			window.dispatchEvent(new CustomEvent('splinterlands:guild_update', { detail: data }));
		},

		global_chat: function(data) {
			if(data.player_info) {
				data.player = new splinterlands.Player(data.player_info);
				delete data['player_info'];
			}
			
			window.dispatchEvent(new CustomEvent('splinterlands:chat_message', { detail: Object.assign({ type: 'global' }, data) }));
		},

		balance_update: function(data) {
			let balance = splinterlands.get_player().balances.find(b => b.token == data.token);

			// Update the balance record for the current player
			if(balance)
				balance.balance = parseFloat(data.balance_end);
			else
				splinterlands.get_player().balances.push({ player: data.player, token: data.token, balance: parseFloat(data.balance_end) });

			// Emit a balance_update event
			window.dispatchEvent(new CustomEvent('splinterlands:balance_update', { detail: data }));
		},

		rating_update: function(data) {
			if(!data.wild) {
				splinterlands.get_player().update_modern_rating(data.modern.new_rating, data.modern.new_league);
			} else {
				splinterlands.get_player().update_rating(data.wild.new_rating, data.wild.new_league);
			} 

			if(data.new_collection_power !== undefined && splinterlands.get_player().collection_power != data.new_collection_power) {
				splinterlands.get_player().collection_power = data.new_collection_power;
				splinterlands.get_player().has_collection_power_changed = true;
			}

			if (data.additional_season_rshares) {
				if (splinterlands.get_player().current_season_player && splinterlands.get_player().current_season_player.rshares !== undefined) {
					splinterlands.get_player().current_season_player.rshares += data.additional_season_rshares;
				}
				splinterlands.set_additional_season_rshares_count(splinterlands.additional_season_rshares_count() + data.additional_season_rshares);
			}

			// Emit a rating_update event
			window.dispatchEvent(new CustomEvent('splinterlands:rating_update', { detail: data }));
		},

		quest_progress: function(data) {
			splinterlands.get_player().quest = new splinterlands.Quest(data);
			window.dispatchEvent(new CustomEvent('splinterlands:quest_progress', { detail: splinterlands.get_player().quest }));
		},

		received_gifts: function(data) {
			window.dispatchEvent(new CustomEvent('splinterlands:received_gifts', { detail: data }));
		},

		system_message: function(data) {
			window.dispatchEvent(new CustomEvent('splinterlands:system_message', { detail: data }));
		},

		challenge: function(data) {
			data.data = JSON.parse(data.data);
			console.log("Challenge: ", data);

			window.dispatchEvent(new CustomEvent('splinterlands:challenge', { detail: data }));
		},

		challenge_declined: function(data) {
			console.log("challenge_declined: ", data)
			window.dispatchEvent(new CustomEvent('splinterlands:challenge_declined', { detail: data }));
		}
	};

	return { connect, close, send };
})();