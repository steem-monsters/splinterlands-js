splinterlands.Settings = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);

		this.new_rewards = this.new_rewards_season &&  this.new_rewards_season <= this.season.id
  	}
}