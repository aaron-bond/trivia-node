import * as bodyParser from "body-parser";
import * as express from "express";
import * as http from "http";

import { RouteProvider } from "./routes";

var cors = require("cors");

class App {
    public app: express.Application;
    public routeProvider = new RouteProvider();
    public server: http.Server;
    public io: SocketIO.Server;

    private readonly PORT = process.env.PORT || 3000;

    public constructor() {
        this.configureApp();

        this.configureServer();

        this.configureSockets();
    }

    private configureApp(): void {
        this.app = express();

        // Adding CORS header to allow all traffic
        this.app.use(cors()); // TODO: restrict to whitelist

        // support application/json type post data
        this.app.use(bodyParser.json());

        // support application/x-www-form-urlencoded post data
        this.app.use(bodyParser.urlencoded({ extended: false }));

        // serve up images from the public directory
        this.app.use(express.static("lib/public"));
    }

    private configureServer(): void {
        this.server = http.createServer(this.app);
    }

    private configureSockets(): void {
        this.io = require("socket.io").listen(this.server, { origins: "*:*" });

        this.server.listen(this.PORT, () => {
            console.log("Running server on port %s", this.PORT);
        });

        this.io.on("connect", (socket: any) => {
            console.log("Connected client on port %s.", this.PORT);
            socket.on("message", (m: any) => {
                console.log("[server](message): %s", JSON.stringify(m));
                this.io.emit("message", m);
            });

            socket.on("disconnect", () => {
                console.log("Client disconnected");
            });
        });
    }
}

export default new App();
