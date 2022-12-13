if(!window.splinterlands)
	window.splinterlands = {};

window.splinterlands.ops = (function() {
	async function combine_cards(card_ids) {
		return splinterlands.send_tx_wrapper('combine_cards', 'Combine Cards', { cards: card_ids }, async tx => {
			splinterlands.get_player().has_collection_power_changed = true;
			await splinterlands.load_collection();
			return tx.result;
		});
	}

	async function combine_all(card_detail_id, gold, edition) {
		return splinterlands.send_tx_wrapper('combine_all', 'Combine Cards', { card_detail_id, gold, edition }, async tx => {
			splinterlands.get_player().has_collection_power_changed = true;
			await splinterlands.load_collection();
			return tx.result;
		});
	}

	async function burn_cards(card_ids) {
		return splinterlands.send_tx_wrapper('burn_cards', 'Convert to DEC', { cards: card_ids }, async tx => {
			splinterlands.get_player().has_collection_power_changed = true;
			await splinterlands.load_collection();
			return tx.result;
		});
	}

	async function convert_cards(card_ids) {
		return splinterlands.send_tx_wrapper('convert_cards', 'Convert to Beta', { cards: card_ids }, tx => tx);
	}

	async function add_wallet(type, address) {
		return splinterlands.send_tx_wrapper('add_wallet', 'Link External Wallet', { type, address }, tx => tx);
	}

	async function gift_cards(card_ids, to) {
		return splinterlands.send_tx_wrapper('gift_cards', 'Transfer Cards', { cards: card_ids, to }, async tx => {
			splinterlands.get_player().has_collection_power_changed = true;
			await splinterlands.load_collection();
			return tx.result;
		});
	}

	async function send_packs(edition, qty, to) {
		return splinterlands.send_tx_wrapper('gift_packs', 'Transfer Packs', { edition, qty, to }, async tx => {
			await splinterlands.get_player().load_balances();
			return tx.result;
		});
	}

	async function delegate_cards(card_ids, to) {
		return splinterlands.send_tx_wrapper('delegate_cards', 'Delegate Cards', { cards: card_ids, to }, async tx => {
			await splinterlands.load_collection();
			return tx.result;
		});
	}

	async function undelegate_cards(card_ids) {
		return splinterlands.send_tx_wrapper('undelegate_cards', 'Delegate Cards', { cards: card_ids }, async tx => {
			await splinterlands.load_collection();
			return tx.result;
		});
	}

	async function cancel_cards_rental(market_item_id) {
		return splinterlands.send_tx_wrapper('market_cancel_rental', 'Cancel Rental', { items: [market_item_id] }, async tx => {
			await splinterlands.load_collection();
			return tx.result;
		});
	}

	async function market_purchase(market_ids, price, currency) {
		return splinterlands.send_tx_wrapper('market_purchase', 'Market Purchase', {  items: market_ids, price: price + 0.01, currency: currency.toUpperCase() }, async tx => {
			splinterlands.get_player().has_collection_power_changed = true;
			await splinterlands.load_collection();
			return tx.result;
		});
	}

	async function token_transfer(to, qty, data) {
		var obj = { to, qty, token: 'DEC' };

		if(data && typeof data == 'object')
			obj = Object.assign(obj, data);

		return splinterlands.send_tx_wrapper('token_transfer', 'Transfer DEC', obj, tx => tx);
	}

	async function sell_cards(card_ids, price) {
		return splinterlands.send_tx_wrapper('sell_cards', 'Sell Cards', { cards: card_ids, price, currency: 'USD', fee_pct: splinterlands.get_settings().market_fee }, async tx => {
			await splinterlands.load_collection();
			return tx.result;
		});
	}

	async function cancel_sell(market_id) {
		return splinterlands.send_tx_wrapper('cancel_sell', 'Cancel Market Sale', { trx_ids: [market_id] }, tx => tx);
	}

	async function find_match(match_type, opponent, settings) {
		return splinterlands.send_tx_wrapper('find_match', 'Find Match', { match_type, opponent, settings }, tx => {

			snapyr.track(
				"find_match",
				 {
					match_type: match_type,
					settings: settings
				 }
			);

			splinterlands.set_match({ id: tx.id, status: 0 });
		});
	}

	async function submit_team(match, summoner, monsters, secret) {
		if(!secret)
			secret = splinterlands.utils.randomStr(10);

		let data = { trx_id: match.id, team_hash: md5(`${summoner},${monsters.join()},${secret}`), summoner, monsters, secret };

		return splinterlands.send_tx_wrapper('submit_team', 'Submit Team', data, async tx => {
			let cur_match = splinterlands.get_match();

			if(cur_match && cur_match.id == match.id) {
				// // If the opponent already submitted their team, then we can reveal ours
				// if(cur_match.opponent_team_hash)
				// 	return await splinterlands.ops.team_reveal(cur_match.id, summoner, monsters, secret);

				// // If the opponent has not submitted their team, then queue up the team reveal operation for when they do
				// cur_match.on_opponent_submit = async () => await splinterlands.ops.team_reveal(cur_match.id, summoner, monsters, secret);

				// Save the team info locally in case the browser is refreshed or something and it needs to be resubmitted later
				localStorage.setItem(`splinterlands:${cur_match.id}`, JSON.stringify({ summoner, monsters, secret }));
			}

			return tx;
		});
	}

	async function team_reveal(trx_id, summoner, monsters, secret) {
		if(!summoner) {
			// If no summoner is specified, check if the team info is saved in local storage
			let saved_team = splinterlands.utils.try_parse(localStorage.getItem(`splinterlands:${trx_id}`));

			if(saved_team) {
				summoner = saved_team.summoner;
				monsters = saved_team.monsters;
				secret = saved_team.secret;
			}
		}

		return splinterlands.send_tx_wrapper('team_reveal', 'Team Reveal', { trx_id, summoner, monsters, secret }, r => {
			// Clear any team info saved in local storage after it is revealed
			localStorage.removeItem(`splinterlands:${trx_id}`)
			return r;
		});
	}

	async function cancel_match() {
		return splinterlands.send_tx_wrapper('cancel_match', 'Cancel Match', null, r => r);
	}

	async function surrender(battle_queue_id) {
		return splinterlands.send_tx_wrapper('surrender', 'Surrender', { battle_queue_id }, r => r);
	}

	async function claim_season_rewards(season) {
		return splinterlands.send_tx_wrapper('claim_reward', 'Claim Reward', { type: 'league_season', season }, async tx => {
			splinterlands.get_player().season_reward = null;
			await splinterlands.load_collection();

			// Mark reward as revealed
			await splinterlands.api('/players/rewards_revealed', { reward_tx_id: tx.id });

			// New reward system
			if(tx.result.rewards)
				return { rewards: tx.result.rewards.map(r => new splinterlands.RewardItem(r)) };
			else if(tx.result.cards)
				return { cards: tx.result.cards.map(c => new splinterlands.Card(c)) };
		});
	}

	async function claim_quest_rewards(quest_id, test) {
		if(test) {
			let ret_val = { cards: [], quest: splinterlands.get_player().quest };

			ret_val.rewards = _test_reward_data.rewards.map(r => new splinterlands.RewardItem(r));
			let card_rewards = _test_reward_data.rewards.filter(i => i.type == 'reward_card');

			if(card_rewards)
				ret_val.cards = card_rewards.map(c => new splinterlands.Card(c.card));

			return ret_val;
		}

		return splinterlands.send_tx_wrapper('claim_reward', 'Claim Reward', { type: 'quest', quest_id }, async tx => {
			await splinterlands.load_collection();

			// Update current player's quest info
			let quests = await splinterlands.api('/players/quests');

			if(quests && quests.length > 0)
				splinterlands.get_player().quest = new splinterlands.Quest(quests[0]);

			let ret_val = { cards: [], quest: splinterlands.get_player().quest };

			if(tx.result.rewards) {
				// New reward system
				ret_val.rewards = tx.result.rewards.map(r => new splinterlands.RewardItem(r));
				let card_rewards = tx.result.rewards.filter(i => i.type == 'reward_card');

				if(card_rewards)
					ret_val.cards = card_rewards.map(c => new splinterlands.Card(c.card));
			} else
				ret_val.cards = tx.result.cards.map(c => new splinterlands.Card(c))

			// Mark reward as revealed
			await splinterlands.api('/players/rewards_revealed', { reward_tx_id: tx.id });

			return ret_val;
		});
	}

	_test_reward_data = {
		"success": true,
		"rewards": [
			{
				"type": "potion",
				"quantity": 1,
				"potion_type": "gold"
			},
			{
				"type": "reward_card",
				"quantity": 1,
				"card": {
					"uid": "C3-218-MMSX4GJXLC",
					"card_detail_id": 218,
					"xp": 0,
					"gold": false,
					"edition": 3
				}
			},
			{
				"type": "reward_card",
				"quantity": 1,
				"card": {
					"uid": "C3-134-CQRELRWI40",
					"card_detail_id": 134,
					"xp": 0,
					"gold": false,
					"edition": 3
				}
			},
			{
				"type": "dec",
				"quantity": 11
			},
			{
				"type": "potion",
				"quantity": 1,
				"potion_type": "legendary"
			},
			{
				"type": "reward_card",
				"quantity": 1,
				"card": {
					"uid": "C3-231-G6LAY0NDXC",
					"card_detail_id": 231,
					"xp": 1,
					"gold": false,
					"edition": 3
				}
			},
			{
				"type": "potion",
				"quantity": 1,
				"potion_type": "gold"
			},
			{
				"type": "reward_card",
				"quantity": 1,
				"card": {
					"uid": "C3-93-AAZOMA7H3K",
					"card_detail_id": 93,
					"xp": 0,
					"gold": false,
					"edition": 3
				}
			},
			{
				"type": "reward_card",
				"quantity": 1,
				"card": {
					"uid": "C3-213-1ZKLYGKH28",
					"card_detail_id": 213,
					"xp": 0,
					"gold": false,
					"edition": 3
				}
			},
			{
				"type": "dec",
				"quantity": 12
			}
		],
		"potions": {
			"legendary": {
				"potion_type": "legendary",
				"charges": 0,
				"charges_used": 1,
				"charges_remaining": 0
			},
			"gold": null
		}
	};

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
		splinterlands.set_match({ id, status: 0 });
		return splinterlands.send_tx_wrapper('accept_challenge', 'Accept Challenge', { id }, tx => {
			console.log("accept_challenge tx: ", tx);
		});
	}

	async function decline_challenge(id) {
		return splinterlands.send_tx_wrapper('decline_challenge', 'Decline Challenge', { id }, tx => tx);
	}

	async function open_pack(edition) {
		return splinterlands.send_tx_wrapper('open_pack', 'Open Pack', { edition }, async tx => {
			await splinterlands.load_collection();
			return tx.result.cards.map(c => new splinterlands.Card(c));
		});
	}

	async function open_multi(edition, qty) {
		return splinterlands.send_tx_wrapper('open_all', 'Open Multiple Packs', { edition, qty }, async tx => {
			await splinterlands.load_collection();
			return tx;
		});
	}

	async function purchase(type, qty, currency, data, bonus_packs) {
		if(type.toLowerCase() == 'orb') {
			if(!currency || currency.toUpperCase() != 'DEC')
				return new Promise((resolve, reject) => reject({ error: 'Invalid currency specified. Essence Orbs may only be purchased with DEC.' }));

			return splinterlands.send_tx_wrapper('purchase_orbs', 'Purchase Essence Orbs', { qty }, tx => tx);
		}
		if(type.toLowerCase() == 'dice') {
			if(!currency || currency.toUpperCase() != 'DEC')
				return new Promise((resolve, reject) => reject({ error: 'Invalid currency specified. ΛZMΛRÉ Dice may only be purchased with DEC.' }));

			return splinterlands.send_tx_wrapper('purchase_dice', 'Purchase ΛZMΛRÉ Dice', { qty }, tx => tx);
		}

		return splinterlands.send_tx_wrapper('purchase', 'Purchase', { type, qty, currency, bonus: bonus_packs, data }, tx => tx);
	}

	async function fetch_transfer_out_fees(wallet, qty) {
		try	{
		const response = await fetch(`https://ec-api.splinterlands.com/bridge/estimateGas?token=dec&network=${wallet}&amount=${qty}`);
		const gas_data = await response.json();
		return gas_data;
		} catch (error) {
			return error;
		}
	}

	async function withdraw_crypto(qty, wallet, token) {
		let accounts = {
			tron: 'sm-dec-tron',
			ethereum: 'sl-eth',
			hive_engine: 'sl-hive',
			steem_engine: 'sl-steem',
			bsc: 'sl-bsc'
		}

		let player_wallet = null;
		if(['tron', 'ethereum', 'bsc'].some(type => type == wallet)) {
			player_wallet = await splinterlands.api('/players/wallets', { type: wallet });

			if(!player_wallet) {
				return new Promise((resolve, reject) => reject({ error: `Please link a ${wallet} wallet before withdrawing.` }));
			}

		} else {
			player_wallet = { address: splinterlands.get_player().name };
		}

		return splinterlands.send_tx_wrapper('token_transfer', `Withdraw ${token}`, { type: 'withdraw', to: accounts[wallet] || wallet, qty, token, memo: player_wallet.address }, tx => tx);
	}

	function init_hive_active_key(player, key) {
		if (!window.steem.auth.isWif(key)) {
			try {
				key = steem.auth.getPrivateKeys(player, key, ['active']).active;
			} catch (err) { return 'The key entered was not a valid private key or master password.' }
		}
		return key;
	}

	async function init_active_key_transaction(player, token, to, key, qty) {
		let accounts = {
			tron: 'sm-dec-tron',
			ethereum: 'sl-eth',
			hive_engine: 'sl-hive',
			steem_engine: 'sl-steem',
			bsc: 'sl-bsc'
		}
		const active_key = init_hive_active_key(player, key);
		const id = splinterlands.utils.format_tx_id('token_transfer');
		const result = await new Promise(async function (resolve, reject)  {
			await window.steem.broadcast.customJson( active_key, [player], [], id, JSON.stringify({
				type: 'withdraw',
				to: accounts[to] || to,
				qty,
				token,
				memo: player
			}), (error, res) => {
				resolve(res ? {res} : {error})
			});
		})
		return result
	}

	async function init_cards_transactions(key, player, transaction, data) {
		const active_key = init_hive_active_key(player, key);
		const id = splinterlands.utils.format_tx_id(transaction);
		const result = await new Promise(async function (resolve, reject)  {
			await window.steem.broadcast.customJson( active_key, [player], [], id, JSON.stringify(data), (error, res) => {
				resolve(res ? {res} : {error})
			});
		})
		if (transaction === 'burn_cards') {
			splinterlands.get_player().has_collection_power_changed = true;
		}
		await splinterlands.get_player().load_balances();
		await splinterlands.load_collection(player);

		return result;
	}

	async function guild_join(guild_id) {
		return splinterlands.send_tx_wrapper('join_guild', 'Join Guild', { guild_id }, async tx => {
			await splinterlands.get_player().refresh();
			return tx;
		});
	}

	async function guild_request_join(guild_id) {
		return splinterlands.send_tx_wrapper('join_guild', 'Request Join Guild', { guild_id }, async tx => {
			await splinterlands.get_player().refresh();
			return tx;
		});
	}

	async function guild_leave(guild_id) {
		return splinterlands.send_tx_wrapper('leave_guild', 'Leave Guild', { guild_id }, async tx => {
			delete splinterlands.get_player().guild;
			return tx;
		});
	}

	async function guild_create(name, motto, description, membership_type, language, banner, decal) {
		let guild_data = {
			name: name,
			motto: motto,
			description: description,
			membership_type: membership_type,
			language: language,
			banner: banner,
			decal: decal
		};

		return splinterlands.send_tx_wrapper('create_guild', 'Create Guild', guild_data, async tx => {
			await splinterlands.get_player().refresh();
			return tx;
		});
	}

	async function guild_update(guild_id, name, motto, description, membership_type, language, banner, decal) {
		let guild_data = {
			guild_id: guild_id,
			name: name,
			motto: motto,
			description: description,
			membership_type: membership_type,
			language: language,
			banner: banner,
			decal: decal
		};

		return splinterlands.send_tx_wrapper('edit_guild', 'Update Guild', guild_data, async tx => {
			await splinterlands.get_player().guild.refresh();
			return tx;
		});
	}

	async function guild_request_join(guild_id) {
		return splinterlands.send_tx_wrapper('join_guild', 'Request Join Guild', { guild_id }, tx => tx);
	}

	async function guild_invite(guild_id, recipient) {
		return splinterlands.send_tx_wrapper('guild_invite', 'Invite Player', { guild_id, player: recipient}, tx => tx);
	}

	async function guild_approve_member(guild_id, player) {
		return splinterlands.send_tx_wrapper('guild_accept', 'Accept Member', { guild_id, player }, tx => tx);
	}

	async function guild_decline_member(guild_id, player) {
		return splinterlands.send_tx_wrapper('guild_decline', 'Decline Member', { guild_id, player }, tx => tx);
	}

	async function guild_promote_member(guild_id, player) {
		return splinterlands.send_tx_wrapper('guild_promote', 'Promote Member', { guild_id, player }, tx => tx);
	}

	async function guild_demote_member(guild_id, player) {
		return splinterlands.send_tx_wrapper('guild_demote', 'Demote Member', { guild_id, player }, tx => tx);
	}

	async function guild_kick_member(guild_id, player) {
		return splinterlands.send_tx_wrapper('guild_remove', 'Kick Member', { guild_id, player }, tx => tx);
	}

	async function guild_contribution(guild_id, amount) {
		console.warn("splinterlands.ops.guild_contribution is deprecated. Please use splinterlands.ops.guild_building_contribution ")
		return splinterlands.send_tx_wrapper('guild_contribution', 'Guild Contribution', { guild_id, amount }, tx => tx);
	}

	async function guild_building_contribution(guild_id, building, dec_amount, crowns_amount) {
		let amount = [];
		if(dec_amount > 0) {
			amount.push(dec_amount + ' DEC');
		}
		if(crowns_amount > 0) {
			amount.push(crowns_amount + ' CROWN');
		}
		return splinterlands.send_tx_wrapper('guild_contribution', 'Guild Contribution', { guild_id, building, amount }, tx => tx);
	}

	async function league_advance(mode) {
		return splinterlands.send_tx_wrapper('advance_league', `Advance ${mode} League`, { notify: true }, async tx => {
			await splinterlands.get_player().refresh();
			return tx;
		});
	}

	async function set_active_authority(is_active) {
		return splinterlands.send_tx_wrapper('update_authority', 'Update Authority', { require_active_auth: is_active }, async tx => tx);
	}

	async function claim_riftwatchers_airdrop(name) {
		return splinterlands.send_tx_wrapper(
			'claim_airdrop',
			'Claim Airdrop',
			{name},
			async tx => {
				await splinterlands.load_collection();
				return tx;
			}
		)
	}

	async function claim_airdrop_staked_sps(token, qty) {
		return splinterlands.send_tx_wrapper('stake_tokens', 'Stake', {
			token,
			qty,
		}, async tx => {
			await splinterlands.get_player().refresh();
			return tx;
		});
	}

	async function unstake_sps(token, qty) {
		return splinterlands.send_tx_wrapper('unstake_tokens', 'Stake', {
			token,
			qty,
		}, async tx => {
			await splinterlands.get_player().refresh();
			return tx;
		});
	}

	async function cancel_apr_unstake(token) {
		return splinterlands.send_tx_wrapper('cancel_unstake_tokens',
			'Cancel Unstake', {token}, async tx => {
			await splinterlands.get_player().refresh();
			return tx;
		});
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
		undelegate_cards,
		cancel_cards_rental,
		market_purchase,
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
		open_multi,
		purchase,
		withdraw_crypto,
		guild_join,
		guild_request_join,
		guild_leave,
		guild_create,
		guild_update,
		guild_invite,
		guild_approve_member,
		guild_decline_member,
		guild_promote_member,
		guild_demote_member,
		guild_kick_member,
		guild_contribution,
		guild_building_contribution,
		league_advance,
		set_active_authority,
		claim_riftwatchers_airdrop,
		fetch_transfer_out_fees,
		claim_airdrop_staked_sps,
		unstake_sps,
		cancel_apr_unstake,
		init_active_key_transaction,
		init_cards_transactions
	};
})();
