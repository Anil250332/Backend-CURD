const mongoose = require("mongoose");

const connectToDB = async () => {
    try {
        await mongoose.connect("mongodb+srv://asahu896214:KXwci4iqsOzor0vq@cluster0.aqhsvuu.mongodb.net/backend-Curd");
        console.log("MongoDB connected");
    } catch (error) {
        console.log(error);
    }
}

module.exports = connectToDB;