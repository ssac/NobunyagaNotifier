
$(document).ready(function() {

	var interval = 1000;
	var content = new Object();


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
		return ($("#doing > div:contains('完成移動')").length !== 0) ? true : false;
	}


	// detect if the user's battle team in fight (to another player)
	function ifInBattle() {
		return ($("#doing > div:contains('合戰')").length !== 0) ? true : false;
	}


	// function to detect if food over the warning line
	function ifFoodNotify() {
		if (document.getElementById("doing") == null) return false;

		var cur_food = $("#element_food").text();
		var max_food = $("#max_food").text();

		return (cur_food / max_food > 0.9) ? true : false;
	}


	function ifQuestNotify() {
		return (ifInMove() || ifInBattle()) ? false : true;
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
			content.build = ($("#doing > div:contains('增建中')").length === 0) ? true : false;
			content.prepare = ($("#doing > div:contains('增建準備中')").length === 0) ? true : false;
			content.skill = ifNotify(["type09", "type10"], "奧義開發將於");
			content.soak = ifNotify(["type14"], "泡湯");
			content.food = ifFoodNotify();
			content.fire = ifNotify(["type03"], "修練火");
			content.land = ifNotify(["type04"], "修練地");
			content.wind = ifNotify(["type05"], "修練風");
			content.water = ifNotify(["type06"], "修練水");
			content.sky = ifNotify(["type07"], "修練空");
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


	// ask if start to send data
	chrome.extension.sendRequest({ ask: 3 }, function(rsp){
		// got false means that the game is running, this is the second and next games
		if (rsp.ans === true) {
			//setInterval(notifyUser, interval);
			
			// send data once
			notifyUser();
		}
	});


	// when this content script be asked to re-send data
	chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
		if (request.ask === 1) {
			setTimeout(notifyUser, interval);
		}
	});
});

