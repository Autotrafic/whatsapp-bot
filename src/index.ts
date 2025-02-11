import "./loadEnvironment";
import connectDB from "./database";
import startServer from "./server/startServer";
import { connectWhatsapp } from "./database/whatsapp";
import { startTempServer, stopTempServer } from "./server/startTempServer";
import notifySlack from "./server/services/notifier";

const port = +process.env.PORT || 3200;
const mongoURL = process.env.MONGODB_URL;
const isProduction = process.env.NODE_ENV === "production";

(async () => {
    try {
        // await startTempServer(port);

        await connectDB(mongoURL);
        await connectWhatsapp(isProduction);

        // await stopTempServer();

        await startServer(port);
    } catch (error) {
        process.exit(1);
    }
})();

process.on("uncaughtException", (err) => {
    console.error("There was an uncaught error", err);
    notifySlack(`App crashing. Uncaught exception: ${err}`);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
