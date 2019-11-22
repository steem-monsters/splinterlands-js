splinterlands.League = class {
	constructor(rating) {
		this.rating = rating;
	}

	get id() {
		if(this.rating < 100)
			return 0;

		if(this.rating >= 4700)
			return 15;

		if(this.rating >= 4200)
			return 14;

		if(this.rating >= 3700)
			return 13;

		return Math.min(parseInt((this.rating - 100) / 300) + 1, 15);
	}

	get level() {
		return Math.max(Math.min(Math.floor((this.id - 1) / 3) + 1, 4), 0);
	}

	get name() {
		if(this.id == 0)
			return this.group_name;
			
		var tier = (this.id - 1) % 3;
		return this.group_name + ' ' + (tier == 0 ? 'III' : (tier == 1 ? 'II' : 'I'));
	}

	get group_name() {
		if(this.id == 0)
			return 'Novice';
			
		return this.id < 4 ? 'Bronze' : (this.id < 7 ? 'Silver' : (this.id < 10 ? 'Gold' : (this.id < 13 ? 'Diamond' : 'Champion')));
	}

	get image() {
		return `https://s3.amazonaws.com/steemmonsters/website/icons/leagues/league_${this.id}.png`;
	}

	get min_rating() {
		if(this.id == 0)
			return 0;

		if(this.id == 15)
			return 4700;

		if(this.id == 14)
			return 4200;

		return (this.id - 1) * 300 + 100;
	}

	get max_rating() {
		if(this.id == 15)
			return -1;

		if(this.id == 14)
			return 4700;

		if(this.id == 13)
			return 4200;

		return this.id * 300 + 100;
	}

	get progress() {
		return +((this.rating - this.min_rating) / (this.max_rating - this.min_rating) * 100).toFixed(2);
	}

	get rating_reset() {
		return this.id >= 10 ? 1900 + (this.id - 10) * 300 : Math.max((this.id - 1) * 200, 0);
	}

	get level_limits() {
		return [1,2,3,4].map(l => Math.max(Math.round((10 - (l - 1) * 2) / 4 * this.level), 1));
	}

	get season_rewards() {
		return parseInt(splinterlands.get_settings().season.reward_packs[this.id]);
	}

	static list() {
		return [0, 100, 400, 700, 1000, 1300, 1600, 1900, 2200, 2500, 2800, 3100, 3400, 3700, 4200, 4700].map(r => new splinterlands.League(r));
	}
}