(function () {
	var root = this;
	var Nodal = root.Nodal = {};
	var log = function (msg) { if (window.console) console.log(msg); };

	var listeners = {};
	var signal_listeners = function (component, data) {
		if (listeners[component]) {
			_.each(listeners[component], function (func) { func(data); });
		}
	};

	var GitHubNodal = {
		API_BASE_URL: "https://api.github.com/",

		Util: {
			catch_api_call: function (callback) {
				return function (data, text_status, jqXHR) {
					GitHubNodal.Stats.API_RateLimit_Limit = jqXHR.getResponseHeader("X-RateLimit-Limit");
					GitHubNodal.Stats.API_RateLimit_Remaining = jqXHR.getResponseHeader("X-RateLimit-Remaining");

					signal_listeners("Stats", GitHubNodal.Stats);

					if (callback) callback(data, text_status, jqXHR);
				}
			},

			get: function (url, callback) {
				return $.get(url, GitHubNodal.Util.catch_api_call(callback), "json");
			},

			put: function (url, callback) {
				return $.ajax({
					type: 'PUT',
					url: url,
					success: GitHubNodal.Util.catch_api_call(callback),
					dataType: "json"
				});
			},

			add_listener: function (component, callback) {
				if (!listeners[component])
					listeners[component] = [];
				listeners[component].push(callback);
			}
		},

		Stats: {
			API_RateLimit_Limit: 0,
			API_RateLimit_Remaining: 0,
		}
	};

	GitHubNodal.get_social_network = function (user, callback, next_link) {
		var page_size = 100;
		var social_network = [];

		var new_next_link = null;
		var intercept_new_next_link = function (data, text_status, jqXHR) {
			var link = jqXHR.getResponseHeader("Link");
			var m = /<([^>]+)>; rel="next"/.exec(link);
			if (m) new_next_link = m[1];
		}
		var load_more = function (_user, _callback) {
			return GitHubNodal.get_social_network(user, _callback, new_next_link);
		};

		var rel = "followers";
		var params = ["per_page=" + page_size];
		var url = next_link || GitHubNodal.api_url("users/" + user.login + "/" + rel, params);

		$.when(
			GitHubNodal.Util.get(url, intercept_new_next_link)
		).done(function (network) {
			var network_length = network.length, network_index = 0, connection,
				sn_start_index = social_network.length, sn_end_index;
			for (; network_index < network_length; ++network_index) {
				connection = network[network_index];
				if (!_.find(social_network, function (u) { return u.id === connection.id; })) {
					GitHubNodal.adjust_user_detail(connection);
					social_network.push(connection);
				}
			}
			sn_end_index = social_network.length - 1;

			log("Loaded connections for " + user.login + " " + social_network[sn_start_index].id + "..." + social_network[sn_end_index].id);
			if (social_network.length < user.followers) {
				callback(social_network, load_more);
			} else {
				callback(social_network);
			}
		});
	};

	GitHubNodal.get_user_detail = function (user, callback) {
		var handler = function (data, text_status, jqXHR) {
			GitHubNodal.adjust_user_detail(data);
			log("Load user detail for " + data.login);
			callback(data);
		};

		var endpoint = null;
		if (user) {
			endpoint = "users/" + (user.login || user);
		} else if (GitHubNodal.get_access_token()) {
			endpoint = "user";
		}

		if (endpoint)
			GitHubNodal.Util.get(GitHubNodal.api_url(endpoint), handler);
	};

	GitHubNodal.follow_users = function(usernames, callback) {
		if(usernames.length > 0){
			var follow_requests = [];

			_.each(usernames, function(username){
				follow_requests.push(GitHubNodal.Util.put(GitHubNodal.api_url("user/following/" + username)));
			});

			$.when.apply(this, follow_requests).
			then(function(){
				if(callback){
					callback(true);
				}
			}, function(){
				if(callback){
					callback(false);
				}
			});
		}
	};

	GitHubNodal.adjust_user_detail = function (user) {
		user.name = user.login;
		user.displayName = user.login;
		user.scaledPictureURL = user.avatar_url;
	};

	GitHubNodal.get_access_token = function () {
		if (window.github_access_token)
			return "access_token=" + github_access_token;
		else
			return "";
	}

	GitHubNodal.api_url = function (endpoint, query_params) {
		var qp = [];
		if (GitHubNodal.get_access_token())
			qp.push(GitHubNodal.get_access_token())
		if (query_params)
			qp = _.union(qp, query_params)

		return GitHubNodal.API_BASE_URL + endpoint + "?" + qp.join("&");
	};

	GitHubNodal.search = function (term, callback) {
		var matches = [];

		var handle_keyword_results = function (data, text_status, jqXHR) {
			if (data && data.users) {
				_.each(data.users, function (user) {
					matches.push(user);
				});
			}

			if (callback) {
				callback(matches);
			} else {
				log(matches);
			}
		};

		GitHubNodal.Util.get(GitHubNodal.api_url("legacy/user/search/" + term), handle_keyword_results);
	};

	Nodal.get_social_network = GitHubNodal.get_social_network;
	Nodal.get_user_detail = GitHubNodal.get_user_detail;
	Nodal.search = GitHubNodal.search;
	Nodal.follow_users = GitHubNodal.follow_users;
	Nodal.add_stats_listener = function (callback) { GitHubNodal.Util.add_listener("Stats", callback); };
	Nodal.has_access_token = GitHubNodal.get_access_token;
})();