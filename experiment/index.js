
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


window.onload = function() {
	let hasPermission = checkDevicePermission();
	setButtonListeners();
	setCSVFields();
}

function checkDevicePermission() {
	let permButton = document.getElementById("permissionButton");
	let hasPermission = true;
	if (typeof DeviceMotionEvent.requestPermission === 'function') {
		permButton.style.display = "initial";
		devicePermission["motion"] = false;
		hasPermission = false;
	}
	if (typeof DeviceOrientationEvent.requestPermission === 'function') {
		permButton.style.display = "initial";
		devicePermission["orientation"] = false;
		hasPermission = false;
	}
	if (enableLog) {
		console.log(devicePermission);
	}
	return hasPermission;
}

function getDevicePermission() {
	if (enableLog) {
		console.log("requesting permission");
		// console.log(devicePermission);
	}
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
	if (enableLog) {
		console.log("tracking toggled");
	}
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
	if (enableLog) {
		console.log("tracking starts");
	}
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
	if (enableLog) {
		console.log("tracking stops");
	}
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
	updateReadingDisplay();
}

function readDeviceOrientation(e) {
	readings["alpha"] = e.alpha;
	readings["beta"] = e.beta;
	readings["gamma"] = e.gamma;
	updateReadingDisplay();
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


