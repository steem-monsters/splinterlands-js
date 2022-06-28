splinterlands.Player = class {
    constructor(data) {
        Object.keys(data).forEach(k => this[k] = data[k]);

        this.league = new splinterlands.League(data.rating, data.league);
        this.next_tier = (!this.league.is_max_league) ?
            new splinterlands.League(null, data.league + 1) :
            new splinterlands.League(null, data.league);

        this.quest = new splinterlands.Quest(data.quest || {});

        if (!this.name && this.player)
            this.name = this.player;

        if (data.guild && typeof data.guild == 'object')
            this.guild = new splinterlands.Guild(data.guild);
        else if (data.guild_id || (data.guild && typeof data.guild == 'string'))
            this.guild = new splinterlands.Guild({
                id: data.guild_id || data.guild,
                name: data.guild_name,
                data: data.guild_data
            });

        if (this.season_reward)
            this.season_reward = new splinterlands.Season(this.season_reward);

        this.has_collection_power_changed = true;
        this._player_properties = null;
    }

    async load_balances() {
        this.balances = await splinterlands.api('/players/balances');
        return this.balances;
    }

    async get_balance(token, refresh) {
        if (!this.balances || refresh)
            await this.load_balances();

        let balance = this.balances.find(b => b.token == token);
        return balance ? parseFloat(balance.balance) : 0;
    }

    balance(token) {
        let balance = this.balances.find(b => b.token == token);
        return balance ? parseFloat(balance.balance) : 0;
    }

    async refresh() {
        let data = await splinterlands.api('/players/refresh');
        Object.keys(data).forEach(k => this[k] = data[k]);

        this.league = new splinterlands.League(data.rating, data.league);
        this.quest = new splinterlands.Quest(data.quest || {});

        if (data.guild)
            this.guild = new splinterlands.Guild(data.guild);
    }

    get ecr() {
        return Math.min((isNaN(parseInt(this.capture_rate)) ? 10000 : this.capture_rate) + (splinterlands.get_settings().last_block - this.last_reward_block) * splinterlands.get_settings().dec.ecr_regen_rate, 10000);
    }

    get profile_image() {
        return isNaN(this.avatar_id) ?
            `${splinterlands.get_config().api_url}/players/avatar/${this.name}` :
            `https://d36mxiodymuqjm.cloudfront.net/website/icons/avatars/avatar_${this.avatar_id}.png`;
    }

    get avatar_frame() {
        return `https://d36mxiodymuqjm.cloudfront.net/website/icons/avatars/avatar-frame_${this.league.group_name.toLowerCase()}.png`
    }

    get display_name() {
        return this._display_name || this.name;
    }

    set display_name(val) {
        this._display_name = val;
    }

    get quest_rewards() {
        if (!this.quest)
            return null;

        return this.quest.rewards(this.league.id);
    }

    render_avatar(size) {
        let avatar = document.createElement('div');

        let frame_img = document.createElement('img');
        frame_img.setAttribute('src', this.avatar_frame);
        frame_img.setAttribute('style', `height: ${size}px;`);
        avatar.appendChild(frame_img);

        let avatar_container = document.createElement('div');
        avatar_container.setAttribute('class', 'sl-rel-pos');

        let avatar_img = document.createElement('img');
        avatar_img.setAttribute('src', this.profile_image);
        avatar_img.setAttribute('style', `height: ${(size * 0.667).toFixed(2)}px; width: ${(size * 0.667).toFixed(2)}px; border-radius: ${(size * 0.667).toFixed()}px; position: absolute; left: ${(size / 6).toFixed(2)}px; top: -${(size * (5 / 6)).toFixed(2)}px;`);
        avatar_container.appendChild(avatar_img);
        avatar.appendChild(avatar_container);

        return avatar;
    }

    async get_wallets() {
        return await splinterlands.api('/players/wallets');
    }

    async get_referrals() {
        return await splinterlands.api('/players/referrals');
    }

    async update_avatar(avatar_id) {
        let response = await splinterlands.api('/players/set_avatar', {avatar_id});

        if (response && response.success)
            this.avatar_id = avatar_id;

        return response;
    }

    async recent_teams() {
        return await splinterlands.api('/players/recent_teams', {player: this.name});
    }

    static async get_recent_teams_encrypted(lookup_name, decrypt_key) {
        return await splinterlands.api('/players/recent_teams', {player: lookup_name, decrypt_key});
    }

    async last_team() {
        let teams = await this.recent_teams();

        if (!teams || teams.length == 0)
            return null;

        let team = teams[0];
        team.summoner = new splinterlands.Card(team.summoner);
        team.monsters = team.monsters.map(m => new splinterlands.Card(m));
        return team;
    }

    static async load(name) {
        return await new Promise(async (resolve, reject) => {
            let response = await splinterlands.api('/players/details', {name});

            if (response.error)
                reject(response);
            else
                resolve(new splinterlands.Player(response));
        });
    }

    send_chat(message, is_global) {
        splinterlands.socket.send({
            type: 'post_chat_msg',
            guild_id: is_global ? 'global' : this.guild.id,
            message: message
        });
    }

    subscribe_global_chat(subscribe) {
        splinterlands.socket.send({
            type: 'subscribe',
            room: 'global',
            subscribe
        });
    }

    update_rating(new_rating, new_league) {
        this.rating = new_rating;
        this.league = new splinterlands.League(new_rating, new_league);
    }

    async request_keys() {
        if (!this.starter_pack_purchase)
            return {error: `You must purchase the Summoner's Spellbook before you may request your account keys.`};

        if (this.has_keys)
            return {error: `Account keys have already been requested from this account and may only be requested once. Please go to https://support.splinterlands.com/ or on Discord for help.`};

        return await splinterlands.api('/players/request_keys');
    }

    get points_until_next_league() {
        return Math.max(this.league.max_rating - this.rating, 0);
    }

    get power_until_next_league() {
        return Math.max(this.league.max_power - this.collection_power, 0);
    }

    get power_progress() {
        let progress = +((this.collection_power - this.league.min_power) / (this.league.max_power - this.league.min_power) * 100).toFixed(2);

        if (progress < 0)
            return 0;
        else if (progress > 100)
            return 100;
        else
            return progress;
    }

    get rating_progress() {
        let progress = +((this.rating - this.league.min_rating) / (this.league.max_rating - this.league.min_rating) * 100).toFixed(2);

        if (progress < 0)
            return 0;
        else if (progress > 100)
            return 100;
        else
            return progress;
    }

    get is_eligible_to_advance() {
        return (!this.league.is_max_league && this.points_until_next_league === 0 && this.power_until_next_league === 0)
    }

    async check_messages(type) {
        return await splinterlands.api('/players/messages', {type: type});
    }

    get max_cp_league() {
        var num = 0;

        for (var index = 0; index < splinterlands.get_leagues_settings().length; index++) {
            if (this.collection_power >= splinterlands.get_leagues_settings()[index].min_power) {
                num = index;
            } else {
                break;
            }
        }

        return num;
    }

    get max_cp_league_name() {
        return splinterlands.get_leagues_settings()[this.max_cp_league].name;
    }

    get need_to_set_username() {
        return (this.starter_pack_purchase && this.use_proxy);
    }

    get pending_season_rewards() {
		if(!this.has_season_focus()) {
			let max_league = this.season_max_league || 0;

			return (max_league > 0 ? splinterlands.get_settings().season.reward_packs[max_league] : '0');
		} else {
			return this.get_current_season_chest_info().chests;
		}
    }

	get_current_season_chest_info() {
		if(this.current_season_player) {
			const chestTier = this.current_season_player.chest_tier;
			const seasonRewardShares = this.current_season_player.rshares;
			return splinterlands.utils.get_chest_qty('season', chestTier, seasonRewardShares);
		}

		const previousSeasonHighestAcheivedLeague = splinterlands.utils.get_previous_season_highest_acheived_league(player.previous_season_player);
		const chestTier = Math.max(Math.floor((previousSeasonHighestAcheivedLeague - 1) / 3), 0);
		const seasonRewardShares = splinterlands.additional_season_rshares_count; // Tally of reward shares earned before a new current_season_player is loaded
		return splinterlands.utils.get_chest_qty('season', chestTier, seasonRewardShares);
	}

	has_season_focus() {
		if (splinterlands.get_settings().new_rewards && this.current_season_player && (this.current_season_player.chest_tier === null || this.current_season_player.chest_tier === undefined)) {
			// this is an edge case and should only happen if a player has logged in right before the season has been reset
			// and still has a chest_tier of null even though this shouldn't be possible when ranked rewards is live
			return false;
		}
		return splinterlands.get_settings().new_rewards;
	}

    async get_player_properties(do_refresh) {
        if (this._player_properties && !do_refresh) {
            return this._player_properties
        } else {
            this._player_properties = (await splinterlands.api(`/player_properties`)).values;
            return this._player_properties;
        }
    }

    async get_player_property(property) {
        return await splinterlands.api(`/player_properties/${property}`);
    }

    async set_player_property(property, value) {
        if (property == 'mobile_tutorial_progress' && value == 'complete') {
            let womplay_id = await this.get_womplay_id();
            if (womplay_id) {
                await splinterlands.ec_api('/womplay/tracking', {womplay_id, event_name: 'completed_tutorial'});
            }
        }
        return await splinterlands.api_post(`/player_properties/${property}`, {value});
    }

    async external_cards(blockchain) {
        let res = await splinterlands.ec_api('/players/external_cards', {player: this.name, blockchain});
        res.cards = res.cards.map(c => new splinterlands.Card(c));
        return res;
    }

    async dec_balances() {
        return await splinterlands.ec_api('/players/dec_balances');
    }

    async get_inventory() {
        return await splinterlands.api('/players/inventory');
    }

    async get_womplay_id() {
        let properties = await this.get_player_properties();
        return (properties.womplay_id) ? properties.womplay_id.value : null;
    }

    async get_last_season_rewards() {
        let result = await splinterlands.api('/players/last_season_rewards', {});
        if (!result || result.error) {
            return result && result.error ? result.error : 'Could not load rewards for this account for the last season.';
        }
        return { rewards: result.rewards.map(r => new splinterlands.RewardItem(r)) };
    }
}
