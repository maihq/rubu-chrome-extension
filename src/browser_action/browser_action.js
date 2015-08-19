
var doc = document;
var base_url = 'https://mai.dev/api/v1';
var popup_id = 'share-popup-message';

function clearPopup (id) {
	var container = doc.getElementById(id);
	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}
}

function setCustomMessage (id, elem) {
	// clean up popup first
	clearPopup(id);

	// update popup
	doc.getElementById(id).appendChild(elem);
};

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

	// active tab must contain url
	if (!tab || !tab.url || tab.url.indexOf('http') !== 0) {
		return;
	}

	// send to server
	var fetchUrl = base_url + '/stash';
	var fetchOpts = {
		method: 'POST'
		, headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
		, body: 'url=' + encodeURIComponent(tab.url) + '&title=' + tab.title
	};

	fetch(fetchUrl, fetchOpts).then(function (res) {
		// create popup message
		var title = tab.title || 'unknown title';
		var text;

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

	chrome.tabs.query({ active: true, lastFocusedWindow: true }, sharePage);
};

doc.addEventListener('DOMContentLoaded', share);
