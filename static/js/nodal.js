(function () {
	var root = this;
	var Nodal = root.Nodal = {};
	var log = function (msg) { console.log(msg); };

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
				return $.get(url, url, GitHubNodal.Util.catch_api_call(callback), "json");
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

	GitHubNodal.get_social_network = function (username, callback) {
		$.when(
			GitHubNodal.Util.get(GitHubNodal.api_url("users/" + username + "/following")),
			GitHubNodal.Util.get(GitHubNodal.api_url("users/" + username + "/followers"))
		).done(function (following, followers) {
			var social_network = _.union(following[0], followers[0]);
			_.each(social_network, GitHubNodal.adjust_user_detail);
			callback(social_network);
		});
	};

	GitHubNodal.get_user_detail = function (username, callback) {
		var handler = function (data, text_status, jqXHR) {
			GitHubNodal.adjust_user_detail(data);
			log("Load user detail for " + data.login);
			callback(data);
		};

		if (username) {
			GitHubNodal.Util.get(GitHubNodal.api_url("users/" + username), handler);
		} else if (GitHubNodal.get_access_token()) {
			GitHubNodal.Util.get(GitHubNodal.api_url("user", handler, "json"), handler);
		}
	};

	GitHubNodal.follow_users = function(usernames, callback) {
		if(usernames.length > 0){
			var follow_requests = [];

			_.each(usernames, function(username){
				follow_requests.push(GitHubNodal.Util.put(GitHubNodal.api_url("user/following/" + username)));
			});

			$.when(follow_requests).then(function(){
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
			return "?access_token=" + github_access_token;
		else
			return "";
	}

	GitHubNodal.api_url = function (endpoint) {
		return GitHubNodal.API_BASE_URL + endpoint + GitHubNodal.get_access_token();
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