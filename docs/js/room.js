// room.js
function init_room() {
	var isMobile = 
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ?
	 		true : false;

	var BUTTON_CREATE = document.getElementById("createButton");

	var click_evt = isMobile ? "touchend" : "click";

	function handle_button_create() {
		BUTTON_CREATE.removeEventListener( click_evt, handle_button_create );
		create_duel();
	}

	BUTTON_CREATE.addEventListener( click_evt, handle_button_create );
}

window.addEventListener( "load", init_room() );