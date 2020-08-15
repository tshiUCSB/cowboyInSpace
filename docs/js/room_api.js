// room_api.js
var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
	CODE_LENGTH = 5;

var room_code = null;

function random_code() {
	var s = "";
	for( var i = 0; i < CODE_LENGTH; ++i ) {
		s += ALPHABET.charAt( ( Math.random() * 26 ) | 0 );
	}
	return s;
}

function callback_set_room( err ) {
	if( err ) {

	} else {
		window.location.replace( "../duel/?room=" + room_code );
	}
}

function callback_query_room( snapshot ) {
	if( snapshot.exists() ) {
		firebase.database().ref( "/duels/" + ( room_code = random_code() ) ).once( "value" ).then( callback_query_room );
	} else {
		var data = {};
		data[ "active" ] = true;
		firebase.database().ref( "/duels/" + room_code ).set( data, callback_set_room );
	}
}

function create_duel() {
	firebase.database().ref( "/duels/" + ( room_code = random_code() ) ).once( "value" ).then( callback_query_room );
}

function join_duel( c ) {
	window.location.replace( "../duel/?room=" + c );
}

function watch_duel() {

}