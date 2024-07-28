import "./loadEnvironment";
import connectDB from "./database";
import startServer from "./server/startServer";
import { connectWhatsapp } from "./database/whatsapp";

const port = +process.env.PORT || 3200;
console.log(`Server will satrt with port: ${port}`);

const mongoURL = process.env.MONGODB_URL;
const isProduction = process.env.NODE_ENV === "production";

(async () => {
    try {
        await connectDB(mongoURL);
        await connectWhatsapp(isProduction);
        await startServer(port);
    } catch (error) {
        process.exit(1);
    }
})();

process.on("uncaughtException", (err) => {
    console.error("There was an uncaught error", err);
    process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
