import https from "https";
import fs from "fs";
import WS from 'ws';
import { v4 as uuidv4 } from 'uuid';

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


const app = https.createServer({
    key: fs.readFileSync("/etc/letsencrypt/live/invisible.kzkymur.com/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/invisible.kzkymur.com/cert.pem")
}, (req, res) => {
    // ダミーリクエスト処理
    res.writeHead(200);
    res.end("All glory to WebSockets!\n");
}).listen(5001);

const server = new WS.Server({ server: app });
let room = [];


server.on("connection", ws => {
	ws.id = uuidv4().split('-')[0];
	ws.on('message', message => {
		const json = JSON.parse(message);
		console.log(json);
		for (const r of room) console.log(r);
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
						ws.send(JSON.stringify({
							type: CommunicationType.setup,
							roomId: roomId
						}));
					} else {
						ws.send(JSON.stringify({
							type: CommunicationType.roomError
						}));
					}
				}
				break;
			}
			case CommunicationType.send: {
				const currentRoom = room.filter(r=>r.id == json.roomId)[0];
				returnData = json;
				if (currentRoom!=undefined) {
					server.clients.forEach(client => {
						if (isInRoom(currentRoom, client.id)) client.send(JSON.stringify(returnData));
					});
				}
				break;
			}
		}
	});
	ws.on('close', ()=>{
		let currentRoom;
		console.log('closeId:'+ ws.id);
		for (const r of room) {
			if (isInRoom(r, ws.id)) {
				currentRoom = {...r};
				currentRoom.clients = currentRoom.clients.filter(c => c.id != ws.id);
				break;
			}
		}
		if (currentRoom) room = room.map(r => r.id == currentRoom.id ? currentRoom : r);
		for (const r of room) {
			if (r.clients.length == 0) {
				room = room.filter(ro => ro.id != r.id);
			}
		}
	})
});

