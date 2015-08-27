
'use strict';

var doc = document;
var base_url = 'https://rubu.me';
var api_prefix = '/api/v1';
var refresh_route = '/refresh';
var stash_route = '/stash';
var popup_id = 'app-popup-message';
var app_data_key = 'app-data';
var app_token_key = 'app-token';

/**
 * Store structure
 *
 * @param   String  data   App data
 * @param   String  token  App token
 * @return  Object
 */
function getAppStore (data, token) {
	var store = {};
	store[app_data_key] = data || '';
	store[app_token_key] = token || '';

	return store;
};

/**
 * DOM helper, clear child elements from a container node
 *
 * @param   String  id  Container id
 * @return  Void
 */
function clearPopup (id) {
	var container = doc.getElementById(id);
	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}
};

/**
 * DOM helper, set text node inside a container node
 *
 * @param   String  id   Container id
 * @param   String  msg  Text node content
 * @return  Void
 */
function setMessage (id, msg) {
	clearPopup(id);

	msg = msg || 'unknown message';
	var text = doc.createTextNode(msg);

	doc.getElementById(id).appendChild(text);
};

/**
 * Locale helper, load localized message
 *
 * @param   String  name  Message name
 * @param   Array   data  Message data
 * @return  String
 */
function getMessage (name, data) {
	data = data || [];
	return chrome.i18n.getMessage(name, data);
};

/**
 * JSON response parser
 *
 * @param   Object  res  Fetch response
 * @return  Mixed
 */
function parseJson (res) {
	var json = null;
	try {
		json = res.json();
	} catch(e) {
		//console.debug(e);
	}

	return json;
};

/**
 * Handle page share event
 *
 * @param   Array   tabs   A list of tabs
 * @param   Object  items  Store data
 * @param   Number  retry  Number of retry
 * @return  Void
 */
function sharePage (tabs, items, retry) {
	// retry over limit
	if (retry > 1) {
		text = getMessage('save_invalid_token_message');
		setMessage(popup_id, text);
		return;
	}

	// must have an active tab
	if (tabs.length === 0) {
		return;
	}

	var tab = tabs[0];
	var text;

	// must have a valid url
	if (!tab || !tab.url || tab.url.indexOf('http') !== 0) {
		text = getMessage('save_abort_message');
		setMessage(popup_id, text);
		return;
	}

	// app data must exists
	if (!items[app_data_key]) {
		text = getMessage('save_settings_message');
		setMessage(popup_id, text);
		return;
	}

	// prepare fetch request
	var app_data = items[app_data_key] || '';
	var app_token = items[app_token_key] || '';

	var stashUrl = base_url + api_prefix + stash_route;
	var refreshUrl = base_url + api_prefix + refresh_route;

	var stashOpts = {
		method: 'POST'
		, headers: {
			'Accept': 'application/json'
			, 'Content-Type': 'application/json'
		}
		, body: JSON.stringify({
			url: tab.url
			, title: tab.title
			, favicon: tab.favIconUrl
			, token: app_token
		})
	};
	var refreshOpts = {
		method: 'POST'
		, headers: {
			'Accept': 'application/json'
			, 'Content-Type': 'application/json'
		}
		, body: JSON.stringify({
			password: app_data
		})
	};

	// send request
	fetch(stashUrl, stashOpts).then(function (res) {
		return parseJson(res);
	}).then(function (json) {
		// invalid json
		if (!json) {
			text = getMessage('save_invalid_json_message');
			setMessage(popup_id, text);
			return;
		}

		// error response
		if (!json.ok) {
			// missing token or invalid token, let's refresh it
			if ((json.code === 400 && json.data && json.data.token) || json.code === 403) {
				chrome.storage.sync.remove(app_token_key);

				// TODO: refactor
				return fetch(refreshUrl, refreshOpts).then(function (res) {
					return parseJson(res);
				}).then(function (json) {
					// invalid json
					if (!json) {
						text = getMessage('save_invalid_json_message');
						setMessage(popup_id, text);
						return;
					}

					// show failure message
					if (!json.ok) {
						text = getMessage('save_failed_message', [json.message]);
						setMessage(popup_id, text);
						return;
					}

					// update token and retry
					var token = json.data.user + ':' + json.data.app + ':' + json.data.token;
					var store = {};
					store[app_token_key] = token;

					chrome.storage.sync.set(store, function () {
						items[app_token_key] = token;
						sharePage(tabs, items, retry + 1);
					});
				});
			}

			// show failure message
			text = getMessage('save_failed_message', [json.message]);
			setMessage(popup_id, text);
			return;
		}

		// show success message
		var title = tab.title || tab.url;
		text = getMessage('save_success_message', [title]);
		setMessage(popup_id, text);

	}).catch(function () {
		// handle network error
		text = getMessage('save_server_down_message');
		setMessage(popup_id, text);
	});
};

/**
 * Init share popup
 *
 * @return  Void
 */
function share() {
	// i18n
	var text = getMessage('save_progress_message');
	setMessage(popup_id, text);

	// prepare store and query
	var store = getAppStore();
	var query = {
		active: true
		, lastFocusedWindow: true
	};

	// get tabs and store data
	setTimeout(function () {
		chrome.tabs.query(query, function (tabs) {
			chrome.storage.sync.get(store, function (items) {
				sharePage(tabs, items, 0);
			});
		});
	}, 10);
};

doc.addEventListener('DOMContentLoaded', share);
