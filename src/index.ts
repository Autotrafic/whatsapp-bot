import "./loadEnvironment";
import connectDB from "./database";
import startServer from "./server/startServer";
import { connectWhatsapp } from "./database/whatsapp";

const port = +process.env.PORT || 3200;

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
