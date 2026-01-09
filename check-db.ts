
import dbConnect from "./src/lib/dbConnect";
import UserModel from "./src/model/User";
import 'dotenv/config';

async function checkUser() {
    await dbConnect();
    const username = "admin";
    const email = "cntbabul@gmail.com";

    console.log(`Checking for username: ${username}`);
    const userByUsername = await UserModel.findOne({ username });
    if (userByUsername) {
        console.log("User found by username:", JSON.stringify(userByUsername, null, 2));
    } else {
        console.log("No user found with username:", username);
    }

    console.log(`Checking for email: ${email}`);
    const userByEmail = await UserModel.findOne({ email });
    if (userByEmail) {
        console.log("User found by email:", JSON.stringify(userByEmail, null, 2));
    } else {
        console.log("No user found with email:", email);
    }
    process.exit(0);
}

checkUser().catch(console.error);
