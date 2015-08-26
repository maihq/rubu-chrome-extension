
'use strict';

var doc = document;
var form_id = 'app-form';
var form_label_id = 'app-data-label';
var form_button_id = 'app-data-button';
var form_input_id = 'app-data';
var form_status_id = 'app-form-status';
var app_data_key = 'app-data';

/**
 * Store structure
 *
 * @param   String  data  App data
 * @return  Object
 */
function getAppStore (data) {
	var store = {};
	store[app_data_key] = data || '';

	return store;
};

/**
 * DOM helper, set input value
 *
 * @param   String  id     Input id
 * @param   String  value  Input value
 * @return  Void
 */
function setInput (id, value) {
	value = value || '';
	doc.getElementById(form_input_id).value = value;
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
 * Display existing options
 *
 * @return  Void
 */
function restoreOptions () {
	var store = getAppStore();

	// load data and display them
	chrome.storage.sync.get(store, function (items) {
		setInput(form_input_id, items[app_data_key]);
	});
};

/**
 * Handle options form submit event
 *
 * @return  Void
 */
function saveOptions (ev) {
	// capture event
	ev.preventDefault();

	// setup options
	var input = doc.getElementById(form_input_id);
	var store = getAppStore(input.value);

	// update options
	chrome.storage.sync.clear(function () {
		chrome.storage.sync.set(store, function () {
			setMessage(form_status_id, getMessage('options_message'));
		});
	});
};

/**
 * Init options menu
 *
 * @return  Void
 */
function options () {
	// i18n
	setMessage(form_label_id, getMessage('options_token'));
	setMessage(form_button_id, getMessage('options_save'));

	// setup form handler
	doc.getElementById(form_id).addEventListener('submit', saveOptions);

	// display settings
	restoreOptions();
};

doc.addEventListener('DOMContentLoaded', options);
