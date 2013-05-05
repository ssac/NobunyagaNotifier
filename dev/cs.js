
$(document).ready(function() {

	var interval = 1000;
	var content = {};
	var flag = {};

	function ifTWVersion() {
		return !(document.URL.match(/nyashindig.wasabii.com.tw\/gadgets/) == null);
	}

	function ifJPVersion() {
		return !(document.URL.match(/app.mbga-platform.jp\/*/) == null);
	}

	function ifCNVersion() {
		return !(document.URL.match(/nyashindig.86game.com\/shindig\/gadgets/) == null);
	}

	function initFlag() {
		if (ifTWVersion()) {
			flag.house   = "貓場所"
			flag.move    = "完成移動";
			flag.battle  = "合戰";
			flag.build   = ["增建中", "建設中"];
			flag.prepare = ["增建準備中", "建設準備中"];
			flag.skill   = "奧義開發將於";
			flag.soak    = "泡湯";
			flag.fire    = "修練火";
			flag.land    = "修練地";
			flag.wind    = "修練風";
			flag.water   = "修練水";
			flag.sky     = "修練空";
			return true;
		}

		if (ifJPVersion()) {
			flag.house   = "ねこ場所"
			flag.move    = "移動が";
			flag.battle  = "合戦";
			flag.build   = ["増築中", "建設中"];
			flag.prepare = ["増築準備中", "建設準備中"];
			flag.skill   = "奥義開発が";
			flag.soak    = "入湯が";
			flag.fire    = "修練火";
			flag.land    = "修練地";
			flag.wind    = "修練風";
			flag.water   = "修練水";
			flag.sky     = "修練空";
			return true;
		}

		if (ifCNVersion()) {
			flag.house   = "猫道场"
			flag.move    = "移动将于";
			flag.battle  = "合战";
			flag.build   = ["增建中", "建造中"];
			flag.prepare = ["增建准备中", "建造准备中"];
			flag.skill   = "奥义开发将于";
			flag.soak    = "泡汤将于";
			flag.fire    = "修炼火";
			flag.land    = "修炼地";
			flag.wind    = "修炼风";
			flag.water   = "修炼水";
			flag.sky     = "修炼空";
			return true;
		}

		return false;
	}

	/*
		arr: array contains all builds identifier class
		str: string to identify this building is working
	*/
	function ifNotify(arr, str) {
		// get number of buildings
		var numOfBuilds = getNumOfBuilds(arr);

		// get number of working
		var numOfWorks = getNumOfWorks(str);

		return numOfBuilds > numOfWorks;
	}

	/*
		function: get the number of specified build
		arr: array containing the class name of building
	*/
	function getNumOfBuilds(arr) {
		var num = 0;

		for (var i = 0; i < arr.length; i++) {
			num += $("#mapbg > area." + arr[i] + ":not('.unpaid')").length;
		}

		return num;
	}

	/*
		function: get the number of working building
	*/
	function getNumOfWorks(str) {
		var selector = "#doing > div:contains('" + str + "')";
		return $(selector).length;
	}

	// detect if the user's battle team in move or questing
	function ifInMove() {
		return $("#doing > div:contains('" + flag.move + "')").length !== 0;
	}

	//
	function ifInHouse() {
		return $("#doing > div:contains('" + flag.house + "')").length !== 0;
	}

	// detect if the user's battle team in fight (to another player)
	function ifInBattle() {
		return $("#doing > div:contains('" + flag.battle + "')").length !== 0;
	}

	// function to detect if food over the warning line
	function ifFoodNotify() {
		if (document.getElementById("doing") == null) return false;

		var cur_food = $("#element_food").text();
		var max_food = $("#max_food").text();

		return cur_food / max_food > 0.9;
	}

	// detect if player in busy
	function ifQuestNotify() {
		return !(ifInMove() || ifInBattle() || ifInHouse());
	}

	function ifContain(arr) {
		for (var i = 0; i < arr.length; i++) {
			if ($("#doing > div:contains('" + arr[i] + "')").length !== 0) {
				return true;
			}
		}

		return false;
	}

	// function to send read dom info to background.js
	function notifyUser() {
		content.nohome  = false;
		content.quest   = false;
		content.build   = false;
		content.prepare = false;
		content.skill   = false;
		content.soak    = false;
		content.food    = false;
		content.fire    = false;
		content.land    = false;
		content.wind    = false;
		content.water   = false;
		content.sky     = false;

		// if player in home
		if (document.getElementById("doing")) {
			content.quest   = ifQuestNotify();
			content.build   = !ifContain(flag.build);
			content.prepare = !ifContain(flag.prepare);
			content.skill   = ifNotify(["type09", "type10"], flag.skill);
			content.soak    = ifNotify(["type14"], flag.soak);
			content.food    = ifFoodNotify();
			content.fire    = ifNotify(["type03"], flag.fire);
			content.land    = ifNotify(["type04"], flag.land);
			content.wind    = ifNotify(["type05"], flag.wind);
			content.water   = ifNotify(["type06"], flag.water);
			content.sky     = ifNotify(["type07"], flag.sky);
		}
		// if player in map
		else if (document.getElementById("notify_count")) {
			content.nohome = true;

			// the id exists means player in busy
			content.quest = !document.getElementById("notify_count_main");
		}

		chrome.extension.sendRequest({ ask: 2, content: content });
	}

	/*
		ask == 1: unload page
		ask == 2: periodic update
		ask == 3: notice game joining
	*/
	window.onunload = function () {
		chrome.extension.sendRequest({ ask: 1 });
	};

	// when this content script be asked to re-send data
	chrome.extension.onRequest.addListener( function(request, sender, sendResponse) {
		if (request.ask === 1) {
			setTimeout(notifyUser, interval);
		}
	});

	// init the flag string value
	// if can not detect the game content scripts, exit the content script
	if (initFlag()) {
		console.log("Game Detected.");
	}
	else {
		return;
	}

	// ask if start to send data
	chrome.extension.sendRequest({ ask: 3 }, function(rsp){
		// got false means that the game is running, this is the second and next games
		if (rsp.ans === true) {
			// send data once
			notifyUser();
		}
	});
});

