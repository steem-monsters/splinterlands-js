splinterlands.Guild = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);
	}
}