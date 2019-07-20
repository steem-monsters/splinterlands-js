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

	async function convert_cards(card_ids) {
		return await splinterlands.send_tx('convert_cards', 'Convert to Beta', { cards: card_ids });
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

	async function submit_team(trx_id, summoner, monsters, match_type, secret) {
		let team_hash = md5(`${summoner},${monsters.join()},${secret}`);
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

	async function team_reveal(trx_id, summoner, monsters, secret) {
		return await splinterlands.send_tx('team_reveal', 'Team Reveal', { trx_id, summoner, monsters, secret });
	}

	async function cancel_match() {
		return await splinterlands.send_tx('cancel_match', 'Cancel Match');
	}

	async function surrender(battle_queue_id) {
		return await splinterlands.send_tx('surrender', 'Surrender', { battle_queue_id });
	}

	async function claim_quest_rewards(quest_id) {
		return await splinterlands.send_tx('claim_reward', 'Claim Reward', { type: 'quest', quest_id });
	}

	async function claim_season_rewards(season) {
		return await splinterlands.send_tx('claim_reward', 'Claim Reward', { type: 'league_season', season });
	}

	async function start_quest() {
		return await splinterlands.send_tx('start_quest', 'Start Quest', { type: 'daily' });
	}

	async function refresh_quest() {
		return await splinterlands.send_tx('refresh_quest', 'New Quest', { type: 'daily' });
	}

	async function accept_challenge(id) {
		return await splinterlands.send_tx('accept_challenge', 'Accept Challenge', { id });
	}

	async function decline_challenge(id) {
		return await splinterlands.send_tx('decline_challenge', 'Decline Challenge', { id });
	}

	return {
		combine_cards,
		combine_all,
		convert_cards,
		burn_cards,
		add_wallet,
		gift_cards,
		token_transfer,
		sell_cards,
		cancel_sell,
		find_match,
		submit_team,
		team_reveal,
		cancel_match,
		surrender,
		claim_quest_rewards,
		claim_season_rewards,
		start_quest,
		refresh_quest,
		accept_challenge,
		decline_challenge
	};
})();