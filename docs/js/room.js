// room.js
function init_room() {
	var isMobile = 
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ?
	 		true : false;

	var CODE_INPUT = document.getElementById("codeInput");
	var INPUT_MESSAGE = document.getElementById("inputMessage");
	var BUTTON_CREATE = document.getElementById("createButton");
	var BUTTON_JOIN = document.getElementById("joinButton");

	var click_evt = isMobile ? "touchend" : "click";

	function handle_input_change(e) {
		if (e.data) {
			if (!e.data.match(/[a-z]/i)) {
				CODE_INPUT.value = CODE_INPUT.value.slice(0, CODE_INPUT.value.length - 1);
			}
			CODE_INPUT.value = CODE_INPUT.value.toUpperCase();
		}
	}

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
			if (code.length != 5) {
				INPUT_MESSAGE.innerHTML = "Room Code should be 5 letters long";
			}
			else {
				INPUT_MESSAGE.innerHTML = "";
				join_duel(code);
			}
		}
	}

	CODE_INPUT.addEventListener( 'input', handle_input_change );
	BUTTON_CREATE.addEventListener( click_evt, handle_button_create );
	BUTTON_JOIN.addEventListener( click_evt, handle_button_join);
}

window.addEventListener( "load", init_room() );