(function() {
	// From http://stackoverflow.com/a/2117523/3403756
	function generateUUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	}
	
	function storeNewUUID() {
		var uuid = generateUUID();
		localStorage.setItem('uuid', uuid);
		return uuid;
	}
	
	var currentUUID = localStorage.getItem('uuid');
	if (currentUUID == null) {
		storeNewUUID();
	}
	
	window.UUID = {
		get: function() {
			return localStorage.getItem('uuid');
		},
		reset: function() {
			return storeNewUUID();
		}
	};
})();