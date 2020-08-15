var gunslinger;
var enableLog = true;
var isReading = false;
var readings = {
	"interval": 0,
	"xAcc": 0,
	"yAcc": 0,
	"zAcc": 0,
	"xAccGrav": 0,
	"yAccGrav": 0,
	"zAccGrav": 0,
	"alphaRotRate": 0,
	"betaRotRate": 0,
	"gammaRotRate": 0,
	"alpha": 0,
	"beta": 0,
	"gamma": 0,
}
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
		"xyz": 10,
		"yGrav": 5,
		"alpha": 20,
		"duration": 3000
	},
	"draw": {
		"alpha": -100
	},
	"fire": {
		"alpha": 50
	}
};

// var gunslinger = {
// 	hasReadied: false,
// 	hasDrawn: false,
// 	hasFired: false,
// 	readings: {},
// 	updateReadings: updateReadings,
// 	checkReady: checkReady
// };

function logger( msg ) {
	if (enableLog) {
		console.log(msg);
	}
}

function Gunslinger(hasReadied, hasDrawn, hasFired, aclData) {
	this.hasReadied = hasReadied;
	this.hasDrawn = hasDrawn;
	this.hasFired = hasFired;
	this.readyStart = undefined;
	this.readings = aclData;
	this.triggerReady = null;
	this.checkReady = null;
	this.updateReadings = null;
	this.touchContact = false;
	this.flipTouchContact = function() {
		this.touchContact = !this.touchContact;
	}
	this.indicateReadied = null;
}

function triggerReady() {
	gunslinger.touchContact = true;
	window.requestAnimationFrame(gunslinger.checkReady);
}

function checkReady(timestamp) {
	if (gunslinger.readyStart === undefined) {
		gunslinger.readyStart = timestamp;
	}

	let elapsed = timestamp - gunslinger.readyStart;
	document.getElementById("consoleLog").innerHTML = elapsed + " | " + timestamp + " | " + gunslinger.readyStart;

	let snap = gunslinger.readings;
	let t = thresholds.ready;
	let actData = [snap.yAccGrav, snap.x, snap.y, snap.z];
	let expData = [9.8, 0, 0, 0];
	let thresh = [t.yGrav, t.xyz, t.xyz, t.xyz];
	if (checkInMargins(actData, expData, thresh)) {
		if (elapsed > t.duration && !gunslinger.hasReadied) {
			gunslinger.hasReadied = true;
			gunslinger.indicateReadied();
			return;
		}
	}
	// else if (!this.touchContact) {
	// 	return;
	// }
	else {
		gunslinger.readyStart = timestamp;
	}
	window.requestAnimationFrame(gunslinger.checkReady);
}

function indicateReadied() {
	document.getElementById("yeetMode").style.backgroundColor = "green";
	playAudio("ghostTown_jingle");
}

function updateReadings(newReadings) {
	gunslinger.readings = newReadings;
}

function checkInMargins(a, b, threshold) {
	for(let i = 0; i < a.length; i++) {
		if (Math.abs(a[i] - b[i]) > threshold[i]) {
			return false;
		}
	}
	return true;
}

function playAudio(name) {
	// let aud = new Audio("../docs/assets/audio/" + name + ".mp3");
	let aud = new Audio("ghostTown_jingle.mp3");
	logger("playing " + name);
	aud.play();
}

function checkDevicePermission() {
	let permButton = document.getElementById("permissionButton");
	let hasPermission = true;
	if (window.DeviceMotionEvent != undefined && window.DeviceMotionEvent.requestPermission != undefined) {
		permButton.style.display = "initial";
		devicePermission["motion"] = false;
		hasPermission = false;
	}
	if (window.DeviceOrientationEvent != undefined && window.DeviceOrientationEvent.requestPermission != undefined) {
		permButton.style.display = "initial";
		devicePermission["orientation"] = false;
		hasPermission = false;
	}
	logger(devicePermission);
	return hasPermission;
}

function getDevicePermission() {
	logger("requesting permission");
	if (!devicePermission["motion"]) {
		DeviceMotionEvent.requestPermission()
			.then(permState => {
				if (permState === 'granted') {
					devicePermission["motion"] = true;
				}
			});
	}
	if (!devicePermission["orientation"]) {
		DeviceOrientationEvent.requestPermission()
			.then(permState => {
				if (permState === 'granted') {
					devicePermission["orientation"] = true;
				}
			});
	}
	let permButton = document.getElementById("permissionButton");
	permButton.style.display = checkDevicePermission ? "none" : "initial";
}

function setButtonListeners() {
	let startButton = document.getElementById("startButton");
	startButton.addEventListener('click', startTrackMode);
	let consoleButton = document.getElementById("consoleButton");
	consoleButton.addEventListener('click', printConsole);
	let csvButton = document.getElementById("csvButton");
	csvButton.addEventListener('click', downloadCSV);
	let clearButton = document.getElementById("clearButton");
	clearButton.addEventListener('click', clearCSV);
	let exitButton = document.getElementById("exitButton");
	exitButton.addEventListener('click', exitTrackMode);
	let permButton = document.getElementById("permissionButton");
	permButton.addEventListener('click', getDevicePermission);
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
		yeetMode.addEventListener("touchend", gunslinger.flipTouchContact);
	}
	else {
		yeetMode.addEventListener("mousedown", gunslinger.triggerReady);
		yeetMode.addEventListener("mouseup", gunslinger.flipTouchContact);
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
	let history = document.getElementById("history");
	history.innerHTML = "";
	updateReadingDisplay();
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
	let keys = Object.keys(readings);
	for(let i = 0; i < data.length; i++) {
		readings[keys[i]] = data[i];
	}
	readings["yAccGrav"] = 9.8;
	updateReadingDisplay();
	gunslinger.updateReadings(readings);
}

function readDeviceOrientation(e) {
	readings["alpha"] = e.alpha;
	readings["beta"] = e.beta;
	readings["gamma"] = e.gamma;
	updateReadingDisplay();
	gunslinger.updateReadings(readings);
}

function updateReadingDisplay() {
	let display = document.getElementById("readingDisplay");
	let textDisplay = "";
	let keys = Object.keys(readings);
	for(let i = 0; i < keys.length; i++) {
		textDisplay += (keys[i] + ":" + readings[keys[i]] + " | ");
	}
	display.innerHTML = textDisplay;
}

function printReading() {
	let display = document.getElementById("history");
	let newText = "";
	let values = Object.values(readings);
	for(let i = 0; i < values.length; i++) {
		newText += (values[i].toPrecision(3) + " | ");
	}
	display.innerHTML += (newText + "<br>");
}

function setCSVFields() {
	let keys = Object.keys(readings);
	csv = keys.join() + "\n";
}

function updateCSV() {
	let values = Object.values(readings);
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
	setCSVFields();
}

function step(timestamp) {
	if (startTime === undefined) {
		startTime = timestamp;
	}
	const elapsed = timestamp - startTime;

	if (elapsed > 1000 / interval) {
		updateCSV();
		printReading();
		startTime = elapsed;
	}

	if (isReading) {
		window.requestAnimationFrame(step);
	}
	else {
		startTime = undefined;
	}
}

function printConsole() {
	var output = document.getElementById("consoleLog");

	// Reference to native method(s)
	var oldLog = console.log;

	console.log = function( ...items ) {

		// Call native method first
		oldLog.apply(this,items);

		// Use JSON to transform objects, all others display normally
		items.forEach( (item,i)=>{
			items[i] = (typeof item === 'object' ? JSON.stringify(item,null,4) : item);
		});
		output.innerHTML += items.join(' ') + '<br />';

	};
}

window.addEventListener( "load", function() {
	gunslinger = new Gunslinger(false, false, false, readings);
	gunslinger.triggerReady = triggerReady;
	gunslinger.checkReady = checkReady;
	gunslinger.updateReadings = updateReadings;
	gunslinger.indicateReadied = indicateReadied;
	let hasPermission = checkDevicePermission();
	setButtonListeners();
	setCSVFields();
	console.log(gunslinger);
} );

