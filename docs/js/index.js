// index.js
var bgMusic;

function showButtons() {
	document.getElementById("startControls").style.display = "initial";
	document.getElementById("clickMe").style.display = "none";
	bgMusic.play();
}

window.addEventListener('load', function() {
	bgMusic = new Audio("assets/audio/Western_Spaghetti_-_Chris_Haugen.mp3");
	bgMusic.loop = true;
	document.getElementById("clickMe").addEventListener('click', showButtons, {'once': true});
});
