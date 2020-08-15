// duel.js
var URL = document.location.href,
	RTC_CFG = { 
		iceServers : [ { url : "stun:stun2.1.google.com:19302" } ] 
	},
	RTC_OPT = {
		optional : [ { RtpDataChannels : true } ]
	};

var	room_code = "",
	duel = "",
	game_rtc = null,
	game_channel = null,
	rtc_id = 0,
	last_id = -1,
	viewer_map = {},
	q_found = false,
	one = true,
	me = "",
	i;

for( i = 0; i < URL.length; ++i ) {
	if( q_found ) {
		room_code = room_code.toUpperCase();
		if( room_code == "ROOM=" ) {
			room_code = "";
		}
		room_code += URL.charAt( i );
	} else {
		if( URL.charAt( i ) == '?' ) {
			q_found = true;
		}
	}
}

duel = "/duels/" + room_code;

function callback_empty( err ) {
	if( err ) {
		console.log( "error" );
	}
}

function callback_rtc( snapshot ) {
	var action = snapshot.val();
	console.log( action );
	if( action.from == me ) return;
	var to;
	if( action.from == "1" || action.from == "2" ) {
		if( action.id <= last_id ) return;
		last_id = action.id;
	}
	switch( action.type ) {
		case "join":
			if( action.from == "2" ) {
				console.log( "we made it?" );
				game_rtc.createOffer().then( function( offer ) {
					game_rtc.setLocalDescription( offer );
				} ).then( function() {
					var data = {};
					data[ "type" ] = "offer";
					data[ "from" ] = me;
					data[ "offer" ] = JSON.stringify( game_rtc.localDescription );
					data[ "id" ] = rtc_id++;
					firebase.database().ref( duel + "/players/2" ).push().set( data, callback_empty );
				} );
			}
			break;
		case "ice":
			if( action.from == "1" || action.from == "2" ) {
				game_rtc.addIceCandidate( new RTCIceCandidate( JSON.parse( action.ice ) ) );
			}
			break;
		case "offer":
			if( action.from == "1" ) {
				game_rtc.setRemoteDescription( new RTCSessionDescription( JSON.parse( action.offer ) ) );
				game_rtc.createAnswer().then( function( answer ) {
					game_rtc.setLocalDescription( answer );
				} ).then( function() {
					var data = {};
					data[ "type" ] = "answer";
					data[ "from" ] = me;
					data[ "answer" ] = JSON.stringify( game_rtc.localDescription );
					data[ "id" ] = rtc_id++;
					firebase.database().ref( duel + "/players/2" ).push().set( data, callback_empty );
				} );
			}
			break;
		case "answer":
			if( action.from == "2" ) {
				game_rtc.setRemoteDescription( new RTCSessionDescription( JSON.parse( action.answer ) ) );
			}
			break;
	}
}

function callback_signals( snapshot ) {
	if( !snapshot.exists() ) return;
	snapshot.forEach( callback_rtc );
}

function callback_ice_candidate( evt ) {
	if( evt.candidate ) {
		var data = {},
			id,
			to;
		if( this == game_rtc ) {
			to = one ? "2" : "1";
			to = "/players/" + to;
			id = rtc_id++;
		} else {
			to = viewer_map[ this ];
			to = "/viewers/" + to;
		}
		data[ "type" ] = "ice";
		data[ "from" ] = me;
		data[ "ice" ] = JSON.stringify( evt.candidate );
		data[ "id" ] = id;
		firebase.database().ref( duel + to ).push().set( data, callback_empty );
	}
}

function callback_join_room( err ) {
	if( err ) {

	} else {
		game_rtc = new RTCPeerConnection( RTC_CFG, RTC_OPT );
		game_rtc.onicecandidate = callback_ice_candidate;
		game_channel = game_rtc.createDataChannel( "game" );
		firebase.database().ref( duel + "/players/1" ).on( "value", callback_signals );
		firebase.database().ref( duel + "/players/2" ).on( "value", callback_signals );
	}
}

function callback_query_room( snapshot ) {
	if( snapshot.exists() ) {
		if( snapshot.child( "active" ).val() ) {
			var p = null,
				data = null;
			if( snapshot.child( "players" ).exists() ) {
				if( snapshot.child( "players/2/" ).exists() ) {

				} else {
					me = p = "2";
					one = false;
				}
			} else {
				me = p = "1";
			}
			if( p != null ) {
				data = {};
				data[ "from" ] = me;
				data[ "type" ] = "join";
				data[ "id" ] = rtc_id++;
				firebase.database().ref( duel + "/players/" + p ).push().set( data, callback_join_room );
			}
		}
	} else {

	}
}

firebase.database().ref( duel ).once( "value" ).then( callback_query_room );

console.log( room_code );