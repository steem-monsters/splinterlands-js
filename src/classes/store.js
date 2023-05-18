splinterlands.Store = class {
	static get payment_tokens() {
		let currencies = [
			{ name: "Dark Energy Crystals", symbol: "DEC" },
			{ name: 'HIVE', symbol: 'HIVE' },
			{ name: 'STEEM', symbol: 'STEEM' },
			{ name: 'Tron', symbol: 'TRX' },
			{ name: 'Hive Dollars', symbol: 'HBD' },
			{ name: 'Steem Dollars', symbol: 'SBD' },
			{ name: 'Bitcoin', symbol: 'BTC' },
			{ name: 'Ether', symbol: 'ETH' },
			{ name: 'Litecoin', symbol: 'LTC' },
			{ name: 'EOS', symbol: 'EOS' },
			{ name: 'WAX', symbol: 'WAX' },
			{ name: 'Electroneum', symbol: 'ETN' },
			{ name: "Binance USD", symbol: "BUSD" },
			{ name: "Bitcoin Cash", symbol: "BCH"},
			{ name: "Telos", symbol: "TLOS" },
			{ name: "Splintershards", symbol: "SPS" },
			{ name: "LeoFinance", symbol: "LEO" },
		];

		if(splinterlands.ethereum.hasWeb3Obj()) {
			currencies.push({ name: 'Basic Attention Token', symbol: 'BAT' })
			currencies.push({ name: 'Enjin Coin', symbol: 'ENJ' })
			currencies.push({ name: 'Uniswap', symbol: 'UNI' })
			currencies.push({ name: 'SAND', symbol: 'SAND' })
			currencies.push({ name: 'GALA', symbol: 'GALA' })
			currencies.push({ name: 'GAME', symbol: 'GAME' })
			currencies.push({ name: "Dai Stablecoin", symbol: "DAI" })
			currencies.push({ name: "Emp Money", symbol: "EMP" })
		}

		return currencies;
	}

	static async get_available_packs(edition) {
		try {
			let packs = (await splinterlands.api('/purchases/stats')).packs;
			return packs.find(p => p.edition == edition).available;
		} catch(err) { return 0; }
	}

	static get booster_price() { return splinterlands.get_settings().booster_pack_price; }
	static get starter_price() { return splinterlands.get_settings().starter_pack_price; }
	static get orb_price() { return splinterlands.get_settings().dec.orb_cost; }
	static get dice_price() { return splinterlands.get_settings().dec.dice_cost; }
	static get chaos_legion_price() { return splinterlands.get_settings().chaos_legion.pack_price; }

	static pack_purchase_info(edition, qty) {
		if(![2,4,5,7].includes(edition))
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
				total_dec: Math.floor(splinterlands.utils.guild_discounted_cost(qty * splinterlands.Store.orb_price))
			}
		} else if (edition == 5) {
			return {
				edition,
				qty,
				bonus: Math.floor(qty >= 100 ? qty * 0.1 : (qty >= 20 ? qty * 0.05 : 0)),
				total_usd: +(qty * splinterlands.Store.dice_price / 1000).toFixed(2),
				total_dec: Math.floor(splinterlands.utils.guild_discounted_cost(qty * splinterlands.Store.dice_price))
			}
		} else if (edition == 7) {
			return {
				edition,
				qty,
				bonus: qty >= 2000 ? Math.floor(qty * 0.20) : (qty >= 500 ? Math.floor(qty * 0.15) : Math.floor(qty * 0.1)),
				total_usd: +(qty * splinterlands.Store.chaos_legion_price).toFixed(2)
			}
		}
	}

	static potion_purchase_info(type, qty) {
		let potion = splinterlands.Potion.get_potion(type);

		if(!potion)
			return { error: 'Invalid potion type specified.' };

		let bonus_obj = potion.bonuses.slice().reverse().find(b => b.min <= qty);

		return {
			type, qty,
			bonus: bonus_obj ? Math.floor(qty * bonus_obj.bonus_pct / 100) : 0,
			total_usd: +(potion.price_per_charge * qty / 1000).toFixed(2),
			total_dec: Math.floor(potion.price_per_charge * qty)
		}
	}

	static get currencies() {
		let currencies = [
			{ name: 'HIVE', symbol: 'HIVE' },
			{ name: 'STEEM', symbol: 'STEEM' },
			{ name: 'Tron', symbol: 'TRX' },
			{ name: 'Hive Dollars', symbol: 'HBD' },
			{ name: 'Steem Dollars', symbol: 'SBD' },
			{ name: 'Bitcoin', symbol: 'BTC' },
			{ name: 'Ether', symbol: 'ETH' },
			{ name: 'Litecoin', symbol: 'LTC' },
			{ name: 'Binance Coin', symbol: 'BNB' },
			{ name: 'KuCoin Shares', symbol: 'KCS' },
			{ name: 'EOS', symbol: 'EOS' }
		];

		if(splinterlands.ethereum.hasWeb3Obj()) {
			currencies.push({ name: 'Basic Attention Token', symbol: 'BAT' })
			currencies.push({ name: 'Enjin Coin', symbol: 'ENJ' })
			currencies.push({ name: 'Uniswap', symbol: 'UNI' })
			currencies.push({ name: 'SAND', symbol: 'SAND' })
			currencies.push({ name: 'GALA', symbol: 'GALA' })
			currencies.push({ name: "Dai Stablecoin", symbol: "DAI" })
			currencies.push({ name: 'GAME', symbol: 'GAME' })
			currencies.push({ name: "Emp Money", symbol: "EMP" })
		}

		return currencies;
	}

	static async start_purchase(type, qty, currency, merchant, data, purchase_origin) {
		let orig_currency = currency;
		let player = splinterlands.get_player() ? splinterlands.get_player().name : '';

		if(!['HIVE', 'HBD', 'DEC'].includes(currency))
			currency = 'HIVE';

		if(orig_currency === 'WAX')
			orig_currency = 'WAX';

		console.log("orig_currency: ", orig_currency)
		if(!purchase_origin) {
			if(splinterlands.is_mobile_app && splinterlands.mobile_OS === "android") {
				purchase_origin = "google";
			} else if(splinterlands.is_mobile_app && splinterlands.mobile_OS === "iOS") {
				purchase_origin = "apple";
			} else {
				purchase_origin = "crypto";
			}
		}

		let params = { player, type, qty, currency, orig_currency, purchase_origin };

		if(merchant)
			params.merchant = merchant;

		if(data)
			params.data = data;

		if(splinterlands.is_mobile_app)
			params.app = splinterlands.mobile_OS;

		if((purchase_origin == 'apple') && (type == 'credits' || type == 'starter_pack')) {
			return { error: "We are very sorry but purchases of Credits/Spellbooks are currently unavailable on the Splinterlands mobile app. You may also log into your account and play at https://splinterlands.com"}
		}

		if((purchase_origin == 'google') && (type == 'credits' || type == 'starter_pack')) {
			return { error: "We are very sorry but purchases of Credits/Spellbooks are currently unavailable on the Splinterlands mobile app. You may also log into your account and play at https://splinterlands.com"}
		}

		if(qty < 10000) {
			return { error: "A $10 minumum is now required to make a purchase."}
		}

		return new splinterlands.Purchase(await splinterlands.api('/purchases/start', params));
	}

	static async airdrop_info(edition) {
		if(!edition)
			edition = 4;
		let purchases = await splinterlands.api('/players/pack_purchases', { edition: edition });
		let available = await splinterlands.Store.get_available_packs(edition);

		if(edition === 5)
			return {
				total_purchased: 50000 - (available % 50000),
				total_remaining: available % 50000,
				player_purchased: purchases ? parseInt(purchases.packs) + parseInt(purchases.bonus_packs) : 0
			};
		else
			return {
				total_purchased: 100000 - (available % 100000),
				total_remaining: available % 100000,
				player_purchased: purchases ? parseInt(purchases.packs) + parseInt(purchases.bonus_packs) : 0
			};

	}

	static async paypal_button(type, get_qty) {
		if(!window.paypal)  {
			const { client_token } = await splinterlands.api('/purchases/paypal_init');
			await splinterlands.utils.loadScriptAsync(`https://www.paypal.com/sdk/js?components=buttons,hosted-fields&client-id=${splinterlands.get_settings().paypal_client_id}&disable-funding=credit`, client_token);
		}

		var purchaseInfo = null;
		return paypal.Buttons({			
			createOrder: async function(data, actions) {
				purchaseInfo = await splinterlands.Store.start_purchase(type, get_qty(), 'USD', null, null, 'paypal');

				if(purchaseInfo.error_code == 406) {
					window.dispatchEvent(new CustomEvent('splinterlands:system_message', { detail: { title: "Daily Limit Reached", message: 'To prevent fraudulent charges, there is a daily limit for PayPal purchases from new accounts. If you would like to increase your limit, please contact us at support@splinterlands.com or on Discord. Cryptocurrency purchases have no limits.' } }));
					return;
				}
				if(purchaseInfo.error_code == 407) {
					window.dispatchEvent(new CustomEvent('splinterlands:system_message', { detail: { title: "Monthly Limit Reached", message: 'To prevent fraudulent charges, there is a monthly limit for PayPal purchases. If you would like to increase your limit, please contact us at support@splinterlands.com or on Discord. Cryptocurrency purchases have no limits.' } }));
					return;
				} 
				if(purchaseInfo.error) {
					window.dispatchEvent(new CustomEvent('splinterlands:system_message', { detail: { title: "Purchase Error", message: 'There was an error starting this purchase: ' + purchaseInfo.error } }));
					return;
				} 
				if(purchaseInfo.code != null) {
					if(purchaseInfo.code === "verification_needed") {
						window.dispatchEvent(new CustomEvent('splinterlands:system_message', { detail: { title: "Verification Needed", message: "Verification is needed for this purchase. Please make your purchase again on our desktop website at https://splinterlands.com." } }));
						return;
					}					
					window.dispatchEvent(new CustomEvent('splinterlands:system_message', { detail: { title: "Verification Issue", message: `Verification Issue:  ${purchaseInfo.code} ${purchaseInfo.info}` } }));
					return;										
				}

				let response = await splinterlands.api('/purchases/paypal_create_order', { uid: purchaseInfo.uid });

				return response.id;
			},
			onError: function (err) {
				console.log(err);
			},
			onApprove: async function(data, actions) {
				splinterlands.log_event('paypal_purchase', data);

				const refID = purchaseInfo.uid;
				const orderID = data.orderID;

				let response = await splinterlands.api('/purchases/paypal_capture_order', { uid: refID, tx: orderID });

				if(response.error) {
					window.dispatchEvent(new CustomEvent('splinterlands:system_message', { detail: { title: "Purchase Issue", message: `There was an error processing this payment: ${response.error}\r\n\r\nYou have NOT been charged for this purchase. You may see a pending charge on your account which will clear within a few days.\r\n\r\nPlease contact us at https://support.splinterlands.com for help.` } }));					
					return false;
				} else {					
					window.dispatchEvent(new CustomEvent('splinterlands:purchase_approved', { detail: response }));
					return true;
				}
			}
		})
	}

	static async check_code(code) {
		code = code.toUpperCase();
		let result = await splinterlands.api('/purchases/check_code', { code });

		if(!result || !result.valid)
			return result;

		if(result.type != 'starter_pack')
			return { error: 'The specified promo code is not currently supported in the mobile app, please try the desktop site.' };

		if(result.type == 'starter_pack' && splinterlands.get_player().starter_pack_purchase)
			return { error: `This promo code is for a Summoner's Spellbook which has already been purchased for this account.` };

		// Un-hardcode these later when we accept more promo code types
		result.img_url = 'https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/shop/img_spellbook.png';
		result.name = `Summoner's Spellbook`;

		return result;
	}

	static async redeem_code(code) {
		if(typeof code == 'string')
			code = await splinterlands.api('/purchases/check_code', { code: code.toUpperCase() });

		switch(code.type) {
			case 'starter_pack':
				let purchase = await splinterlands.Store.start_purchase('starter_pack', 1, 'PROMO');
				return await splinterlands.api('/purchases/start_code', { code: code.code, purchase_id: purchase.uid });
			default:
				return { error: 'The specified promo code is not currently supported.' };
		}
	}

	static async dec_deposit_info(wallet_type) {
		return new Promise(async (resolve, reject) => {
			try {
				switch(wallet_type) {
					case 'steem_engine':
					case 'hive_engine':
						resolve({ address: splinterlands.get_settings().account, browser_payment_available: true });
						break;
					case 'tron':
						let address = await splinterlands.ec_api('/purchases/get_payment_address', { type: 'dec_deposit', currency: 'TRX', data: '' });
						resolve({ address: address.wallet_address, browser_payment_available: splinterlands.tron.browser_payment_available() });
						break;
					case 'ethereum':
						resolve({ address: splinterlands.get_settings().ethereum.contracts.crystals.address, browser_payment_available: false });
						break;
					case 'bsc':
						resolve({ address: '0xe9d7023f2132d55cbd4ee1f78273cb7a3e74f10a', browser_payment_available: false });
						break;
					default:
						reject({ error: 'Missing or invalid "wallet_type" parameter.' });
						break;
				}
			} catch (err) { reject(err); }
		});
	}

	static async mobile_validate(product_id, uid, purchase_token) {
		splinterlands.log_event('mobile_purchase', { product_id: product_id, uid: uid, purchase_token: purchase_token});

		let result = await splinterlands.api('/purchases/mobilepurchase', { product_id: product_id, uid: uid, purchase_token: purchase_token});

		if(result && !result.error) {
			window.dispatchEvent(new CustomEvent('splinterlands:purchase_approved', { detail: result }));

			return result;
		} else {
			splinterlands.log_event('mobile_purchase_failed', { result })

			return result;
		}
	}

	static async iOS_validate(product_id, uid, receipt_data) {
		//Apple's receipt data is too large for a query string to handle
		splinterlands.log_event('mobile_purchase_ios', { product_id: product_id, uid: uid, receipt_data: encodeURIComponent(receipt_data.substr(0, 50) + "...") });

		let query = { "product_id": product_id, "uid": uid };

		let result = await splinterlands.api_post('/purchases/iospurchase?' + splinterlands.utils.param(query), { "receipt-data": receipt_data });

		if(result && !result.error) {
			window.dispatchEvent(new CustomEvent('splinterlands:purchase_approved', { detail: result }));

			return result;
		} else {
			splinterlands.log_event('mobile_purchase_failed_ios', { result })

			return result;
		}
	}

	static async restore_iap(product_id, purchase_token) {
		if(splinterlands.is_mobile_app) {
			return new Promise(function(resolve, reject) {
				//Have to wait for home screen/news to finish loading
				setTimeout(resolve, 2000);
			}).then(async function() {
				window.showLoadingAnimation(true, "Checking In App Purchases\n\nDo not close the app");
				let qty = 0;
				let product_type = 'credits';

				switch (product_id) {
					case 'spellbook':
						product_type = 'starter_pack'
						qty = 1;
						break;
					case 'small':
						qty = 2000;
						break;
					case 'middle':
						qty = 10000;
						break;
					case 'large':
						qty = 20000;
						break;
					case 'purse':
						qty = 50000;
						break;
					case 'bounty':
						qty = 100000;
						break;
					case 'ransom':
						qty = 200000;
						break;
					default:
						console.log("Unknown product_id:", product_id);
						return;
				}

				let purchase = await splinterlands.Store.start_purchase(product_type, qty, 'USD')
				let validate = await splinterlands.Store.mobile_validate(product_id, purchase.uid, purchase_token)

				if(!validate.error){
					if(splinterlands.mobile_OS === "android") {
						window.BlockHandler.purchaseVerified(purchase_token, true);
					}
				} else {
					window.showLoadingAnimation(false, "Checking In App Purchases\n\nDo not close the app");
				}
			});
		} else {
			console.log("ERROR: Trying to restore non mobile IAP")
			return;
		}
	}

	static async claim_airdrop(name) {
		return splinterlands.send_tx_wrapper('claim_airdrop', 'Claim Airdrop', { name }, async tx => {
			await splinterlands.load_collection();
			return tx.result.map(c => new splinterlands.Card(c));
		});
	}

	static async connectMobilePayToken(connector) {
		if (!connector.connected) {
			// create new session
			connector.createSession();
		}

		// Subscribe to connection events
		connector.on('connect', (error, _payload) => {
			if (error) {
				throw error;
			}
			console.log('Connected');
		});

		connector.on('session_update', (error, _payload) => {
			if (error) {
				throw error;
			}
			console.log('Session updated');
		});

		connector.on('disconnect', (error, _payload) => {
			if (error) {
				throw error;
			}
			console.log('Disconnected');
		});
	}
}

splinterlands.Purchase = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);
	}
}
