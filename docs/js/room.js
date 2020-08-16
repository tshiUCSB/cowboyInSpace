// room.js
function init_room() {
	var isMobile = 
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ?
	 		true : false;

	var BUTTON_CREATE = document.getElementById("createButton");
	var BUTTON_JOIN = document.getElementById("joinButton");
	var CODE_INPUT = document.getElementById("codeInput");

	var click_evt = isMobile ? "touchend" : "click";

	function handle_button_create() {
		BUTTON_CREATE.removeEventListener( click_evt, handle_button_create );
		create_duel();
	}

	function handle_button_join() {
		if (BUTTON_JOIN.innerHTML == "Join Duel") {
			BUTTON_CREATE.style.display = "none";
			CODE_INPUT.style.display = "initial";
			BUTTON_JOIN.innerHTML = "Join";
		}
		else if (BUTTON_JOIN.innerHTML == "Join") {
			let code = CODE_INPUT.value;
			join_duel(code);
		}
	}

	BUTTON_CREATE.addEventListener( click_evt, handle_button_create );
	BUTTON_JOIN.addEventListener( click_evt, handle_button_join);
}

window.addEventListener( "load", init_room() );