
var doc = document;
var base_url = 'https://mai.dev';
var api_prefix = '/api/v1';
var api_route = '/stash/extension'
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

	// active tab must contain url
	if (!tab || !tab.url || tab.url.indexOf('http') !== 0) {
		text = getMessage('save_abort_message');
		setMessage(popup_id, text);
		return;
	}

	// user data
	if (!items.token) {
		text = getMessage('save_settings_message');
		setMessage(popup_id, text);
		return;
	}

	var token = items.token.split(':');

	if (token.length !== 3) {
		text = getMessage('save_invalid_token_message');
		setMessage(popup_id, text);
		return;
	}

	// prepare fetch request
	var fetchUrl = base_url + api_prefix + api_route;
	var fetchOpts = {
		method: 'POST'
		, headers: {
			'Accept': 'application/json'
			, 'Content-Type': 'application/json'
		}
		, body: JSON.stringify({
			url: tab.url
			, title: tab.title
			, favicon: tab.favIconUrl
			, user: token[0]
			, name: token[1]
			, pass: token[2]
		})
	};

	fetch(fetchUrl, fetchOpts).then(function (res) {
		try {
			return res.json();
		} catch(e) {
			// console.debug(e);
		}
		return null;
	}).then(function (json) {
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
		var title = tab.title || 'unknown title';
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
			token: ''
		}, function (items) {
			sharePage(tabs, items);
		});
	});
};

doc.addEventListener('DOMContentLoaded', share);
