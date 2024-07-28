import chalk from "chalk";
import express from "express";
import CustomError from "../errors/CustomError";

const startTempServer = (port: number) =>
    new Promise((resolve) => {
        const app = express();

        const server = app.listen(port, () => {
            server.close();
            console.log("Cycled temporary server");
            resolve(true);
        });
    });

export default startTempServer;
