(function () {
	window.HQ = window.HQ ? window.HQ : {};

	window.HQ.getFollowers = function (id, callback) {
		//$.getJSON("/followers/" + id, callback);
		var handler = function (network) {
			callback({items:network});
		};
		Nodal.get_social_network(id, handler);
	};

	window.HQ.getPerson = function (id, callback) {
		Nodal.get_user_detail(id, callback);
	}

	window.HQ.getAllPeople = function (callback) {
		//$.getJSON("/people", callback);
		callback({items:[]});
	}
})();
