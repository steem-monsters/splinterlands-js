if(!window.splinterlands)
	window.splinterlands = {};

window.splinterlands.socket = (function() {
	let _url = null;
	let _ws = null;
	let _ping_interval = null;
	let _session_id = null;

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

		purchase_complete: function(data) {
			let trx = splinterlands.get_transaction(data.uid);

			if(trx) {
				clearTimeout(trx.timeout);
				trx.resolve(data);
			} else
				window.dispatchEvent(new CustomEvent('splinterlands:purchase_complete', { detail: data }));
		},

		match_found: function(data) {
			let match = splinterlands.get_match();

			if(match && match.id == data.id) {
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
		}
	};

	return { connect, close };
})();