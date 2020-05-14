import * as bodyParser from "body-parser";
import * as express from "express";

import { RouteProvider } from "./routes";

var cors = require("cors");

class App {
    public app: express.Application;
    public routeProvider = new RouteProvider();

    public constructor() {
        this.app = express();
        this.config();
        this.routeProvider.routes(this.app);
    }

    private config(): void {
        // Adding CORS header to allow all traffic
        // TODO: restrict to whitelist
        this.app.use(cors());

        // support application/json type post data
        this.app.use(bodyParser.json());

        // support application/x-www-form-urlencoded post data
        this.app.use(bodyParser.urlencoded({ extended: false }));

        // serve up images from the public directory
        this.app.use(express.static("lib/public"));
    }
}

export default new App().app;
