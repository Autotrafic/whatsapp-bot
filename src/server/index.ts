import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { generalError, notFoundError } from "../errors/generalError";
import messagesRouter from "./routes/messagesRouter";
import { addSseClient } from "./sse/controllers";

const app = express();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Infinity,
});

app.use(limiter);
app.use(cors());
app.use(bodyParser.json());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://trusted.cdn.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    })
);
app.use(
    express.json({
        limit: "10kb",
    })
);
app.use(
    express.urlencoded({
        limit: "10kb",
        extended: true,
    })
);

app.get("/", (req, res) => res.send("Working!"));

app.get('/connect', addSseClient);
app.use("/messages", messagesRouter);

app.use(notFoundError);
app.use(generalError);

export default app;
