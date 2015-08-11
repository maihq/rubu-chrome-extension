
var doc = document;
var base_url = 'https://rubu.me';

function setMessage (id, msg) {
	msg = msg || '';
	doc.getElementById(id).innerHTML = msg;
};

function getMessage (name, data) {
	data = data || '';
	return chrome.i18n.getMessage(name, data);
};

function getMessageName (id) {
	return doc.getElementById(id).textContent;
};

function sharePage (tabs) {
	if (tabs.length !== 1) {
		return;
	}

	var tab = tabs[0];

	if (!tab || !tab.url || tab.url.indexOf('http') !== 0) {
		return;
	}

	window.open(base_url + '/?share=' + encodeURIComponent(tab.url));
};

function init() {
	var id = 'share-popup-message';
	var name = getMessageName(id);
	var message = getMessage(name);
	setMessage(id, message);

	chrome.tabs.query({ active: true, lastFocusedWindow: true }, sharePage);
};

doc.addEventListener('DOMContentLoaded', init);
