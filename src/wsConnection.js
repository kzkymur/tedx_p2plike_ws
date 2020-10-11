class WSConnection {
	constructor (url) {
		this.sock = new WebSocket(url);
		this.roomId;
		this.onReceiveFuncs = {};
		this.sock.onmessage = (e) => {
			const data = JSON.parse(e.data);
			let haveNotAction = true;
			if (data.type === 'setup') this.roomId = data.roomId
			for (const key in this.onReceiveFuncs) {
				if (data.type === key) {
					this.onReceiveFuncs[key](data);
					haveNotAction = false;
				}
			}
			if (haveNotAction) {
				console.log(e.data);
			}
		};
	}
	setReceive = (key, receiveFunc) => {
		this.onReceiveFuncs[key] = receiveFunc;
	}
	removeReceive = (key) => {
		this.onReceiveFuncs[key] = undefined;
	}
	send = (data) => {
		this.sock.send(JSON.stringify({
			roomId: this.roomId,
			...data
		}));
	}
}

export default WSConnection;
