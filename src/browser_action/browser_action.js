
var doc = document;
var base_url = 'https://mai.dev';
var prefix = '/api/v1';
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

function sharePage (tabs) {
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

	// prepare fetch request
	var fetchUrl = base_url + prefix + '/stash';
	var fetchOpts = {
		method: 'POST'
		, headers: {
			'Accept': 'application/json'
			, 'Content-Type': 'application/json'
		}
		, body: JSON.stringify({
			url: tab.url
			, title: tab.title
			, favicon: tab.favicon
		})
	};

	fetch(fetchUrl, fetchOpts).then(function (res) {
		// create popup message
		var title = tab.title || 'unknown title';

		if (!res.ok) {
			text = getMessage('save_failed_message', [title]);
			setMessage(popup_id, text);
			return;
		}

		text = getMessage('save_success_message', [title]);
		setMessage(popup_id, text);
	});
};

function share() {
	var text = getMessage('save_progress_message');
	setMessage(popup_id, text);

	chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
		sharePage(tabs);
	});
};

doc.addEventListener('DOMContentLoaded', share);
