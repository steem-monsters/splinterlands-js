splinterlands.Guild = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);

		this.data = splinterlands.utils.try_parse(data.data);
		let buildings = splinterlands.utils.try_parse(data.buildings);

		if(buildings)
			this.buildings = Object.keys(buildings).map(k => new splinterlands.GuildBuilding(this.id, k, buildings[k]));

		this.crest = this.data ? this.data.crest : {};
	}

	static async list(name, membership_type, language) {
		if(!name)
			name = '';

		if(!membership_type)
			membership_type = '';

		if(!language)
			language = '';

		return (await splinterlands.api('/guilds/list', { name, membership_type, language })).map(g => new splinterlands.Guild(g));
	}

	static async find(id) {
		return new splinterlands.Guild(await splinterlands.api('/guilds/find', { id }));
	}

	get max_members() {
		return splinterlands.get_settings().guilds.guild_hall.member_limit[this.level - 1];
	}

	get_building(type) {
		return this.buildings.find(b => b.type == type);
	}

	get crest_banner_image() {
		let banners = ['black', 'blue', 'gold', 'green', 'mint', 'orange', 'pink', 'purple', 'red', 'silver', 'teal', 'yellow'];
		let banner = banners.includes(this.crest.banner) ? this.crest.banner : 'black';

		return `https://steemmonsters.s3.amazonaws.com/website/guilds/banners/bg_banner_${banner}.png`;
	}

	get crest_decal_image() {
		let decals = ['axe', 'bolt', 'book', 'globe', 'hand', 'helm', 'shield', 'skull', 'staff', 'sword', 'tree', 'wolf'];
		let decal = decals.includes(this.crest.decal) ? this.crest.decal : null;

		return `https://steemmonsters.s3.amazonaws.com/website/guilds/decals/img_guild_${decal}.png`;
	}

	async get_members() {
		return await splinterlands.api('/guilds/members', { guild_id: this.id });
	}

	async get_chat() {
		let history = await splinterlands.api('/players/chat_history', { guild_id: this.id });
		history.forEach(h => h.player = new splinterlands.Player(h.player));
		return history;
	}

	render_crest(size) {
		let banners = ['black', 'blue', 'gold', 'green', 'mint', 'orange', 'pink', 'purple', 'red', 'silver', 'teal', 'yellow'];
		let banner = banners.includes(this.crest.banner) ? this.crest.banner : 'black';

		let decals = ['axe', 'bolt', 'book', 'globe', 'hand', 'helm', 'shield', 'skull', 'staff', 'sword', 'tree', 'wolf'];
		let decal = decals.includes(this.crest.decal) ? this.crest.decal : null;

		size = size || 200;
		let decal_size = Math.round(size / 200 * 140);
		let decal_left = (size - decal_size) / 2 + 1;
		let decal_top = (size - decal_size) / 4;

		let crest_container = document.createElement('div');
		crest_container.setAttribute('class', 'sl-guild-crest');

		if(decal) {
			let rel_container = document.createElement('div');
			rel_container.setAttribute('class', 'sl-rel-pos');

			let decal_img = document.createElement('img');
			decal_img.setAttribute('src', `https://steemmonsters.s3.amazonaws.com/website/guilds/decals/img_guild_${decal}.png`);
			decal_img.setAttribute('style', `position: absolute; width: ${decal_size}px; height: ${decal_size}px; left: ${decal_left}; top: ${decal_top};`);
			rel_container.appendChild(decal_img);
			
			crest_container.appendChild(rel_container);
		}
		
		let banner_img = document.createElement('img');
		banner_img.setAttribute('src', `https://steemmonsters.s3.amazonaws.com/website/guilds/banners/bg_banner_${banner}.png`);
		banner_img.setAttribute('style', `width: ${size}px; height: ${size}px;`);
		crest_container.appendChild(banner_img);

		return crest_container;
	}

	get shop_discount() {
		if(!this.quest_lodge_level)
			return 0;
			
		return splinterlands.get_settings().guilds.shop_discount_pct[this.quest_lodge_level - 1];
	}

	async post_announcement(subject, message, is_private) {
		let data = {
			guild_id: this.id,
			subject: subject,
			message: message,
			is_private: is_private
		};
		return await splinterlands.api('/guilds/post_announcement', data);
	}

	async delete_announcement(announcement_id) {		
		return await splinterlands.api('/guilds/delete_announcement', {id : announcement_id });
	}
}