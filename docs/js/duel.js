function init_rtc( cb_init_rtc, cb_packet, cb_sync ) {
	var URL = document.location.href,
		RTC_CFG = { 
			iceServers : [ { url : "stun:stun2.1.google.com:19302" } ] 
		},
		RTC_OPT = {
			optional : [ { RtpDataChannels : true } ]
		},
		DELAY_TIME = 100,
		DELAY_SYNC = 100,
		MAX_SYNCS = 20,
		SCREEN_WAIT = document.getElementById("waitScreen"),
		SCREEN_SYNC = document.getElementById("syncScreen"),
		SCREEN_START = document.getElementById("startScreen"),
		SCREEN_FULL = document.getElementById("fullScreen"),
		SCREEN_INVALID = document.getElementById("invalidScreen"),
		TEXT_ROOM_CODE = document.getElementById("roomCode"),
		OP_SYNC = 0x1,
		OP_SYNC_ACK = 0x2,
		OP_TIME = 0x3,
		OP_TIME_ACK = 0x4,
		OP_GUNSLINGER = 0x5;

	var	callback_info = {},
		callback_init_rtc = cb_init_rtc,
		callback_packet = cb_packet,
		callback_sync = cb_sync,
		room_code = "",
		duel = "",
		game_rtc = null,
		game_channel = null,
		rtc_id = 0,
		last_id = -1,
		last_sync = -1,
		last_time = -1,
		viewer_map = {},
		q_found = false,
		one = true,
		synced = false,
		time_synced = false,
		sync_id = 0,
		syncs = [],
		acked_syncs = 0,
		offset_time = -1,
		ping_avg = -1,
		me = "",
		i;

	function Sync( id ) {
		this.id = id;
		this.time = Date.now();
		this.ping = -1;
	}

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

	function bt( o ) {
		return String.fromCharCode( o );
	}

	function passed_time( time ) {
		return ( Date.now() + offset_time ) - time;
	}

	function send_time() {
		game_channel.send( bt( OP_TIME ) + bt( ping_avg ) + Date.now().toString() );
	}

	function send_gun_packet( op, msg ) {
		game_channel.send( bt( OP_GUNSLINGER ) + bt( op ) + msg );
	}

	function send_sync() {
		var id = sync_id++;
		syncs.push( new Sync( id ) );
		game_channel.send( bt( OP_SYNC ) + bt( id ) );
	}

	function time_loop( time ) {
		if( last_time == -1 ) last_time = time;
		if( time - last_time > DELAY_TIME ) {
			send_time();
			last_time = time;
		}
		if( time_synced ) {
			callback_sync();
		} else {
			window.requestAnimationFrame( time_loop );
		}
	}

	function sync_loop( time ) {
		if( last_sync == -1 ) last_sync = time;
		if( time - last_sync >= DELAY_SYNC ) {
			send_sync();
			last_sync = time;
		}
		if( synced ) {
			var sync,
				sum = 0,
				minPing = null,
				maxPing = -1,
				l = 0;
			for( i = 0; i < syncs.length; ++i ) {
				sync = syncs[ i ];
				if( sync.ping >= 0 ) {
					sum += sync.ping;
					if( minPing == null ) {
						minPing = sync.ping;
						maxPing = sync.ping;
					} else if( sync.ping > maxPing ) {
						maxPing = sync.ping;
					}
					l++;
					if( l == MAX_SYNCS ) break;
				}
			}
			sum -= minPing + maxPing;
			sum /= ( MAX_SYNCS - 2 ) * 2;
			sum = ( sum + 0.5 ) | 0;
			if( sum > 65535 ) sum = 65535;
			ping_avg = sum;
			send_time();
			window.requestAnimationFrame( time_loop );
		} else {
			window.requestAnimationFrame( sync_loop );
		}
	}

	function handle_game_channel_open() {
		if( one ) {
			SCREEN_WAIT.setAttribute( "class", "hide" );
			SCREEN_SYNC.setAttribute( "class", "show" );
			send_sync();
			window.requestAnimationFrame( sync_loop );
		}
	}

	function handle_game_channel_msg( evt ) {
		var msg = evt.data;
		var code = msg.charCodeAt( 0 );
		msg = msg.substring( 1 );
		switch( code ) {
			case OP_SYNC:
				game_channel.send( bt( OP_SYNC_ACK ) + msg )
				break;
			case OP_SYNC_ACK:
				var id = msg.charCodeAt( 0 ),
					sync = syncs[ id ];
				sync.ping = Date.now() - sync.time;
				acked_syncs++;
				if( acked_syncs == MAX_SYNCS ) {
					synced = true;
				}
				break;
			case OP_TIME:
				ping_avg = msg.charCodeAt( 0 );
				offset_time = ( parseInt( msg.substring( 1 ) ) + ping_avg ) - Date.now();
				game_channel.send( bt( OP_TIME_ACK ) + Date.now().toString() );
				if( !time_synced ) {
					callback_sync();
					time_synced = true;
				}
				break;
			case OP_TIME_ACK:
				offset_time = ( parseInt( msg ) + ping_avg ) - Date.now();
				time_synced = true;
				break;
			case OP_GUNSLINGER:
				callback_packet( msg );
				break;
		}
	}

	function callback_empty( err ) {
		if( err ) {
			//console.log( "error" );
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
			game_channel = game_rtc.createDataChannel( "game", { reliable : false } );
			game_channel.onopen = handle_game_channel_open;
			game_channel.onmessage = handle_game_channel_msg;
			firebase.database().ref( duel + "/players/1" ).on( "value", callback_signals );
			firebase.database().ref( duel + "/players/2" ).on( "value", callback_signals );
		}
	}

	function callback_query_room( snapshot ) {
		SCREEN_START.setAttribute( "class", "hide" );
		if( snapshot.exists() ) {
			if( snapshot.child( "active" ).val() ) {
				var p = null,
					data = null;
				if( snapshot.child( "players" ).exists() ) {
					if( snapshot.child( "players/2/" ).exists() ) {

					} else {
						me = p = "2";
						one = false;
						callback_info[ "one" ] = one;
					}
				} else {
					me = p = "1";
				}
				if( p == null ) {
					SCREEN_FULL.setAttribute( "class", "show" );
				} else {
					data = {};
					data[ "from" ] = me;
					data[ "type" ] = "join";
					data[ "id" ] = rtc_id++;
					TEXT_ROOM_CODE.innerHTML = room_code;
					SCREEN_WAIT.setAttribute( "class", "show" );
					firebase.database().ref( duel + "/players/" + p ).push().set( data, callback_join_room );
				}
			}
		} else {
			SCREEN_INVALID.setAttribute( "class", "show" );
			callback_sync();
		}
	}

	if(callback_init_rtc != null && callback_init_rtc != undefined) {
		callback_info[ "send" ] = send_gun_packet;
		callback_info[ "one" ] = one;
		callback_info[ "passed_time" ] = passed_time;
		callback_init_rtc( callback_info );
	}

	firebase.database().ref( duel ).once( "value" ).then( callback_query_room );
}