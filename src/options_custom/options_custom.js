
var doc = document;
var form_id = 'app-form';
var form_label_id = 'app-data-label';
var form_button_id = 'app-data-button';
var form_input_id = 'app-data';
var form_status_id = 'app-form-status';

function clearPopup (id) {
	var container = doc.getElementById(id);
	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}
}

function setMessage (id, msg) {
	clearPopup(id);

	msg = msg || 'unknown message';
	msg = doc.createTextNode(msg);
	doc.getElementById(id).appendChild(msg);
};

function getMessage (name, data) {
	data = data || [];
	return chrome.i18n.getMessage(name, data);
};

function setInput (value) {
	doc.getElementById(form_input_id).value = value || '';
};

function restoreOptions () {
	chrome.storage.sync.get({
		'app-data': ''
	}, function (items) {
		setInput(items.token);
	});
};

function saveOptions (ev) {
	ev.preventDefault();

	var input = doc.getElementById(form_input_id);
	console.log(input.value);

	chrome.storage.sync.set({
		'app-data': input.value
	}, function () {
		setMessage(form_status_id, getMessage('options_message'));
	});
};

function options () {
	setMessage(form_label_id, getMessage('options_token'));
	setMessage(form_button_id, getMessage('options_save'));
	doc.getElementById(form_id).addEventListener('submit', saveOptions);
	restoreOptions();
};

doc.addEventListener('DOMContentLoaded', options);
