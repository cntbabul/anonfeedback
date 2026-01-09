
import dbConnect from "./src/lib/dbConnect";
import UserModel from "./src/model/User";
import 'dotenv/config';

async function listUsers() {
    await dbConnect();
    console.log("Listing all users in database:");
    const users = await UserModel.find({});
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
}

listUsers().catch(console.error);
