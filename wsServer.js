import WS from 'ws';
import { v4 as uuidv4 } from 'uuid';

const server = new WS.Server({ port: 5001 });
let room = [];

const CommunicationType = {
	setup: 'SETUP',
	send: 'send',
	cc: 'comunication_completed',
	roomError: 'ROOMERROR',
}

const isInRoom = (room, id) => {
	for (const c of room.clients) {
		if (c.id == id) return true;
	};
	return false;
}

const isCompletedRoom = (room) => {
	let existMobile = false;
	let existPC = false;
	for (const c of room.clients) {
		if (c.isMobile) existMobile = true;
		else existPC = true;
		if (existMobile && existPC) return true;
	}
	return false;
}

server.on("connection", ws => {
	ws.id = uuidv4().split('-')[0];
	ws.on('message', message => {
		const json = JSON.parse(message);
		let returnData = {};
		switch(json.type){
			case CommunicationType.setup: {
				returnData.type = CommunicationType.setup;
				let roomId;
				if(json.isParent) {
					roomId = json.roomId ? json.roomId : uuidv4().split('-')[0];
					returnData['roomId'] = roomId;
					room.push({
						id: roomId,
						messages: [],
						clients: [{
							id: ws.id,
							isMobile: json.isMobile == String(true),
						}],
					});
				} else {
					roomId = json.roomId;
					returnData['roomId'] = roomId;
					const currentRoom = room.filter(r => r.id == roomId)[0];
					if (currentRoom !== undefined) {
						currentRoom.clients.push({
							id: ws.id,
							isMobile: json.isMobile,
						});
						room = room.map(r => r.id === roomId ? currentRoom : r);
						if (isCompletedRoom(currentRoom)) {
							server.clients.forEach(client => {
								if (isInRoom(currentRoom, client.id)) {
									client.send(JSON.stringify({
										type: CommunicationType.cc
									}));
								}
							})
						}
					} else {
						ws.send(JSON.stringify({
							type: CommunicationType.roomError
						}));
					}
				}
				break;
			}
			case CommunicationType.send: {
				returnData.type = CommunicationType.send;
				const currentRoom = room.filter(r=>r.id === json.roomId)[0];
				returnData.messages = json.message;
				server.clients.forEach(client => {
					if (isInRoom(currentRoom, client.id)) client.send(JSON.stringify(returnData));
				});
				break;
			}
		}
	});
});

