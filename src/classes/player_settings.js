splinterlands.PlayerSettings = class {
	static get is_music_muted() {
		return (localStorage.getItem('splinterlands:is_music_muted') == 'true');	
	}

	static set_music_muted(is_muted) {
		localStorage.setItem('splinterlands:is_music_muted', is_muted);	
	}

	static get is_sound_muted() {
		return (localStorage.getItem('splinterlands:is_sound_muted') == 'true');	
	}

	static set_sound_muted(is_muted) {
		localStorage.setItem('splinterlands:is_sound_muted', is_muted);	
	}

	static get team_select_sort() {
		return localStorage.getItem('splinterlands:team_select_sort');	
	}

	static set_team_select_sort(sort_option) {
		return localStorage.getItem('splinterlands:team_select_sort', sort_option);	
	}
}