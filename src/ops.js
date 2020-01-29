if(!window.splinterlands)
	window.splinterlands = {};

window.splinterlands.ops = (function() {
	async function combine_cards(card_ids) {
		return splinterlands.send_tx_wrapper('combine_cards', 'Combine Cards', { cards: card_ids }, async tx => {
			await splinterlands.load_collection();
			return tx.result;
		});
	}

	async function combine_all(card_detail_id, gold, edition) {
		return splinterlands.send_tx_wrapper('combine_all', 'Combine Cards', { card_detail_id, gold, edition }, async tx => {
			await splinterlands.load_collection();
			return tx.result;
		});
	}

	async function burn_cards(card_ids) {
		return splinterlands.send_tx_wrapper('burn_cards', 'Convert to DEC', { cards: card_ids }, async tx => {
			await splinterlands.load_collection();
			return tx.result;
		});
	}

	async function convert_cards(card_ids) {
		return await splinterlands.send_tx('convert_cards', 'Convert to Beta', { cards: card_ids });
	}

	async function add_wallet(type, address) {
		return await splinterlands.send_tx('add_wallet', 'Link External Wallet', { type, address });
	}

	async function gift_cards(card_ids, to) {
		return splinterlands.send_tx_wrapper('gift_cards', 'Transfer Cards', { cards: card_ids, to }, async tx => {
			await splinterlands.get_player().load_balances();
			return tx.result;
		});
	}

	async function send_packs(edition, qty, to) {
		return splinterlands.send_tx_wrapper('gift_packs', 'Transfer Packs', { edition, qty, to }, async tx => {
			await splinterlands.load_collection();
			return tx.result;
		});
	}

	async function delegate_cards(card_ids, to) {
		return splinterlands.send_tx_wrapper('delegate_cards', 'Delegate Cards', { cards: card_ids, to }, async tx => {
			await splinterlands.load_collection();
			return tx.result;
		});
	}

	async function token_transfer(to, qty, data) {
		var obj = { to, qty, token: 'DEC' };

		if(data && typeof data == 'object')
			obj = Object.assign(obj, data);

		return await splinterlands.send_tx('token_transfer', 'Transfer DEC', obj);
	}

	async function sell_cards(card_ids, price) {
		return await splinterlands.send_tx_wrapper('sell_cards', 'Sell Cards', { cards: card_ids, price, currency: 'USD', fee_pct: splinterlands.get_settings().market_fee }, async tx => {
			await splinterlands.load_collection();
			return tx.result;
		});
	}

	async function cancel_sell(market_id) {
		return await splinterlands.send_tx('cancel_sell', 'Cancel Market Sale', { trx_ids: [market_id] });
	}

	async function find_match(match_type, opponent, settings) {
		return splinterlands.send_tx_wrapper('find_match', 'Find Match', { match_type, opponent, settings }, tx => {
			splinterlands.set_match({ id: tx.id, status: 0 });
		});
	}

	async function submit_team(match, summoner, monsters, secret) {
		if(!secret)
			secret = splinterlands.utils.randomStr(10);

		let data = { trx_id: match.id, team_hash: md5(`${summoner},${monsters.join()},${secret}`) };

		// If it's not a tournament battle, submit and reveal the team together unless the player specifies otherwise
		let submit_and_reveal = ['Practice', 'Ranked'].includes(match.match_type) && !splinterlands.get_player().settings.submit_hashed_team;

		if(submit_and_reveal) {
			data.summoner = summoner;
			data.monsters = monsters;
			data.secret = secret;
		}

		return splinterlands.send_tx_wrapper('submit_team', 'Submit Team', data, async tx => {
			if(!submit_and_reveal) {
				let cur_match = splinterlands.get_match();

				if(cur_match && cur_match.id == match.id) {
					// If the opponent already submitted their team, then we can reveal ours
					if(cur_match.opponent_team_hash)
						return await splinterlands.ops.team_reveal(cur_match.id, summoner, monsters, secret);

					// If the opponent has not submitted their team, then queue up the team reveal operation for when they do
					cur_match.on_opponent_submit = async () => await splinterlands.ops.team_reveal(cur_match.id, summoner, monsters, secret);
				}
			}
			
			return tx;
		});
	}

	async function team_reveal(trx_id, summoner, monsters, secret) {
		return splinterlands.send_tx_wrapper('team_reveal', 'Team Reveal', { trx_id, summoner, monsters, secret }, r => r);
	}

	async function cancel_match() {
		return splinterlands.send_tx_wrapper('cancel_match', 'Cancel Match', null, r => r);
	}

	async function surrender(battle_queue_id) {
		return splinterlands.send_tx_wrapper('surrender', 'Surrender', { battle_queue_id }, r => r);
	}

	async function claim_season_rewards(season) {
		return splinterlands.send_tx_wrapper('claim_reward', 'Claim Reward', { type: 'league_season', season }, tx => tx.result.cards.map(c => new splinterlands.Card(c)));

		// TODO: Update player's card collection?
	}

	async function claim_quest_rewards(quest_id) {
		return splinterlands.send_tx_wrapper('claim_reward', 'Claim Reward', { type: 'quest', quest_id }, async tx => {
			// TODO: Update player's card collection?

			// Update current player's quest info
			let quests = await splinterlands.api('/players/quests');

			if(quests && quests.length > 0)
				splinterlands.get_player().quest = new splinterlands.Quest(quests[0]);

			return { 
				cards: tx.result.cards.map(c => new splinterlands.Card(c)), 
				quest: splinterlands.get_player().quest 
			};
		});
	}

	async function start_quest() {
		return splinterlands.send_tx_wrapper('start_quest', 'Start Quest', { type: 'daily' }, tx => {
			let new_quest = new splinterlands.Quest(tx.result);
			splinterlands.get_player().quest = new_quest;
			return new_quest
		});
	}

	async function refresh_quest() {
		return splinterlands.send_tx_wrapper('refresh_quest', 'New Quest', { type: 'daily' }, tx => {
			let new_quest = new splinterlands.Quest(tx.result);
			splinterlands.get_player().quest = new_quest;
			return new_quest;
		});
	}

	async function accept_challenge(id) {
		return await splinterlands.send_tx('accept_challenge', 'Accept Challenge', { id });
	}

	async function decline_challenge(id) {
		return await splinterlands.send_tx('decline_challenge', 'Decline Challenge', { id });
	}

	async function open_pack(edition) {
		return splinterlands.send_tx_wrapper('open_pack', 'Open Pack', { edition }, tx => tx.result.cards.map(c => new splinterlands.Card(c)));
	}

	async function open_multi(edition, qty) {
		return await splinterlands.send_tx('open_all', 'Open Multiple Packs', { edition, qty });
	}

	return {
		combine_cards,
		combine_all,
		convert_cards,
		burn_cards,
		add_wallet,
		gift_cards,
		send_packs,
		delegate_cards,
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
		decline_challenge,
		open_pack,
		open_multi
	};
})();