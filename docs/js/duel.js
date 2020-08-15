// duel.js
var URL = document.location.href;

var	room_code = "",
	q_found = false,
	i;

for( i = 0; i < URL.length; ++i ) {
	if( q_found ) {
		if( room_code == "room=" ) {
			room_code = "";
		}
		room_code += URL.charAt( i );
	} else {
		if( URL.charAt( i ) == '?' ) {
			q_found = true;
		}
	}
}

console.log( room_code );