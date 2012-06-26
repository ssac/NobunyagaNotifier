
$(document).ready(function(){

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
	
	function Config(id, variable) {
		this.id = id;
		this.variable = variable;
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
		new Config ("#fire", "isFireNotify"),
		new Config ("#land", "isLandNotify"),
		new Config ("#wind", "isWindNotify"),
		new Config ("#water", "isWaterNotify"),
		new Config ("#sky", "isSkyNotify"),
		new Config ("#nohome", "isNohomeNotify")
	];
	
	
	for (var i = 0; i < configs.length; i++) {
		var config = configs[i];
		
		// setting
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
	
	$("#vote").click(function() {
		chrome.extension.getBackgroundPage().vote();
	});
});