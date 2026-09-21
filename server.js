const express = require("express");
const connectToDB = require("./src/db");
const User = require("./src/model/auth.model");
const Note = require("./src/model/notes.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());

app.get("/",(req,res)=>{
    res.send("Hello World");
})


app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body || {};
        const hashPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashPassword });
        await user.save();

        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body || {};
        const user = await User.findOne({ email });
        
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                const jwtToken = jwt.sign({ userId: user._id, email: user.email }, "secretKey");
               res.cookie("jwtToken", jwtToken);
                return res.json({ user, jwtToken });

            }
        }
        res.status(401).json({ error: "Invalid credentials" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/logout",(req,res)=>{
    res.clearCookie("jwtToken");
    res.json({message:"Logout successful"});
})

app.get("/getAllUser", async (req, res) => {
    const users = await User.find();
    res.json(users);
});

const getToken = (req) => {
    return req.body?.jwtToken || req.headers.authorization?.split(" ")[1] || req.headers.authorization || req.query?.jwtToken;
};

app.post("/createNotes", async (req, res) => {
    try {
        const { title, description } = req.body || {};
        const token = getToken(req);

        if (!token) {
            return res.status(401).json({ error: "JWT token required" });
        }

        const decodedToken = jwt.verify(token, "secretKey");
        const note = new Note({
            title,
            description,
            userId: decodedToken.userId,
        });

        await note.save();
        res.status(201).json(note);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/getNotes", async (req, res) => {
    try {
        const token = getToken(req);

        if (!token) {
            return res.status(401).json({ error: "JWT token required" });
        }

        const decodedToken = jwt.verify(token, "secretKey");
        const notes = await Note.find({ userId: decodedToken.userId });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete("/deleteNote/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.cookies.jwtToken;

        if (!token) {
            return res.status(401).json({ error: "JWT token required" });
        }

        const decodedToken = jwt.verify(token, "secretKey");
        const deletedNote = await Note.findOneAndDelete({ _id: id, userId: decodedToken.userId });

        if (!deletedNote) {
            return res.status(404).json({ error: "Note not found or unauthorized" });
        }

        res.json({ message: "Note deleted successfully", deletedNote });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



connectToDB();
app.listen(3000, () => {
    console.log("Server started on port 3000");
});
