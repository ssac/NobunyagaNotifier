
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-39548375-2']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

$(document).ready(function() {
	// config object constructor
	// id: dom id
	// variable: variable in bg.js
	function Config(id, variable) {
		this.id = id;
		this.variable = variable;
	}

	// i18n text object constructor
	// id: dom id
	// key: i18n key
	function Text(id, key) {
		this.id = id;
		this.key = key;
	}

	function refreshVolume() {
		var text = chrome.extension.getBackgroundPage().getVolume() * 100 + "%";
		$("#volume").html(text);
	}

	// sync option selected as previous saved in localstorage
	function setCheckboxChecked(id) {
		$(id).attr("checked", "checked");
	}

	// each time user actives a notification, ask background.js to save it
	function bindEvent(config) {
		$(config.id).click(function () {
			if ($(config.id).attr("checked") == "checked") {
				chrome.extension.getBackgroundPage().setConfig(config.variable, true);

				// google analytic tracking
				_gaq.push(['_trackEvent', config.variable, 'Enable Option']);
			}
			else {
				chrome.extension.getBackgroundPage().setConfig(config.variable, false);

				// google analytic tracking
				_gaq.push(['_trackEvent', config.variable, 'Disable Option']);
			}
		});
	}

	// set all configs disabled
	function setAllConfgisDisabled() {
		$("input.config").attr("disabled", "disabled");
	}

	var configs = [
		new Config ("#voice", "isVoiceNotify"),
		new Config ("#quest", "isQuestNotify"),
		new Config ("#build", "isBuildNotify"),
		new Config ("#prepare", "isPrepareNotify"),
		new Config ("#skill", "isSkillNotify"),
		new Config ("#soak", "isSoakNotify"),
		new Config ("#food", "isFoodNotify"),
		new Config ("#nohome", "isNohomeNotify"),
		new Config ("#fire", "isFireNotify"),
		new Config ("#land", "isLandNotify"),
		new Config ("#wind", "isWindNotify"),
		new Config ("#water", "isWaterNotify"),
		new Config ("#sky", "isSkyNotify")
	];

	var texts = [
		new Text("p_multi_game_not_supported", "p_multi_game_not_supported"),
		new Text("p_not_found_game", "p_not_found_game"),
		new Text("p_local_storage_not_supported", "p_local_storage_not_supported"),
		new Text("i18n_general_setting", "general_setting"),
		new Text("i18n_voice", "voice"),
		new Text("i18n_conditions", "conditions"),
		new Text("i18n_nohome", "note_nohome"),
		new Text("i18n_build", "note_no_build"),
		new Text("i18n_prepare", "note_no_prepare"),
		new Text("i18n_skill", "note_skill_available"),
		new Text("i18n_soak", "note_soak_available"),
		new Text("i18n_food", "note_food_warn"),
		new Text("i18n_quest", "note_quest_battle_available"),
		new Text("i18n_visit", "note_visit_available"),
		new Text("i18n_fire", "note_fire_factory_available"),
		new Text("i18n_land", "note_land_factory_available"),
		new Text("i18n_wind", "note_wind_factory_available"),
		new Text("i18n_water", "note_water_factory_available"),
		new Text("i18n_sky", "note_sky_factory_available"),
		new Text("reconnect", "reconnect")
	];

	// assign i18n text to popup.html
	for (var i = 0; i < texts.length; i++) {
		var i18nText = chrome.i18n.getMessage(texts[i].key);
		$("#" + texts[i].id).html(i18nText);
	}

	$(document).on('click', "a.link", function(e) {
		var href = e.currentTarget.href
		chrome.extension.getBackgroundPage().openlink(href);
		_gaq.push(['_trackEvent', href, 'External Link']);
	});

	// redirect user to this extension installation page
	$("#vote").click(function() {
		chrome.extension.getBackgroundPage().vote();
	});

	// notice user the game has not found, ask user refresh the game tab
	if (chrome.extension.getBackgroundPage().ifInGame() === false) {
		$("#p_not_found_game").show();
		setAllConfgisDisabled();
		return;
	}

	// notice user localStorage has not been enabled, application doesn't run
	if (!window.localStorage) {
		$("#p_local_storage_not_supported").show();
		setAllConfgisDisabled();
		return;
	}

	for (var i = 0; i < configs.length; i++) {
		var config = configs[i];

		// read local storage data, mark specified checkbox if set true
		if (chrome.extension.getBackgroundPage().config[config.variable] === true) {
			setCheckboxChecked(config.id);
		}

		bindEvent(config);
	}

	// if the + button clicked, increase volume degree
	$("#button-volume-increase").click(function() {
		chrome.extension.getBackgroundPage().modifyVolume(true);
		refreshVolume();
	});

	// if the - button clicked, decrease volume degree
	$("#button-volume-decrease").click(function() {
		chrome.extension.getBackgroundPage().modifyVolume(false);
		refreshVolume();
	});

	// reconnect the game for some undetected problem happen in full-screen
	$("#reconnect").click(function() {
		chrome.extension.getBackgroundPage().start();
	});

	refreshVolume();
});