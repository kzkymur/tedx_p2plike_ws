import WS from 'ws';
import { v4 as uuidv4 } from 'uuid';

const server = new WS.Server({ port: 5001 });
let room = [];

const CommunicationType = {
	setup: 'SETUP',
	send: 'send',
	cc: 'comunication_completed',
}

server.on("connection", ws => {
	ws.id = uuidv4().split('-')[0];
    ws.on('message', message => {
        const json = JSON.parse(message);
        console.log(json);
		let returnData = {};
		switch(json.type){
			case CommunicationType.setup: {
				returnData.type = CommunicationType.setup;
				let roomId;
				if(json.isParent) {
					roomId = uuidv4().split('-')[0];
					returnData['roomId'] = roomId;
					room.push({
						id: roomId,
						messages: [],
						clients: [ws.id],
					});
				} else {
					roomId = json.roomId;
					returnData['roomId'] = roomId;
					const currentRoom = room.filter(r => r.id === roomId)[0];
					currentRoom.clients.push(ws.id);
					room = room.map(r => r.id === roomId ? currentRoom : r);
					server.clients.forEach(client => {
						if (currentRoom.clients.indexOf(client.id)>-1) {
							client.send(JSON.stringify({
								type: CommunicationType.cc
							}));
						};
					})
				}
				returnData['messages'] = room.filter(r => r.id === roomId)[0].messages;
				ws.send(JSON.stringify(returnData));
				break;
			}
			case CommunicationType.send: {
				returnData.type = CommunicationType.send;
				const roomId = json.roomId;
				const currentRoom = room.filter(r=>r.id === roomId)[0];
				currentRoom.messages.push(json.message);
				room = room.map(r => r.id === roomId ? currentRoom : r);
				returnData['messages'] = currentRoom.messages;
				server.clients.forEach(client => {
					if (currentRoom.clients.indexOf(client.id)>-1) client.send(JSON.stringify(returnData));
				});
				break;
			}
		}
    });
});

