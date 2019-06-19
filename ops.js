if(!window.splinterlands)
	window.splinterlands = {};

window.splinterlands.ops = (function() {
	async function combine_cards(card_ids) {
		return await splinterlands.send_tx('combine_cards', 'Combine Cards', { cards: card_ids });
	}

	async function combine_all(card_detail_id, gold, edition) {
		return await splinterlands.send_tx('combine_all', 'Combine Cards', { card_detail_id, gold, edition });
	}

	async function burn_cards(card_ids) {
		return await splinterlands.send_tx('burn_cards', 'Convert to DEC', { cards: card_ids });
	}

	async function add_wallet(type, address) {
		return await splinterlands.send_tx('add_wallet', 'Link External Wallet', { type, address });
	}

	async function gift_cards(card_ids, to) {
		return await splinterlands.send_tx('gift_cards', 'Transfer Cards', { cards: card_ids, to });
	}

	async function token_transfer(to, qty, data) {
		var obj = { to, qty, token: 'DEC' };

		if(data && typeof data == 'object')
			obj = Object.assign(obj, data);

		return await splinterlands.send_tx('token_transfer', 'Transfer DEC', obj);
	}

	async function sell_cards(card_ids, price) {
		return await splinterlands.send_tx('sell_cards', 'Sell Cards', { cards: card_ids, price, currency: 'USD', fee_pct: splinterlands.get_settings().market_fee });
	}

	async function cancel_sell(market_id) {
		return await splinterlands.send_tx('cancel_sell', 'Cancel Market Sale', { trx_ids: [market_id] });
	}

	async function find_match(match_type, opponent, settings) {
		// Check if they have purchased the starter set if they are looking for a ranked battle
		if(match_type == 'Ranked' && !splinterlands.get_player().starter_pack_purchase)
			return { error: 'You must purchase the Starter Set in order to play ranked battles.' };

		return await splinterlands.send_tx('find_match', 'Find Match', { match_type, opponent, settings });
	}

	async function submit_team(trx_id, summoner, monsters, match_type) {
		let secret = splinterlands.utils.randomStr(10);
		let team_hash = md5(`${summoner},${monsters.join()},${secret}`);
		let team = { summoner: summoner, monsters: monsters, secret: secret };

		let data = { trx_id, team_hash };

		// If it's not a tournament battle, submit and reveal the team together unless the player specifies otherwise
		let submit_and_reveal = (match_type == 'Practice' || match_type == 'Ranked') && !splinterlands.get_player().settings.submit_hashed_team;

		if(submit_and_reveal) {
			data.summoner = summoner;
			data.monsters = monsters;
			data.secret = secret;
		}

		return await splinterlands.send_tx('submit_team', 'Submit Team', data);
	}

	return {
		combine_cards,
		combine_all,
		burn_cards,
		add_wallet,
		gift_cards,
		token_transfer,
		sell_cards,
		cancel_sell,
		find_match,
		submit_team
	};
})();