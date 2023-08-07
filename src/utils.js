if (!window.splinterlands)
    window.splinterlands = {};

window.splinterlands.utils = (function() {
	UNTAMED_CARD_URL = 'https://d36mxiodymuqjm.cloudfront.net/cards_untamed/';
  	BETA_CARD_URL = 'https://d36mxiodymuqjm.cloudfront.net/cards_beta/';
	ALPHA_CARD_URL = 'https://d36mxiodymuqjm.cloudfront.net/cards_v2.2/';
	SUMMONER_CARD_URL_MOBILE = 'https://d36mxiodymuqjm.cloudfront.net/cards_battle_mobile/Summoners/';
	GLADIATOR_URL = 'https://d36mxiodymuqjm.cloudfront.net/cards_gladiator/';
	CHAOS_LEGION_URL = 'https://d36mxiodymuqjm.cloudfront.net/cards_chaos/';
	RIFT_URL = 'https://d36mxiodymuqjm.cloudfront.net/cards_riftwatchers/';
	SOULBOUND_URL = 'https://d36mxiodymuqjm.cloudfront.net/cards_soulbound/';

	CARD_URLS = [ALPHA_CARD_URL, BETA_CARD_URL, ALPHA_CARD_URL, BETA_CARD_URL, UNTAMED_CARD_URL, UNTAMED_CARD_URL, GLADIATOR_URL, CHAOS_LEGION_URL, RIFT_URL, null, SOULBOUND_URL];

	BATTLE_CARD_URLS = [
		'https://d36mxiodymuqjm.cloudfront.net/cards_battle_alpha/',
		'https://d36mxiodymuqjm.cloudfront.net/cards_battle_beta/',
		'https://d36mxiodymuqjm.cloudfront.net/cards_battle_alpha/',
		'https://d36mxiodymuqjm.cloudfront.net/cards_battle_beta/',
		'https://d36mxiodymuqjm.cloudfront.net/cards_battle_untamed/',
		'https://d36mxiodymuqjm.cloudfront.net/cards_battle_untamed/',
		'https://d36mxiodymuqjm.cloudfront.net/cards_battle_gladiator/',
		'https://d36mxiodymuqjm.cloudfront.net/cards_battle_chaos/',
	];

    BATTLE_CARD_URLS_MOBILE = [
        'https://d36mxiodymuqjm.cloudfront.net/cards_battle_mobile/',
        'https://d36mxiodymuqjm.cloudfront.net/cards_battle_mobile/'
    ];

    RUNI_CARD_URL = 'https://runi.splinterlands.com/'

    rpc_index = 0;
    //rpc_nodes = ["https://api.steemit.com", "https://seed.steemmonsters.com", "https://steemd.minnowsupportproject.org"];
    rpc_nodes = ["https://api.hive.blog", "https://anyx.io", "https://hived.splinterlands.com"];
    version = "0.7.26";

    function switch_rpc() {
        // Try the next RPC node
        let rpc_node = rpc_nodes[++rpc_index % rpc_nodes.length];
        steem.api.setOptions({transport: 'http', uri: rpc_node, url: rpc_node});
        console.log(`SWITCHED TO NEW RPC NODE: ${rpc_node}`);
    }

    function get_rpc_nodes(list) {
        return rpc_nodes;
    }

    function set_rpc_nodes(list) {
        rpc_nodes = list;
    }

    function get_version() {
        return version
    }

    async function post(url, data) {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.onload = function () {
                if (xhr.status === 200)
                    resolve(try_parse(xhr.responseText));
                else
                    reject('Request failed.  Returned status of ' + xhr.status);
            };

            xhr.send(JSON.stringify(data));
        });
    }

    function parse_payment(payment_str) {
        return {
            amount: parseFloat(payment_str),
            currency: payment_str.substr(payment_str.indexOf(' ') + 1)
        }
    }

    function randomStr(length) {
        var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
            retVal = "";
        for (var i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        return retVal;
    }

    function getURLParameter(url, name) {
        let index = url.indexOf('?');

		if(index < 0)
			return null;

    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(url.substring(index)) || [, ""])[1].replace(/\+/g, '%20')) || null;
	}

    function timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function get_cur_block_num() {
        return Math.max(Math.floor((Date.now() - splinterlands.get_settings().timestamp) / 3000), 0) + splinterlands.get_settings().last_block;
    }

    function get_level(card) {
        if (card.edition >= 4 || card.details.tier >= 4) {
            let rates = splinterlands.get_settings()[card.gold ? 'combine_rates_gold' : 'combine_rates'][card.details.rarity - 1];

            for (let i = 0; i < rates.length; i++) {
                if (rates[i] > card.xp)
                    return i;
            }

			return card.details.max_level;
		} else {
			for(var i = 0; i < splinterlands.get_settings().xp_levels[card.details.rarity - 1].length; i++) {
				if(card.xp < splinterlands.get_settings().xp_levels[card.details.rarity - 1][i])
					return i + 1;
			}

			return splinterlands.get_settings().xp_levels[card.details.rarity - 1].length + 1;
		}
	}

    function get_summoner_level(rating_level, card) {
        var rarity = splinterlands.get_card_details(card.card_detail_id).rarity;
        var max_level = 10 - (rarity - 1) * 2;
        return Math.min(card.level, Math.max(Math.round(max_level / 4 * rating_level), 1));
    }

    function get_monster_level(rating_level, summoner_card, monster_card) {
        if (rating_level == 0)
            return 1;

        var summoner_rarity = splinterlands.get_card_details(summoner_card.card_detail_id).rarity;
        var monster_rarity = splinterlands.get_card_details(monster_card.card_detail_id).rarity;
        var summoner_level = get_summoner_level(rating_level, summoner_card);

        var monster_max = 10 - (monster_rarity - 1) * 2;
        var summoner_max = 10 - (summoner_rarity - 1) * 2;
        return Math.min(monster_card.level, Math.max(Math.round(monster_max / summoner_max * summoner_level), 1));
    }

    function get_ecr(capture_rate, last_reward_block) {
        return Math.min((isNaN(parseInt(capture_rate)) ? 10000 : capture_rate) + (splinterlands.get_settings().last_block - last_reward_block) * splinterlands.get_settings().dec.ecr_regen_rate, 10000);
    }

    function get_token(symbol) {
        return splinterlands.get_settings().supported_currencies.find(c => c.currency == symbol);
    }

    function format_tx_id(id) {
        let prefix = (splinterlands.get_settings().test_mode) ? `${splinterlands.get_settings().prefix}sm_` : 'sm_';

        if (!id.startsWith(prefix))
            id = `${prefix}${id}`;

        return id;
    }

    function format_tx_data(data) {
        if (!data)
            data = {};

        data.app = `sl-mobile/${splinterlands.get_settings().version}`;

        // Generate a random ID for this transaction so we can look it up later
        if (!data.sm_id)
            data.sm_id = randomStr(10);

        // Append the prefix to the app name if in test mode
        if (splinterlands.get_settings().test_mode)
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

	async function hive_engine_transfer(to, token, quantity, memo) {
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

		if(window.steem_keychain) {
			var result = await new Promise(resolve => steem_keychain.requestCustomJson(splinterlands.get_player().name, splinterlands.get_settings().ssc.hive_chain_id, 'Active', JSON.stringify(transaction_data), 'Transfer Token: ' + token, r => resolve(r)));

			if(!result.success)
				return { success: false, error: result.error };

        } else {
            var url = 'https://hivesigner.com/sign/custom-json?authority=active';
            url += '&required_posting_auths=' + encodeURI('[]');
            url += '&required_auths=' + encodeURI('["' + splinterlands.get_player().name + '"]');
            url += '&id=' + splinterlands.get_settings().ssc.hive_chain_id;
            url += '&json=' + encodeURI(JSON.stringify(transaction_data));

            popup_center(url, `${token} Payment`, 500, 760);
        }

        return {success: true};
    }

    function sc_custom_json(id, title, data, use_active) {
        let url = 'https://hivesigner.com/sign/custom-json?authority=active';
        url += '&required_posting_auths=' + encodeURI('[' + (use_active ? '' : `"${splinterlands.get_player().name}"`) + ']');
        url += '&required_auths=' + encodeURI('[' + (use_active ? `"${splinterlands.get_player().name}"` : '') + ']');
        url += '&id=' + id;
        url += '&json=' + encodeURI(JSON.stringify(data));
        url += use_active ? '&authority=active' : '';

		popup_center(url, title, 500, 560);
	}

	// Checks whether or not a browser payment method is available for the specified token (i.e. Web3 for ETH or TronWeb for TRX)
	async function browser_payment_available(token) {
		return new Promise(async (resolve) =>  {
			switch(token) {
				case 'STEEM':
				case 'SBD':
					return resolve(false);
				case 'HIVE':
				case 'HBD':
					return resolve(true);
				case 'TRX':
					return (window.tronWeb && window.tronWeb.defaultAddress && window.tronWeb.defaultAddress.base58) ? resolve(true) : resolve(false);
				case 'EOS':
					return resolve(splinterlands.eos.hasIdentity());
				case 'ETH':
				case 'GAME':
				case 'BAT':
				case 'UNI':
				case 'SAND':
				case 'GALA':
				case 'ENJ':
				case 'DAI':
					return resolve(!!window.web3);
				default:
					return resolve(false);
			}
		});
	}

	function get_edition_str(edition) {
		return ['Alpha', 'Beta', 'Orb', 'Reward', 'Untamed', 'Dice', 'Gladius', 'Chaos', 'Rift', 'Nightmare', 'Soulbound'][edition];
	}

	function param(object) {
    var encodedString = '';
    for (var prop in object) {
        if (object.hasOwnProperty(prop)) {
            if (encodedString.length > 0) {
                encodedString += '&';
            }
            encodedString += prop + '=' + encodeURIComponent(object[prop]);
        }
    }
    return encodedString;
	}

    function try_parse(json) {
        try {
            return (typeof json == 'string') ? JSON.parse(json) : json;
        } catch (err) {
            console.log('Error trying to parse JSON: ' + json);
            return null;
        }
    }

    async function validate_acct_name(name) {
        name = name.toLowerCase();
        let error = steem.utils.validateAccountName(name);

        if (error)
            return {available: false, error};

        let is_existing_account = await this.account_exists(name);

        if (is_existing_account)
            return {available: false, error: 'That account name is already taken.'};

        return {available: true};
    }

    async function account_exists(name) {
        let res = await splinterlands.api('/players/exists', {name});

        return res.exists;
    }

    function get_ability_image(ability, small) {
        return `https://d36mxiodymuqjm.cloudfront.net/website/abilities${small ? '/small' : ''}/ability_${ability.toLowerCase().replace(' ', '-')}.png`;
    }

    function get_stat_image(stat) {
        stat = stat.toLowerCase();

        if (stat == 'armor')
            stat = 'defense';

        if (['melee', 'ranged', 'magic'].includes(stat))
            return `https://d36mxiodymuqjm.cloudfront.net/website/stats/${stat}-attack.png`;
        else
            return `https://d36mxiodymuqjm.cloudfront.net/website/stats/${stat}.png`;
    }

	function lookup_effect(effect) {
		let obj = effects[effect];

		if(!obj) {
			console.log('*** CANNOT FIND EFFECT: ' + effect);
			return {};
		}

        obj.img = `https://d36mxiodymuqjm.cloudfront.net/website/abilities/ability_${obj.ability.toLowerCase().replace(/\s/g, '-')}.png`;
        obj.img_sm = `https://d36mxiodymuqjm.cloudfront.net/website/abilities/small/ability_${obj.ability.toLowerCase().replace(/\s/g, '-')}.png`;
        return obj;
    }

    function get_abilities() {
        if (!_abilities[0].img) {
            _abilities.forEach(a => {
                a.img = `https://d36mxiodymuqjm.cloudfront.net/website/abilities/ability_${a.name.toLowerCase().replace(/\s/g, '-')}.png`;
                a.img_sm = `https://d36mxiodymuqjm.cloudfront.net/website/abilities/small/ability_${a.name.toLowerCase().replace(/\s/g, '-')}.png`;
            });
        }

        return _abilities;
    }

    function get_starter_card(id, edition) {
        return new splinterlands.Card({
            uid: `starter-${id}-${randomStr(5)}`,
            card_detail_id: id,
            gold: false,
            xp: edition >= 4 ? 1 : 0,
            edition: edition
        });
    }

    function guild_discounted_cost(base_cost) {
        let player = splinterlands.get_player();

        if (!player || !player.guild)
            return base_cost;

        return +(base_cost * (1 - (player.guild.shop_discount / 100))).toFixed(1);
    }

	async function loadScriptAsync(url, client_token) {
		return new Promise(resolve => loadScript(url, resolve, client_token));
	}

	function loadScript(url, callback, client_token) {
		var script = document.createElement("script");
		script.type = "text/javascript";
		if(client_token) {
			script.setAttribute("data-client-token", client_token);
		}
		if(script.readyState) {  //IE
			script.onreadystatechange = function() {
				if(script.readyState === "loaded" || script.readyState === "complete") {
					script.onreadystatechange = null;
					callback();
				}
			};
		} else if(callback) {  //Others
			script.onload = function() {
				callback();
			};
		}

		script.src = url;
		document.getElementsByTagName("head")[0].appendChild( script );
	}

    function asset_url(path) {
        return splinterlands.get_settings().asset_url + path;
    }

	function server_date(date_str, subtract_seconds) {
		let date = new Date(new Date(date_str).getTime() + splinterlands.get_server_time_offset());

		if(subtract_seconds)
			date = new Date(date.getTime() - subtract_seconds * 1000);

		return date;
	}

    let effects = {
        "Stun": {
            "ability": "Stun",
            "pastTense": "Stunned",
            "desc": "Stunned monsters skip their next turn."
        },
        "Enrage": {
            "ability": "Enrage",
            "pastTense": "Enraged",
            "desc": "Enraged monsters get increased speed and attack damage when not at full health."
        },
        "Poison": {
            "ability": "Poison",
            "pastTense": "Poisoned",
            "desc": "Poisoned monsters take 2 damage at the start of each round."
        },
        "Slow": {
            "ability": "Slow",
            "pastTense": "Slowed",
            "desc": "-1 to SPEED"
        },
        "Protected": {
            "ability": "Protect",
            "pastTense": "Protected",
            "desc": "+2 to ARMOR"
        },
        "Inspired": {
            "ability": "Inspire",
            "pastTense": "Inspired",
            "desc": "+1 to MELEE ATTACK"
        },
        "Weakened": {
            "ability": "Weaken",
            "pastTense": "Weakened",
            "desc": "-1 to HEALTH"
        },
        "Silenced": {
            "ability": "Silence",
            "pastTense": "Silenced",
            "desc": "-1 to MAGIC ATTACK"
        },
        "Swiftened": {
            "ability": "Swiftness",
            "pastTense": "Swiftened",
            "desc": "+1 to SPEED"
        },
        "Strengthened": {
            "ability": "Strengthen",
            "pastTense": "Strengthened",
            "desc": "+1 to HEALTH"
        },
        "Shielded": {
            "ability": "Divine Shield",
            "pastTense": "Shielded",
            "desc": "The first time this monster takes damage it is ignored."
        },
        "Demoralized": {
            "ability": "Demoralize",
            "pastTense": "Demoralized",
            "desc": "-1 to MELEE ATTACK"
        },
        "Afflicted": {
            "ability": "Affliction",
            "pastTense": "Afflicted",
            "desc": "This monster may not be healed."
        },
        "Blinded": {
            "ability": "Blind",
            "pastTense": "Blinded",
            "desc": "Reduced chance of hitting with MELEE and RANGED attacks."
        },
        "Headwinds": {
            "ability": "Headwinds",
            "pastTense": "Headwinds",
            "desc": "-1 to RANGED ATTACK"
        },
        "Snared": {
            "ability": "Snare",
            "pastTense": "Snared",
            "desc": "Loses the Flying ability"
        },
        "Rusted": {
            "ability": "Rust",
            "pastTense": "Rusted",
            "desc": "-2 Armor"
        },
        "Last Stand": {
            "ability": "Last Stand",
            "pastTense": "Last Stand",
            "desc": "+50% to all stats"
        },
        "Crippled": {
            "ability": "Cripple",
            "pastTense": "Crippled",
            "desc": "-1 MAX HEALTH"
        },
        "Halved": {
            "ability": "Halving",
            "pastTense": "Halved",
            "desc": "Attack stats cut in half"
        },
    };

	let _abilities = [
		{
			"name": "Affliction",
			"desc": "When this Unit hits a target, it has a 50% chance of applying Affliction on the target causing it to be unable to be healed.",
			"effect_name": "Afflicted",
			"effect_desc": "This unit may not be healed."
		},
		{
			"name": "Amplify",
			"desc": "Increases Magic Reflect, Return Fire, and Thorns damage to all enemy units by 1."
		},
		{
			"name": "Backfire",
			"desc": "If an enemy misses this Unit with an attack, the attacker takes 2 Melee damage."
		},
		{
			"name": "Blast",
			"desc": "Does half damage to Units adjacent to the target Unit."
		},
		{
			"name": "Blind",
			"desc": "All enemy Melee & Ranged attacks have a 15% higher chance of missing their target.",
			"effect_name": "Blinded",
			"effect_desc": "Reduced chance of hitting with MELEE and RANGED attacks."
		},
		{
			"name": "Bloodlust",
			"desc": "Every time this Unit defeats an opponent, it gets +1 to all stats."
		},
		{
			"name": "Camouflage",
			"desc": "This Unit cannot be targeted for attacks unless it's in the first position."
		},
		{
			"name": "Cleanse",
			"desc": "Removes all negative effects on the Unit in the first position on the friendly team."
		},
		{
			"name": "Deathblow",
			"desc": "This Unit does 2x damage if their target is the only Unit left on the enemy team."
		},
		{
			"name": "Demoralize",
			"desc": "Reduces the Melee attack of all enemy Units by 1.",
			"effect_name": "Demoralized",
			"effect_desc": "-1 to MELEE ATTACK"
		},
		{
			"name": "Divine Shield",
			"desc": "The first time this Unit takes damage it is ignored.",
			"effect_name": "Shielded",
			"effect_desc": "The first time this unit takes damage it is ignored."
		},
		{
			"name": "Dodge",
			"desc": "Has a 25% higher chance of evading Melee or Ranged attacks."
		},
		{
			"name": "Double Strike",
			"desc": "This unit attacks twice each round."
		},
		{
			"name": "Enrage",
			"desc": "This unit has 50% bonus Melee attack and Speed when damaged.",
			"effect_name": "Enraged",
			"effect_desc": "Enraged units get 50% bonus speed and attack damage when not at full health."
		},
		{
			"name": "Flying",
			"desc": "Has a 25% bonus chance of evading Melee or Ranged attacks from Unit who do not have the Flying ability."
		},
		{
			"name": "Forcefield",
			"desc": "This Unit takes only 1 damage from attacks with power 5 or higher."
		},
		{
			"name": "Giant Killer",
			"desc": "Does double damage against targets that cost 10 or more mana."
		},
		{
			"name": "Halving",
			"desc": "The first time this Unit hits a target, that target's attack is cut in half (rounded down).",
			"effect_name": "Halved",
			"effect_desc": "Attack stats cut in half"
		},
		{
			"name": "Headwinds",
			"desc": "Reduces the Ranged attack of all enemy Units by 1.",
			"effect_name": "Headwinds",
			"effect_desc": "-1 to RANGED ATTACK"
		},
		{
			"name": "Heal",
			"desc": "Restores a third of max health to this Unit's health each round."
		},
		{
			"name": "Tank Heal",
			"desc": "Restores a third of max health to the Unit in the first position's health each round."
		},
		{
			"name": "Inspire",
			"desc": "Gives all friendly Units +1 Melee attack.",
			"effect_name": "Inspired",
			"effect_desc": "+1 to MELEE ATTACK"
		},
		{
			"name": "Knock Out",
			"desc": "Does double damage when attacking an enemy that is stunned."
		},
		{
			"name": "Last Stand",
			"desc": "Gains +50% to all stats if it's the only Unit on the team alive.",
			"effect_name": "Last Stand",
			"effect_desc": "+50% to all stats"
		},
		{
			"name": "Life Leech",
			"desc": "Unit's health increases each time it damages an enemy Unit's health by half the damage dealt."
		},
		{
			"name": "Magic Reflect",
			"desc": "When hit with Magic damage, does half the Magic damage back to the attacker."
		},
		{
			"name": "Opportunity",
			"desc": "Units with the Opportunity ability may attack from any position and will target the enemy Unit with the lowest health."
		},
		{
			"name": "Oppress",
			"desc": "Does double damage when attacking an enemy that has no attack."
		},
		{
			"name": "Piercing",
			"desc": "If Melee or Ranged attack damage is in excess of the target's Armor, the remainder will damage the target's Health."
		},
		{
			"name": "Poison",
			"desc": "Attacks have a 50% chance to apply poison, which does automatic damage to the target at the beginning of each round after the poison is applied.",
			"effect_name": "Poisoned",
			"effect_desc": "Poisoned units take 2 damage at the start of each round."
		},
		{
			"name": "Protect",
			"desc": "All friendly Units gain +2 Armor.",
			"effect_name": "Protected",
			"effect_desc": "+2 to ARMOR"
		},
		{
			"name": "Reach",
			"desc": "Melee attack Units with the Reach ability may attack from the second position on the team."
		},
		{
			"name": "Recharge",
			"desc": "This Unit attacks every other round but does 3x damage."
		},
		{
			"name": "Reflection Shield",
			"desc": "This Unit doesn't take damage from Blast, Magic Reflect, Thorns, or Return Fire."
		},
		{
			"name": "Rebirth",
			"desc": "When this Unit dies it will self-resurrect with 1 Health once per battle."
		},
		{
			"name": "Redemption",
			"desc": "When this Unit dies, it does 2 damage to all enemy units."
		},
		{
			"name": "Repair",
			"desc": "Restores a third of max armor to the friendly Unit whose armor has taken the most damage."
		},
		{
			"name": "Resurrect",
			"desc": "When a friendly Unit dies it is brought back to life with 1 Health. This ability can only trigger once per battle."
		},
		{
			"name": "Retaliate",
			"desc": "When hit with a Melee attack, Units with Retaliate have a 50% chance of attacking their attacker."
		},
		{
			"name": "Return Fire",
			"desc": "When hit with a Ranged attack, Units with Return Fire will return half the damage back to their attacker."
		},
		{
			"name": "Rust",
			"desc": "Reduces the Armor of all enemy Units by 2.",
			"effect_name": "Rusted",
			"effect_desc": "-2 Armor"
		},
		{
			"name": "Scattershot",
			"desc": "This Unit's Ranged and Magic attacks hit a random enemy target, if not in the first position."
		},
		{
			"name": "Scavenger",
			"desc": "Gains 1 max health each time any unit dies."
		},
		{
			"name": "Shatter",
			"desc": "Target's armor is destroyed when hit by an attack from Units with Shatter."
		},
		{
			"name": "Shield",
			"desc": "Reduced damage from Melee and Ranged attacks by 50%."
		},
		{
			"name": "Silence",
			"desc": "Reduces the Magic Attack of all enemy Units by 1.",
			"effect_name": "Silenced",
			"effect_desc": "-1 to MAGIC ATTACK"
		},
		{
			"name": "Slow",
			"desc": "Reduces the Speed of all enemy Units by 1.",
			"effect_name": "Slowed",
			"effect_desc": "-1 to SPEED"
		},
		{
			"name": "Snare",
			"desc": "When attacking enemies with Flying, removes the Flying ability and cannot miss.",
			"effect_name": "Snared",
			"effect_desc": "Loses the Flying ability"
		},
		{
			"name": "Sneak",
			"desc": "Targets the last Unit on the enemy Team instead of the first Unit."
		},
		{
			"name": "Snipe",
			"desc": "Targets enemy Units with Ranged, Magic, or no attack that are not in the first position."
		},
		{
			"name": "Strengthen",
			"desc": "All friendly Units have increased Health by 1.",
			"effect_name": "Strengthened",
			"effect_desc": "+1 to HEALTH"
		},
		{
			"name": "Stun",
			"desc": "When a Unit with Stun hits a target, there is a 50% chance that the target will skip its next turn.",
			"effect_name": "Stunned",
			"effect_desc": "Stunned units skip their next turn."
		},
		{
			"name": "Swiftness",
			"desc": "All friendly Units have their Speed increased by 1.",
			"effect_name": "Swiftened",
			"effect_desc": "+1 to SPEED"
		},
		{
			"name": "Taunt",
			"desc": "All enemy Units target this Unit (if they are able to)."
		},
		{
			"name": "Thorns",
			"desc": "When hit with a Melee attack, does 2 Melee damage back to the attacker."
		},
		{
			"name": "Trample",
			"desc": "When a Unit with Trample hits and kills its target, it will perform another attack on the next Unit on the enemy Team."
		},
		{
			"name": "Triage",
			"desc": "Heals the friendly back-line Unit that has taken the most damage by a third of max health."
		},
		{
			"name": "Void",
			"desc": "Reduced damage from Magic attacks by 50%."
		},
		{
			"name": "Weaken",
			"desc": "Reduces the Health of all enemy Units by 1.",
			"effect_name": "Weakened",
			"effect_desc": "-1 to HEALTH"
		},
		{
			"name": "Void Armor",
			"desc": "Magic attacks hit this Unit's armor before its Health."
		},
		{
			"name": "Immunity",
			"desc": "This unit is immune to negative status effects."
		},
		{
			"name": "Cripple",
			"desc": "Each time an enemy is hit by a Unit with Cripple it loses one max health.",
			"effect_name": "Crippled",
			"effect_desc": "-1 to MAX HEALTH"
		},
		{
			"name": "Close Range",
			"desc": "Units with the Close Range ability can use Ranged attack from the first position."
		},
		{
			"name": "True Strike",
			"desc": "This Unit's attacks cannot miss."
		},
		{
			"name": "Phase",
			"desc": "Magic attacks can miss this Unit (using the same hit/miss calculation as for Melee and Ranged attacks)."
		},
		{
			"name": "Dispel",
			"desc": "When this unit hits an enemy, it clears all buffs and positive status effects on that enemy."
		},
		{
			"name": "Fury",
			"desc": "This Unit does double damage to targets with the Taunt ability."
		},
		{
			"name": "Weapons Training",
			"desc": "Adjacent Units gain half this Unit's attack if they have no attack themselves.",
			"effect_name": "Trained",
			"effect_desc": "Gaining attack from a Unit with Weapons Training."
		},
		{
			"name": "Martyr",
			"desc": "When this Unit dies, adjacent Units get +1 to all stats."
		},
		{
			"name": "Conscript",
			"desc": "Allows the use of one additional Gladiator card in battle."
		},
	];

	function get_chest_type_from_chest_tier(chestTier) {
		if (chestTier === 0) return 'bronze';
		if (chestTier === 1) return 'silver';
		if (chestTier === 2) return 'gold';
		if (chestTier === 3) return 'diamond';
		if (chestTier === 4) return 'champion';
		return 'original';
	}

    function get_previous_season_highest_acheived_league(previousSeasonPlayer) {
        if (!previousSeasonPlayer) {
            return 0;
        }
        return previousSeasonPlayer.max_league;
    }

	function get_chest_qty(type, chest_tier, rshares) {
		const reward_config = splinterlands.get_settings().loot_chests[type][chest_tier];
		let chests = -1;
		let total_rshares = 0;
		let next_chest = 0;
		const reward_tiers = [];

		while (rshares >= Math.round(total_rshares)) {
			chests++;
			next_chest = reward_config.base * reward_config.step_multiplier ** chests;
			total_rshares += next_chest;
			reward_tiers.push({
				chests: chests + 1,
				total_reward_shares_required: Math.round(total_rshares),
			});
		}
		const users_current_chests = chests;
		const users_total_rshares = total_rshares;
		const users_next_chest = next_chest;

		while (chests < (reward_config.max - 1)) {
			chests++;
			next_chest = reward_config.base * reward_config.step_multiplier ** chests;
			total_rshares += next_chest;
			reward_tiers.push({
				chests: chests + 1,
				total_reward_shares_required: Math.round(total_rshares),
			});
		}

		if (chests >= reward_config.max) {
			const cappedRewardsTiers = reward_tiers.slice(0, reward_config.max);
			const maxRewardShares = cappedRewardsTiers[cappedRewardsTiers.length -1].total_reward_shares_required;
			return {
				chests: reward_config.max,
				progress: maxRewardShares,
				total: maxRewardShares,
				reward_tiers: cappedRewardsTiers,
				reward_shares: rshares,
				chest_tier,
				chest_type: get_chest_type_from_chest_tier(chest_tier),
			};
		}

		return {
			chests: users_current_chests,
			progress: Math.round(users_next_chest) - (Math.round(users_total_rshares) - rshares),
			total: Math.round(users_next_chest),
			reward_tiers,
			reward_shares: rshares,
			chest_tier,
			chest_type: get_chest_type_from_chest_tier(chest_tier),
		};
	}

	function summoner_has_ability(card, abilities){
		if(!card || !card.card_detail_id)
			return false;

		const cardDetails = splinterlands.get_card_details(card.card_detail_id);
		if (!cardDetails.stats || !cardDetails.stats.abilities) return false;
		const cardAbilities = cardDetails.type === 'Summoner' ? cardDetails.stats.abilities : cardDetails.stats.abilities.slice(0, card.level).flat();
		return cardAbilities.some((a) => abilities.some((s) => s.toLowerCase() === a.toLowerCase()));
	}

	function is_active(match_inactive_colors, color){
		return match_inactive_colors.indexOf(color) < 0;
	}

	function has_secondary_color(card){
		return card.secondary_color !== undefined && card.secondary_color != null;
	}

	function is_color_aligned(summoner, allyColor, match_inactive_colors, monster){
		const secondary_color_active = has_secondary_color(summoner);
		const isMultiColorMonster = monster.secondary_color != null;

		const primaryPrimaryAligned = monster.color === summoner.color;
		const primarySecondaryAligned = isMultiColorMonster && monster.secondary_color === summoner.color;
		const secondaryPrimaryAligned = secondary_color_active && monster.color === summoner.secondary_color;
		const secondarySecondaryAligned = isMultiColorMonster && secondary_color_active && monster.secondary_color === summoner.secondary_color;
		const allyAligned = (summoner.color.toLowerCase() === 'gold' || summoner.color.toLowerCase() === 'gray') && (monster.color === allyColor || monster.secondary_color === allyColor);

		return ( ( (primaryPrimaryAligned || primarySecondaryAligned) && is_active(match_inactive_colors, summoner.color) )
							|| ( (secondaryPrimaryAligned || secondarySecondaryAligned) && (is_active(match_inactive_colors, summoner.secondary_color) || is_active(match_inactive_colors, monster.color)))
							|| monster.color === 'Gray'
							|| allyAligned
						);
	};

    function hive_signer_payment(to, amount, currency, memo) {
        let sc_url = `https://hivesigner.com/sign/transfer?to=${to}&amount=${parseFloat(amount).toFixed(3)}%20${currency}&memo=${encodeURIComponent(memo)}`;
        popup_center(sc_url, `${currency} Payment`, 500, 560);
    }

	function get_currency(amount) {
		return amount.substr(amount.indexOf(' ') + 1);
	}

	function add_commas(nStr, currency) {
		nStr += '';
		x = nStr.split('.');
		x1 = x[0];
		x2 = x.length > 1 ? '.' + x[1] : ''
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
		}

		if (x2 == '' && currency == 1) x2 = '.00';
		if (x2.length == 2 && currency == 1) x2 = x2 + '0';

		return x1 + x2;
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
		hive_engine_transfer,
		get_edition_str,
		param,
		try_parse,
		validate_acct_name,
		account_exists,
		get_ability_image,
		get_stat_image,
		lookup_effect,
		get_level,
		asset_url,
		parse_payment,
		get_abilities,
		get_starter_card,
		loadScript,
		loadScriptAsync,
		browser_payment_available,
		sc_custom_json,
		getURLParameter,
		guild_discounted_cost,
		switch_rpc,
		post,
		get_rpc_nodes,
		set_rpc_nodes,
		server_date,
		get_chest_type_from_chest_tier,
		get_chest_qty,
		summoner_has_ability,
		is_color_aligned,
		get_previous_season_highest_acheived_league,
		get_version,
		get_currency,
		add_commas,
        hive_signer_payment
	 };
})();
