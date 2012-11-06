(function () {
	var root = this;
	var Nodal = root.Nodal = {};
	var log = function (msg) { console.log(msg); };

	var GitHubNodal = {
		API_BASE_URL: "https://api.github.com/"
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
			$.get(GitHubNodal.api_url("users/" + username + "/following"), handle_following, "json");
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

		$.get(GitHubNodal.api_url("users/" + username + "/followers"), handle_followers, "json");
	};

	GitHubNodal.get_user_detail = function (username, callback) {
		var handler = function (data, text_status, jqXHR) {
			GitHubNodal.adjust_user_detail(data);
			log("Load user detail for " + data.login);
			callback(data);
		};

		if (username) {
			$.get(GitHubNodal.api_url("users/" + username), handler, "json");
		} else {
			$.get(GitHubNodal.api_url("user", handler, "json"), handler, "json");
		}
	};

	GitHubNodal.adjust_user_detail = function (user) {
		user.name = user.login;
		user.displayName = user.login;
		user.scaledPictureURL = user.avatar_url;
	};

	GitHubNodal.get_access_token = function () {
		return github_access_token;
	}

	GitHubNodal.api_url = function (endpoint) {
		return GitHubNodal.API_BASE_URL + endpoint + "?access_token=" + GitHubNodal.get_access_token();
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

		$.get(GitHubNodal.api_url("legacy/user/search/" + term), handle_keyword_results, "json");
	};

	Nodal.get_social_network = GitHubNodal.get_social_network;
	Nodal.get_user_detail = GitHubNodal.get_user_detail;
	Nodal.search = GitHubNodal.search;
})();