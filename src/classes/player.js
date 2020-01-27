splinterlands.Player = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);

    this.league = new splinterlands.League(data.rating);
		this.quest = new splinterlands.Quest(data.quest || {});

		if(!this.name && this.player)
			this.name = this.player;

		if(data.guild && typeof data.guild == 'object')
			this.guild = new splinterlands.Guild(data.guild);
		else if(data.guild_id || (data.guild && typeof data.guild == 'string'))
			this.guild = new splinterlands.Guild({ id: data.guild_id || data.guild, name: data.guild_name, data: data.guild_data });
	}

	async load_balances() {
		this.balances = await splinterlands.api('/players/balances');
		return this.balances;
	}

	async get_balance(token, refresh) {
		if(!this.balances || refresh)
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

		this.league = new splinterlands.League(data.rating);
		this.quest = new splinterlands.Quest(data.quest || {});

		if(data.guild)
			this.guild = new splinterlands.Guild(data.guild);
	}

	get ecr() {
		return Math.min((isNaN(parseInt(this.capture_rate)) ? 10000 : this.capture_rate) + (splinterlands.get_settings().last_block - this.last_reward_block) * splinterlands.get_settings().dec.ecr_regen_rate, 10000);
	}

	get profile_image() {
		return `${splinterlands.get_config().api_url}/players/avatar/${this.name}`;
		//return `https://steemitimages.com/u/${this.name}/avatar`;
	}

	get avatar_frame() {
		return `https://steemmonsters.s3.amazonaws.com/website/icons/avatars/avatar-frame_${this.league.group_name.toLowerCase()}.png`
  }
  
  get quest_rewards() { 
    if(!this.quest)
      return null;

    return this.quest.rewards(this.league.id);
	}

	get starter_edition() {
		if(!this._starter_edition)
			this._starter_edition = (new Date(this.join_date) < new Date(splinterlands.get_settings().untamed_edition_date)) ? 1 : 4;

		return this._starter_edition;
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
		avatar_img.setAttribute('style', `height: ${(size * 0.667).toFixed(2)}px; width: ${(size * 0.667).toFixed(2)}px; border-radius: ${(size * 0.667).toFixed()}px; position: absolute; left: ${(size / 6).toFixed(2)}px; top: -${(size * (5/6)).toFixed(2)}px;`);
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
		let response = await splinterlands.api('/players/set_avatar', { avatar_id }); 

		if(response && response.success)
			this.avatar_id = avatar_id;

		return response;
	}

	async recent_teams() { return await splinterlands.api('/players/recent_teams', { player: this.name }); }

	async last_team() {
		let teams = await this.recent_teams();

		if(!teams || teams.length == 0) 
			return null;

		let team = teams[0];
		team.summoner = new splinterlands.Card(team.summoner);
		team.monsters = team.monsters.map(m => new splinterlands.Card(m));
		return team;
	}

	static async load(name) {
		return await new Promise(async (resolve, reject) => {
			let response = await splinterlands.api('/players/details', { name });

			if(response.error)
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
}