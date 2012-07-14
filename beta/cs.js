
$(document).ready(function() {

	var interval = 1000;
	var content = new Object();
	var flag = new Object();


	function ifTWVersion() {
		return (document.URL.match(/nyashindig.wasabii.com.tw\/gadgets/) == null) ? false : true;
	}
	
	
	function ifJPVersion() {
		return (document.URL.match(/app.mbga-platform.jp\/*/) == null) ? false : true;
	}
	
	
	function initFlag() {
		if (ifTWVersion()) {
			flag.house = "貓場所"
			flag.move = "完成移動";
			flag.battle = "合戰";
			flag.build = ["增建中", "建設中"];
			flag.prepare = ["增建準備中", "建設準備中"];
			flag.skill = "奧義開發將於";
			flag.soak = "泡湯";
			flag.fire = "修練火";
			flag.land = "修練地";
			flag.wind = "修練風";
			flag.water = "修練水";
			flag.sky = "修練空";
			return true;
		}
		
		if (ifJPVersion()) {
			flag.house = "ねこ場所"
			flag.move = "移動が";
			flag.battle = "合戦";
			flag.build = ["増築中", "建設中"];
			flag.prepare = ["増築準備中", "建設準備中"];
			flag.skill = "奥義開発が";
			flag.soak = "入湯が";
			flag.fire = "修練火";
			flag.land = "修練地";
			flag.wind = "修練風";
			flag.water = "修練水";
			flag.sky = "修練空";
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

		return (numOfBuilds > numOfWorks) ? true : false;
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
		var selector;
		
		if (ifInBattle()) {
			selector = "#doing > div > div:contains('" + str + "')";
		}
		else {
			selector = "#doing > div:contains('" + str + "')";
		}
		
		return $(selector).length;
	}


	// detect if the user's battle team in move or questing
	function ifInMove() {
		return ($("#doing > div:contains('" + flag.move + "')").length !== 0) ? true : false;
	}
	
	//
	function ifInHouse() {
		return ($("#doing > div:contains('" + flag.house + "')").length !== 0) ? true : false;
	}


	// detect if the user's battle team in fight (to another player)
	function ifInBattle() {
		return ($("#doing > div:contains('" + flag.battle + "')").length !== 0) ? true : false;
	}


	// function to detect if food over the warning line
	function ifFoodNotify() {
		if (document.getElementById("doing") == null) return false;

		var cur_food = $("#element_food").text();
		var max_food = $("#max_food").text();

		return (cur_food / max_food > 0.9) ? true : false;
	}


	function ifQuestNotify() {
		return (ifInMove() || ifInBattle() || ifInHouse()) ? false : true;
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

		content.nohome = false;
		content.quest = false;
		content.build = false;
		content.prepare = false;
		content.skill = false;
		content.soak = false;
		content.food = false;
		content.fire = false;
		content.land = false;
		content.wind = false;
		content.water = false;
		content.sky = false;

		if (document.getElementById("doing")) {
			content.quest = ifQuestNotify();
			content.build = (ifContain(flag.build)) ? false : true;
			content.prepare = (ifContain(flag.prepare)) ? false : true;
			//content.build = ($("#doing > div:contains('增建中')").length === 0) ? true : false;
			//content.prepare = ($("#doing > div:contains('增建準備中')").length === 0) ? true : false;
			content.skill = ifNotify(["type09", "type10"], flag.skill);
			content.soak = ifNotify(["type14"], flag.soak);
			content.food = ifFoodNotify();
			content.fire = ifNotify(["type03"], flag.fire);
			content.land = ifNotify(["type04"], flag.land);
			content.wind = ifNotify(["type05"], flag.wind);
			content.water = ifNotify(["type06"], flag.water);
			content.sky = ifNotify(["type07"], flag.sky);
		}
		else if (document.getElementById("notify_count")) {
			content.nohome = true;
			content.quest = (!document.getElementById("notify_count_main")) ? true : false;
		}

		chrome.extension.sendRequest({ ask: 2, content: content });
	}


	/*
	ask == 1: unload page
	ask == 2: periodic update
	ask == 3: notice game joining
	*/
	window.onunload = function () {
		//if (!document.getElementById("doing")) return;
		chrome.extension.sendRequest({ ask: 1 });
	};

	
	// when this content script be asked to re-send data
	chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
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

