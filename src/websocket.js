class WSConnection {
	constructor (url) {
		this.sock = new WebSocket(url);
		this.roomId;
		this.onReceiveFuncs = {};
		this.sock.onmessage = (e) => {
			const data = JSON.parse(e.data);
			let haveNotAction = true;
			if (data.type === 'SETUP') this.roomId = data.roomId
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

const connection = new WSConnection("ws://127.0.0.1:5001");

connection.setReceive("SETUP", data => { console.log('sucess setup!'); console.log(data)});
connection.setReceive("send", data => { console.log(data); });

const setup = document.getElementById("setup");
setup.addEventListener("submit", function(event) {
	const parent = document.getElementById('parent');
	const roomId = document.getElementById('roomId');
	event.preventDefault();
	connection.send({
		type: 'SETUP',
		isParent: parent.checked,
		roomId: roomId.value,
	});
}, false);

const send = document.getElementById("send");
const message = document.getElementById("message");
send.addEventListener("submit", function(event) {
	const value = message.value;
	connection.send({
		type: 'send',
		message: value,
	});
	event.preventDefault();
}, false);

