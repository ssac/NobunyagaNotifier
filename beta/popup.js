
$(document).ready(function() {

	var isPublish = true;

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


	// config object constructor
	function Config(id, variable) {
		this.id = id;
		this.variable = variable;
	}
	
	
	function refreshVolume() {
		var text = chrome.extension.getBackgroundPage().getVolume() * 100 + "%";
		$("#volume").html(text);
	}


	function setCheckboxChecked(id) {
		$(id).attr("checked", "checked");
	}


	var configs = [
		new Config ("#voice", "isVoiceNotify"),
		new Config ("#quest", "isQuestNotify"),
		new Config ("#build", "isBuildNotify"),
		new Config ("#prepare", "isPrepareNotify"),
		new Config ("#skill", "isSkillNotify"),
		new Config ("#soak", "isSoakNotify"),
		new Config ("#food", "isFoodNotify"),
		new Config ("#nohome", "isNohomeNotify")
	];


	if (!isPublish) {
		configs.push(new Config ("#fire", "isFireNotify"));
		configs.push(new Config ("#land", "isLandNotify"));
		configs.push(new Config ("#wind", "isWindNotify"));
		configs.push(new Config ("#water", "isWaterNotify"));
		configs.push(new Config ("#sky", "isSkyNotify"));
	}


	for (var i = 0; i < configs.length; i++) {
		var config = configs[i];
		
		// read local storage data, mark specified checkbox if set true
		if (chrome.extension.getBackgroundPage().config[config.variable] === true) {
			setCheckboxChecked(config.id);
		}
		
		bindEvent(config);
	}


	function bindEvent(config) {
		$(config.id).click(function () {
			if ($(config.id).attr("checked") == "checked") {
				chrome.extension.getBackgroundPage().setConfig(config.variable, true);
			}
			else {
				chrome.extension.getBackgroundPage().setConfig(config.variable, false);
			}
		});
	}


	function setAllConfgisDisabled() {
		$("#general_configs > input.config").attr("disabled", "disabled");
		$("#configs > input.config").attr("disabled", "disabled");
	}


	// redirect user to this extension installation page
	$("#vote").click(function() {
		chrome.extension.getBackgroundPage().vote();
	});


	if (isPublish) {
		$("#coming > input.config").attr("disabled", "disabled");
	}
	
	$("#button-volume-increase").click(function() {
		chrome.extension.getBackgroundPage().modifyVolume(true);
		refreshVolume();
	});
	
	$("#button-volume-decrease").click(function() {
		chrome.extension.getBackgroundPage().modifyVolume(false);
		refreshVolume();
	});
	
	refreshVolume();
});