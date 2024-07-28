import express, { Request, Response } from "express";
import { Server } from "http";

const tempApp = express();
let tempServer: Server;

tempApp.get("/", (req: Request, res: Response) => {
    res.send("Temporary server is running...");
});

export const startTempServer = (port: number): Promise<void> =>
    new Promise((resolve, reject) => {
        tempServer = tempApp.listen(port, () => {
            console.log(`Temporary server is running on port ${port}`);
            resolve();
        });
        tempServer.on("error", reject);
    });

export const stopTempServer = (): Promise<void> =>
    new Promise((resolve, reject) => {
        if (tempServer) {
            tempServer.close((error?: Error) => {
                if (error) {
                    reject(error);
                } else {
                    console.log("Temporary server stopped.");
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
