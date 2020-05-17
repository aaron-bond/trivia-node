import * as http from 'http';
import { Socket } from 'socket.io';

enum Server {
    CreateRoom = 'create-room',
    JoinRoom = 'join-room',
    ShareInformation = 'share-information'
}

enum Client {
    RoomCreated = 'room-created',
    RoomJoined = 'room-joined',
    InformationShared = 'information-shared'
}

export class SocketController {
    private io: SocketIO.Server;
    private rooms: string[] = [];
    private readonly maxRooms = 10;

    /**
     *
     * @param server
     */
    public constructor(server: http.Server) {
        this.io = require('socket.io').listen(server, { origins: '*:*' });

        this.io.on('connect', (socket: Socket) => {
            // The host of the room will trigger the create-room message
            socket.on(Server.CreateRoom, (playerInfo: string) => this.createRoom(socket));

            // All other clients will trigger join-room
            socket.on(Server.JoinRoom, (roomId: string) => this.joinRoom(socket, roomId));

            socket.on(Server.ShareInformation, (information: string) => this.shareInformation(socket, information));

            socket.on('disconnect', (socket: Socket) => {
                console.log('Client disconnected');

                // TODO: figure out how to close a room when all clients disconnect
            });
        });
    }

    /**
     *
     * @param socket
     */
    private createRoom(socket: Socket): void {
        // TODO: figure out what the upper-limit here should be
        if (this.rooms.length >= this.maxRooms) {
            console.error('max room count reached');
            return;
        }

        let roomCode = this.generateRoomCode();
        this.joinRoom(socket, roomCode);

        // Only the host will be waiting for the room-created event
        socket.emit(Client.RoomCreated, roomCode);
    }

    /**
     *
     * @param socket
     * @param roomId
     */
    private joinRoom(socket: Socket, roomId: string): void {
        socket.join(roomId, (error) => {
            if (error) {
                console.error(error);
            } else {
                this.rooms.push(roomId);

                // Let the socket know it's joined successfully
                socket.emit(Client.RoomJoined);
            }
        });
    }

    /**
     *
     */
    private shareInformation(socket: Socket, information: string): void {
        socket.broadcast.emit(Client.InformationShared, information);
    }

    /**
     *
     */
    private generateRoomCode(): string {
        return Math.random().toString(36).substr(2, 5);
    }
}
