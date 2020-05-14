import { Application, Request, Response } from "express";

export class RouteProvider {
    public routes(app: Application): void {
        app.route("/").get((req: Request, res: Response) =>
            this._handleBaseRequest(req, res)
        );
    }

    private _handleBaseRequest(request: Request, response: Response): void {
        response.status(200).send({
            message: "Health check successful"
        });
    }
}
