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
				$.get(url, url, GitHubNodal.Util.catch_api_call(callback), "json");
			},

			post: function (url, data, callback) {
				$.post(url, data, GitHubNodal.Util.catch_api_call(callback), "json");
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
		var social_network = [];
		var handle_followers = function (data, text_status, jqXHR) {
			log("Follower count: " + data.length);
			_.each(data, function (follower) {
				GitHubNodal.adjust_user_detail(follower);
				follower["relationship"] = ["follower"];
				social_network.push(follower);
			});
			GitHubNodal.Util.get(GitHubNodal.api_url("users/" + username + "/following"), handle_following);
		};
		var handle_following = function (data, text_status, jqXHR) {
			log("Following count: " + data.length);
			_.each(data, function (following) {
				var existing_relationship = _.find(social_network, function (r) { return r.id === following.id; });
				if (existing_relationship) {
					existing_relationship["relationship"].push("following");
				} else {
					GitHubNodal.adjust_user_detail(following);
					following["relationship"] = "following";
					social_network.push(following);
				}
			});

			if (callback) callback(social_network);
		};

		GitHubNodal.Util.get(GitHubNodal.api_url("users/" + username + "/followers"), handle_followers);
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
				follow_requests.push(
					$.ajax({
						type: "PUT",
						url: GitHubNodal.api_url("user/following/" + username)
					})
				);
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
})();