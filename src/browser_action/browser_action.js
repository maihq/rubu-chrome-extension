
var doc = document;
var base_url = 'https://mai.dev';
var api_prefix = '/api/v1';
var refresh_route = '/refresh';
var stash_route = '/stash';
var popup_id = 'share-popup-message';

function clearPopup (id) {
	var container = doc.getElementById(id);
	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}
}

function setMessage (id, msg) {
	// clean up popup first
	clearPopup(id);

	// update popup
	msg = msg || 'unknown message';
	msg = doc.createTextNode(msg);
	doc.getElementById(id).appendChild(msg);
};

function getMessage (name, data) {
	data = data || [];
	return chrome.i18n.getMessage(name, data);
};

function sharePage (tabs, items) {
	// must have an active tab
	if (tabs.length === 0) {
		return;
	}

	var tab = tabs[0];
	var text;

	// active tab must contains valid url
	if (!tab || !tab.url || tab.url.indexOf('http') !== 0) {
		text = getMessage('save_abort_message');
		setMessage(popup_id, text);
		return;
	}

	// app password should be valid
	if (!items.app_data) {
		text = getMessage('save_settings_message');
		setMessage(popup_id, text);
		return;
	}

	var app_data = items.app_data || '';
	var app_token = items.app_token || '';

	if (app_data.split(':').length !== 2) {
		text = getMessage('save_invalid_token_message');
		setMessage(popup_id, text);
		return;
	}

	// prepare fetch request
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

	fetch(stashUrl, stashOpts).then(function (res) {
		var json;
		try {
			json = res.json();
		} catch(e) {
			// console.debug(e);
		}

		if (!json) {
			text = getMessage('save_invalid_json_message');
			setMessage(popup_id, text);
			return;
		}

		if (!json.ok) {
			text = getMessage('save_failed_message', [json.message]);
			setMessage(popup_id, text);
			return;
		}

		// create popup message
		var title = tab.title || tab.url;
		text = getMessage('save_success_message', [title]);
		setMessage(popup_id, text);
	}).catch(function () {
		text = getMessage('save_server_down_message');
		setMessage(popup_id, text);
	});
};

function share() {
	var text = getMessage('save_progress_message');
	setMessage(popup_id, text);

	chrome.tabs.query({
		active: true
		, lastFocusedWindow: true
	}, function (tabs) {
		chrome.storage.sync.get({
			app_data: ''
			, app_token: ''
		}, function (items) {
			sharePage(tabs, items);
		});
	});
};

doc.addEventListener('DOMContentLoaded', share);
