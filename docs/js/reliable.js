// reliable.js
function init_reliable( cb_init, c ) {
	var DELAY_TIME = 50;

	var OP_READY = 0x1,
		OP_READY_ACK = 0x2,
		OP_CD = 0x3,
		OP_CD_ACK = 0x4,
		OP_FIRE = 0x5,
		OP_FIRE_ACK = 0x6;

	var rel_data = {};
	rel_data[ "on_ready" ] = null;
	rel_data[ "on_ready_ack" ] = null;
	rel_data[ "on_cd" ] = null;
	rel_data[ "on_cd_ack" ] = null;
	rel_data[ "on_fire" ] = null;
	rel_data[ "on_fire_ack" ] = null;

	var conn = c,
		callback_init = cb_init;

	var packets = [],
		i,
		j;

	function bt( o ) {
		return String.fromCharCode( o );
	}

	function Packet( op, id, msg ) {
		this.op = op;
		this.id = id;
		this.msg = msg;
		this.last_sent = -1;
		this.timeout = 5000;
		conn.send( op, bt( id ) + msg );
	}

	function handle_msg( msg ) {
		var op,
			id,
			p,
			ack;
		op = msg.charCodeAt( 0 );
		id = msg.charCodeAt( 1 );
		msg = msg.substring( 2 );
		ack = ( op % 2 == 0 );
		if( ack ) {
			if( packets[ id ] == null ) {
				return;
			} else {
				p = packets[ id ];
				if( p.op == ( op - 1 ) ) {
					packets[ id ] = null;
				} else {
					return;
				}
			}
		} else {
			conn.send( op + 1, bt( id ) );
		}
		switch( op ) {
			case OP_READY:
				if( rel_data.on_ready != null ) rel_data.on_ready( msg )
				break;
			case OP_READY_ACK:
				if( rel_data.on_ready_ack != null ) rel_data.on_ready_ack( msg );
				break;
			case OP_CD:
				if( rel_data.on_cd != null ) rel_data.on_cd( msg );
				break;
			case OP_CD_ACK:
				if( rel_data.on_cd_ack != null ) rel_data.on_cd_ack( msg );
				break;
			case OP_FIRE:
				if( rel_data.on_fire != null ) rel_data.on_fire( msg );
				break;
			case OP_FIRE_ACK:
				if( rel_data.on_fire_ack != null ) rel_data.on_fire_ack( msg );
				break;
		}
	}

	var last_update = -1;

	function update( time ) {
		if( last_update	== -1 ) last_update	= time;
		var p,
			elapsed = time - last_update;
		for( j = 0; j < packets.length; ++j ) {
			p = packets[ j ];
			if( p != null ) {
				if( p.last_sent	== -1 ) p.last_sent	= time;
				if( time - p.last_sent >= DELAY_TIME ) {
					conn.send( p.op, bt( p.id ) + p.msg );
					p.last_sent	= time;
				}
				p.timeout -= elapsed;
				if( p.timeout < 0 ) {
					packets[ j ] = null;
				}
			}
		}
	}

	function send_packet( op, msg ) {
		var first = -1,
			packet;
		for( i = 0; i < packets.length; ++i ) {
			if( packets[ i ] == null ) {
				first = i;
				break;
			}
		}
		if( first == -1 ) {
			var id = packets.length;
			packets.push( new Packet( op, packets.length, msg ) );
		} else {
			packets[ first ] = new Packet( op, first, msg );
		}
	}

	function send_ready() {
		send_packet( OP_READY, "" );
	}

	function send_cd() {
		send_packet( OP_CD, Date.now().toString() );
	}

	function send_fire() {
		send_packet( OP_READY, Date.now().toString() );
	}

	if( callback_init != null && callback_init != undefined ) {
		rel_data[ "handle_msg" ] = handle_msg;
		rel_data[ "send_ready" ] = send_ready;
		rel_data[ "send_cd" ] = send_cd;
		rel_data[ "send_fire" ] = send_fire;
		rel_data[ "update" ] = update;
		callback_init( rel_data );
	}
}