function init_gunslinger() {
	var AUD_GUN_COCK = new Audio("../assets/audio/empty.wav");
	var AUD_GUN_SHOT = new Audio("../assets/audio/empty.wav");
	var AUD_JINGLE = new Audio("../assets/audio/empty.wav");
	var gunslinger;
	var enableLog = true;
	var isReading = false;
	var keys = [
		"interval", 
		"xAcc", 
		"yAcc", 
		"zAcc", 
		"xAccGrav", 
		"yAccGrav", 
		"zAccGrav", 
		"alphaRotRate", 
		"betaRotRate", 
		"gammaRotRate", 
		"alpha", 
		"beta", 
		"gamma"
	];
	var readings = {};
	for(let z = 0; z < keys.length; ++z) {
		readings[keys[z]] = 0;
	}
	var values = [];
	for(let z = 0; z < keys.length; ++z) {
		values.push( readings[keys[z]] );
	}
	readings["yAccGrav"] = 9.8;
	var csv  = "";
	var startTime;
	var interval;
	var isMobile = 
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ?
	 		true : false;
	var devicePermission = {
			"motion": true,
			"orientation": true
		};
	var thresholds = {
		"ready": {
			"xyz": 3,
			"yGrav": 5,
			"duration": 3000
		},
		"countdown": {
			"duration": 5000
		},
		"draw": {
			"dBeta": 90,
			"betaMoE": 8,
			"xyz": 3,
			"populationConstants": [-70, 65, .2, 96]
		},
		"fire": {
			"dBeta": 45,
			"betaMoE": 20,
			"dXAcc": 20
		}
	};

	function logger( msg ) {
		if (enableLog) {
			console.log(msg);
		}
	}

	function Gunslinger(hasReadied, hasDrawn, hasFired, duelStarted, aclData) {
		this.hasReadied = hasReadied;
		this.hasDrawn = hasDrawn;
		this.hasFired = hasFired;
		this.animStart = undefined;
		this.audioLoaded = false;
		this.readings = aclData;
		this.duelStarted = duelStarted;

		this.checkMotion = null;

		this.triggerReady = null;
		this.checkReady = null;
		this.stopCheck = null;

		this.triggerDraw = null;
		this.checkDraw = null;
		this.indicateDrawn = null;

		this.triggerFire = null;
		this.checkFire = null;
		this.indicateFire = null;

		this.updateReadings = null;
		this.indicateReadied = null;
		this.animReq = undefined;
		this.betaI = undefined;
		this.xAccMin = undefined;
		this.xAccMax = undefined;
	}

	function playAudio(name) {
		let aud;
		switch(name) {
			case "jingle":
				aud = AUD_JINGLE;
				break;
			case "gun_cock":
				aud = AUD_GUN_COCK;
				break;
			case "gun_shot":
				aud = AUD_GUN_SHOT;
				break;
		}
		logger("playing " + name);
		aud.play();
	}

	function indicateReadied() {
		playAudio("jingle");
		document.getElementById("yeetMode").style.backgroundColor = "rgba(0, 255, 0, .7)";
	}

	function indicateDrawn() {
		playAudio("gun_cock");
		let yeetMode = document.getElementById("yeetMode");
		yeetMode.style.display = "initial";
		yeetMode.style.backgroundColor = "rgba(0, 0, 255, .7)";
	}

	function indicateFire() {
		playAudio("gun_shot");
		document.getElementById("yeetMode").style.backgroundColor = "rgba(255, 0, 0, .7)";
	}

	function triggerReady() {
		window.requestAnimationFrame(gunslinger.checkMotion);
	}

	function triggerDraw() {
		gunslinger.betaI = gunslinger.readings.beta;
		window.requestAnimationFrame(gunslinger.checkMotion);
	}

	function triggerFire() {
		gunslinger.xAccMin = gunslinger.readings.xAcc;
		gunslinger.betaI = gunslinger.readings.beta;
		window.requestAnimationFrame(gunslinger.checkMotion);
	}

	function checkInMargins(a, b, threshold) {
		for(let i = 0; i < a.length; i++) {
			if (Math.abs(a[i] - b[i]) > threshold[i]) {
				return false;
			}
		}
		return true;
	}

	function checkMotion(timestamp) {
		if (gunslinger.animStart === undefined) {
			gunslinger.animStart = timestamp;
		}

		let elapsed = timestamp - gunslinger.animStart;
		// document.getElementById("consoleLog").innerHTML = elapsed + " | " + timestamp 
		// 	+ " | " + gunslinger.animStart;

		let snap = gunslinger.readings;
		let t = thresholds;
		let motionFunc;
		if (!gunslinger.hasReadied) {
			t = thresholds.ready;
			motionFunc = gunslinger.checkReady;
		}
		else if (gunslinger.hasReadied && !gunslinger.hasDrawn) {
			logger("checking draw");
			t = thresholds.draw;
			motionFunc = gunslinger.checkDraw;
		}
		else if (gunslinger.hasReadied && gunslinger.hasDrawn && !gunslinger.hasFired) {
			logger("checking fire");
			t = thresholds.fire;
			motionFunc = gunslinger.checkFire;
		}
		

		let cont = motionFunc(snap, t, elapsed, timestamp);
		if (cont)
			gunslinger.animReq = window.requestAnimationFrame(gunslinger.checkMotion);
	}

	function checkReady(snap, t, elapsed, timestamp) {
		let actData = [snap.yAccGrav, snap.x, snap.y, snap.z];
		//let expData = [9.8, 0, 0, 0];
		let thresh = [t.yGrav, t.xyz, t.xyz, t.xyz];
		if (checkInMargins(actData, [9.8, 0, 0, 0], thresh) || checkInMargins(actData, [-9.8, 0, 0, 0], thresh)) {
			if (elapsed > t.duration && !gunslinger.hasReadied) {
				gunslinger.hasReadied = true;
				gunslinger.animStart = undefined;
				document.getElementById("yeetMode").removeEventListener("touchend", gunslinger.stopCheck);
				gunslinger.indicateReadied();
				gunslinger.triggerDraw();
				return false;
			}
		}
		else {
			gunslinger.animStart = timestamp;
		}
		return true;
	}

	function checkDraw(snap, t, elapsed, timestamp) {
		logger(snap.beta + " | " + gunslinger.betaI + " | " + (snap.beta - gunslinger.betaI));
		let aclData = [snap.beta - gunslinger.betaI, snap.xAcc, snap.yAcc, snap.zAcc];
		let expData = [t.dBeta, 0, 0, 0];
		let thresh = [t.betaMoE, t.xyz, t.xyz, t.xyz];
		if (checkInMargins(aclData, expData, thresh) && !gunslinger.hasDrawn) {
			gunslinger.hasDrawn = true;
			gunslinger.animStart = undefined;
			gunslinger.indicateDrawn();
			gunslinger.triggerFire();
			return false;
		}
		return true;
	}

	function checkFire(snap, t, elapsed, timestamp) {
		if (gunslinger.xAccMin > snap.xAcc) gunslinger.xAccMin = snap.xAcc;
		let dXAcc = snap.xAcc - gunslinger.xAccMin;
		let dBeta = snap.beta - gunslinger.betaI;
		logger(snap.xAcc + " | " + gunslinger.xAccMin + " | " + dXAcc + " || " + snap.beta + " | " + 
			gunslinger.betaI + " | " + dBeta);
		let aclData = [dBeta];
		let expData = [t.dBeta];
		let thresh = [t.betaMoE];
		if (checkInMargins(aclData, expData, thresh) && (dXAcc > t.dXAcc) && !gunslinger.hasFired) {
			gunslinger.animStart = undefined;
			gunslinger.hasFired = true;
			gunslinger.indicateFire();
			return false;
		}
		return true;
	}

	function stopCheck() {
		logger("stopping motion check");
		gunslinger.animStart = undefined;
		window.cancelAnimationFrame(gunslinger.animReq);
	}

	function updateReadings() {
		for(let z = 0; z < keys.length; z++) {
			values[z] = readings[keys[z]];
		}
	}

	function modelPopulation(t, cst) {
		// cst = [y, c, k, p]
		// y: vertical shift | c: center of graph | k: steepness factor | 
		// p: max population / carrying capacity
		// P(t) = p/(1 + e^(-k(t - c))) + y
		return cst[3] / (1 + Math.exp(-cst[2] * (t - cst[1]))) + cst[0];
	}

	function startTrackMode() {
		for(const type in devicePermission) {
			if (!devicePermission[type]) {
				let history = document.getElementById("history");
				history.innerHTML = 
					"Please grant permission to " + type;
				return;
			}
		}
		let trackScreen = document.getElementById("yeetMode");
		yeetMode.style.display = "initial";
		if (isMobile) {
			yeetMode.addEventListener("touchstart", toggleTracking);
			yeetMode.addEventListener("touchend", toggleTracking);
		}
		else {
			yeetMode.addEventListener("mousedown", toggleTracking);
			yeetMode.addEventListener("mouseup", toggleTracking);
		}
		if (isMobile) {
			yeetMode.addEventListener("touchstart", gunslinger.triggerReady);
			yeetMode.addEventListener("touchend", gunslinger.stopCheck);
		}
		else {
			yeetMode.addEventListener("mousedown", gunslinger.triggerReady);
			yeetMode.addEventListener("mouseup", gunslinger.stopCheck);
		}
	}

	function exitTrackMode() {
		let trackScreen = document.getElementById("yeetMode");
		yeetMode.style.display = "none";
		if (isMobile) {
			yeetMode.removeEventListener("touchstart", toggleTracking);
			yeetMode.removeEventListener("touchend", toggleTracking);
		}
		else {
			yeetMode.removeEventListener("mousedown", toggleTracking);
			yeetMode.removeEventListener("mouseup", toggleTracking);
		}
	}

	function toggleTracking() {
		if(gunslinger.hasReadied) return;
		if(!gunslinger.audioLoaded) {
			AUD_JINGLE.play();
			AUD_GUN_COCK.play();
			AUD_GUN_SHOT.play();
			AUD_JINGLE.src = "../assets/audio/ghostTown_jingle.wav";
			AUD_GUN_COCK.src = "../assets/audio/gun_cock.wav";
			AUD_GUN_SHOT.src = "../assets/audio/gun_shot.wav";
			gunslinger.audioLoaded = true;
		}
		logger("tracking toggled");
		if (!isReading) {
			interval = document.getElementById("interval").value;
			interval = parseInt(interval);
			if (!interval) {
				interval = 10;
			}
			isReading = true;
			startTracking(interval);
		}
		else {
			isReading = false;
			exitTrackMode();
			stopTracking();
		}
	}

	function startTracking(interval) {
		logger("tracking starts");
		window.addEventListener('devicemotion', readDeviceMotion);
		window.addEventListener('deviceorientation', readDeviceOrientation);
		window.requestAnimationFrame(step);
		if (window.navigator.vibrate) {
			console.log("can vibrate");
			window.navigator.vibrate(200);
		}
		else {
			console.log("cannot vibrate");
		}
	}

	function stopTracking() {
		logger("tracking stops");
		window.removeEventListener('devicemotion', readDeviceMotion);
		window.removeEventListener('deviceorientation', readDeviceOrientation);
	}

	function readDeviceMotion(e) {
		let acc = e.acceleration;
		let accGrav = e.accelerationIncludingGravity;
		let rotRate = e.rotationRate;
		let data = [e.interval, acc.x, acc.y, acc.z, accGrav.x, accGrav.y, 
			accGrav.z, rotRate.alpha, rotRate.beta, rotRate.gamma];
		for(let i = 0; i < data.length; i++) {
			if(data[i] != null) readings[keys[i]] = data[i];
		}
		// readings["yAccGrav"] = 9.8;
		gunslinger.updateReadings();
	}

	function readDeviceOrientation(e) {
		if(e.alpha != null) readings["alpha"] = e.alpha;
		if(e.beta != null) readings["beta"] = e.beta;
		if(e.gamma != null) readings["gamma"] = e.gamma;
		gunslinger.updateReadings();
	}

	function setCSVFields() {
		csv = keys.join() + "\n";
	}

	function updateCSV() {
		csv += values.join() + "\n";
	}

	function downloadCSV() {
		var hiddenElement = document.createElement('a');
	    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
	    hiddenElement.target = '_blank';
	    hiddenElement.download = 'deviceData.csv';
	    hiddenElement.click();
	}

	function clearCSV() {
		csv = "";
	}

	function step(timestamp) {
		if (startTime === undefined) {
			startTime = timestamp;
		}
		const elapsed = timestamp - startTime;

		if (elapsed > 1000 / interval) {
			updateCSV();
			startTime = elapsed;
		}

		if (isReading) {
			window.requestAnimationFrame(step);
		}
		else {
			startTime = undefined;
		}
	}

	function initRTCCallback(evt) {
		gunslinger = new Gunslinger(false, false, false, false, readings);
		gunslinger.checkMotion = checkMotion;
		gunslinger.triggerReady = triggerReady;
		gunslinger.checkReady = checkReady;
		gunslinger.stopCheck = stopCheck;
		gunslinger.triggerDraw = triggerDraw;
		gunslinger.checkDraw = checkDraw;
		gunslinger.indicateDrawn = indicateDrawn;
		gunslinger.triggerFire = triggerFire;
		gunslinger.checkFire = checkFire;
		gunslinger.indicateFire = indicateFire;
		gunslinger.updateReadings = updateReadings;
		gunslinger.indicateReadied = indicateReadied;
		console.log(evt);
		console.log(gunslinger);
	}

	function checkIndivPermission(evt, name) {
		if (evt != undefined && evt.requestPermission != undefined) {
			let permButton = document.getElementById("permissionButton");
			permButton.style.display = "initial";
			return devicePermission[name] = false;
		}
		return true;
	}

	function checkDevicePermission() {
		let hasPermission = true;
		if (!checkIndivPermission(window.DeviceMotionEvent, "motion")) hasPermission = false;
		if (!checkIndivPermission(window.DeviceOrientationEvent, "orientation")) hasPermission = false;
		logger(devicePermission);
		return hasPermission;
	}

	function getIndivPermission(evt, name) {
		evt.requestPermission().then(permState => {
			if (permState === 'granted') {
				devicePermission[name] = true;
				if( devicePermission["motion"] && devicePermission["orientation"] ) {
					init_rtc(initRTCCallback);
				};
			}
		});
	}

	function getDevicePermission() {
		logger("requesting permission");
		if (!devicePermission["motion"]) getIndivPermission(window.DeviceMotionEvent, "motion");
		if (!devicePermission["orientation"]) getIndivPermission(window.DeviceOrientationEvent, "orientation");
		let permButton = document.getElementById("permissionButton");
		permButton.style.display = checkDevicePermission ? "none" : "initial";
	}

	function setButtonListeners() {
		let startButton = document.getElementById("startButton");
		let permButton = document.getElementById("permissionButton");
		startButton.addEventListener('click', startTrackMode);
		permButton.addEventListener('click', getDevicePermission);
	}

	let hasPermission = checkDevicePermission();
	console.log( hasPermission );
	if(hasPermission) {
		init_rtc(initRTCCallback);
	}
	setButtonListeners();
}

window.addEventListener( "load", function() {
	init_gunslinger();
} );