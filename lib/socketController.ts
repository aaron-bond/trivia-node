import * as http from 'http';
import { Socket } from 'socket.io';

enum Server {
    CreateLobby = 'create-lobby',
    JoinLobby = 'join-lobby',
    ShareInformation = 'share-information',
    SynchroniseLobby = 'synchronise-lobby'
}

enum Client {
    LobbyCreated = 'lobby-created',
    LobbyClosed = 'lobby-closed',
    LobbyJoined = 'lobby-joined',
    InformationShared = 'information-shared',
    LobbySynchronised = 'lobby-synchronised'
}

export class SocketController {
    private io: SocketIO.Server;
    private lobbies: string[] = [];
    private readonly maxLobbies = 50;

    /**
     *
     * @param server
     */
    public constructor(server: http.Server) {
        this.io = require('socket.io').listen(server, { origins: '*:*' });

        this.io.on('connect', (socket: Socket) => {
            // The host of the lobby will trigger the create-lobby message
            socket.on(Server.CreateLobby, (playerInfo: string) => this.createLobby(socket));

            // All other clients will trigger join-lobby
            socket.on(Server.JoinLobby, (lobbyId: string) => this.joinLobby(socket, lobbyId));

            socket.on(Server.ShareInformation, (information: string) => this.shareInformation(socket, information));
            socket.on(Server.SynchroniseLobby, (lobby: string) => this.synchroniseLobby(socket, lobby));

            socket.on('disconnect', (socket: Socket) => {
                console.log('Client disconnected');
            });
        });
    }

    /**
     *
     * @param socket
     */
    private createLobby(socket: Socket): void {
        if (this.lobbies.length >= this.maxLobbies) {
            console.error('max lobby count reached');
            return;
        }

        console.info('lobby count: ' + this.lobbies.length);

        let lobbyCode = this.generateLobbyCode();
        this.joinLobby(socket, lobbyCode);

        // Only the host will be waiting for the lobby-created event
        socket.emit(Client.LobbyCreated, lobbyCode);

        // ? Only the host should listen for this disconnect
        socket.on('disconnect', (socket: Socket) => {
            console.log('Host disconnected');

            this.closeLobby(lobbyCode);
        });
    }

    /**
     *
     * @param socket
     * @param lobbyId
     */
    private joinLobby(socket: Socket, lobbyId: string): void {
        socket.join(lobbyId, (error) => {
            if (error) {
                console.error(error);
                return;
            }

            this.lobbies.push(lobbyId);

            // Let the socket know it's joined successfully
            socket.emit(Client.LobbyJoined);
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
     * @param socket
     * @param lobby
     */
    private synchroniseLobby(socket: Socket, lobby: string): void {
        socket.broadcast.emit(Client.LobbySynchronised, lobby);
    }

    /**
     *
     */
    private generateLobbyCode(): string {
        return Math.random().toString(36).substr(2, 5);
    }

    /**
     *
     * @param lobbyCode
     */
    private closeLobby(lobbyCode: string): void {
        // Remove the lobby from the set
        this.lobbies = this.lobbies.filter((lobbyId) => lobbyId !== lobbyCode);

        // Disconnect any clients
        this.io.sockets.in(lobbyCode).clients((error: string, socketIds: string[]) => {
            if (error) {
                console.error(error);
                return;
            }

            socketIds.forEach((socketId: string) => {
                this.io.sockets.sockets[socketId].leave(lobbyCode);

                this.io.sockets.sockets[socketId].emit(Client.LobbyClosed);
            });
        });
    }
}
