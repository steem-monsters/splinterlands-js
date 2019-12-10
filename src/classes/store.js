splinterlands.Store = class {
	static async get_available_packs(edition) {
		try {
			let packs = (await splinterlands.api('/purchases/stats')).packs;
			return packs.find(p => p.edition == edition).available;
		} catch(err) { return 0; }
	}

	static get booster_price() { return splinterlands.get_settings().booster_pack_price; }
	static get starter_price() { return splinterlands.get_settings().starter_pack_price_account_create; }
	static get orb_price() { return splinterlands.get_settings().dec.orb_cost; }

	static pack_purchase_info(edition, qty) {
		if(![2,4].includes(edition))
			return { error: 'Invalid pack edition specified.' };

		if(edition == 4) {
			return {
				edition,
				qty,
				bonus: Math.floor(qty >= 500 ? qty * 0.15 : (qty >= 100 ? qty * 0.1 : 0)),
				total_usd: +(qty * splinterlands.Store.booster_price).toFixed(2),
				total_dec: Math.floor(qty * splinterlands.Store.booster_price * 1000)
			}
		} else if (edition == 2) {
			return {
				edition,
				qty,
				bonus: Math.floor(qty >= 100 ? qty * 0.1 : (qty >= 20 ? qty * 0.05 : 0)),
				total_usd: +(qty * splinterlands.Store.orb_price / 1000).toFixed(2),
				total_dec: Math.floor(qty * splinterlands.Store.orb_price)
			}
		}
	}

	static get currencies() {
		return [
			{ name: 'STEEM', symbol: 'STEEM' },
			{ name: 'Tron', symbol: 'TRX' },
			{ name: 'Steem Dollars', symbol: 'SBD' },
			{ name: 'Bitcoin', symbol: 'BTC' },
			{ name: 'Ether', symbol: 'ETH' },
			{ name: 'Litecoin', symbol: 'LTC' },
			{ name: 'Binance Coin', symbol: 'BNB' },
			{ name: 'KuCoin Shares', symbol: 'KCS' }
		]
	}

	static async start_purchase(type, qty, currency, merchant, data) {
		let orig_currency = currency;
		let player = splinterlands.get_player() ? splinterlands.get_player().name : '';

		if(!['STEEM', 'SBD', 'DEC'].includes(currency))
			currency = 'STEEM';

		let payment_info = await splinterlands.api('/purchases/start', { player, type, qty, currency, orig_currency, merchant, data });

		if(payment_info && payment_info.payment)
			payment_info.payment = splinterlands.utils.parse_payment(payment_info.payment);
		
		return payment_info;
	}

	static async airdrop_info() {
		let purchases = await splinterlands.api('/players/pack_purchases', { edition: 4 });
		let available = await splinterlands.Store.get_available_packs(4);

		return {
			total_purchased: 100000 - (available % 100000),
			total_remaining: available % 100000,
			player_purchased: purchases ? parseInt(purchases.packs) + parseInt(purchases.bonus_packs) : 0
		};
	}
}