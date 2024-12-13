import "../loadEnvironment";
import mongoose from "mongoose";
import chalk from "chalk";

const connectDB = (mongoUrl: string) =>
    new Promise((resolve, reject) => {
        mongoose.set("toJSON", {
            virtuals: true,
            transform: (doc, ret) => {
                const newDocument = { ...ret };

                delete newDocument.__v;
                delete newDocument._id;
                delete newDocument.password;

                return newDocument;
            },
        });

        mongoose.set("strictQuery", false);

        try {
            mongoose.connect(mongoUrl);

            mongoose.connection.once("open", () => {
                console.log(
                    chalk.bgBlue.white(
                        "Successfully connected with the database"
                    )
                );
                resolve(true);
            });
        } catch (error) {
            if (error) {
                console.log(
                    chalk.bgRed.white(
                        "An error occurred connecting with database",
                        error.message
                    )
                );
                reject(error);
            }
        }
    });

export default connectDB;
