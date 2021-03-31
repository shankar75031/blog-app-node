const path = require("path");
const express = require("express");
const multer = require("multer");
const hash = require("random-hash");
const mongoose = require("mongoose");
const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");

const app = express();
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, hash.generateHash({ length: 5 }) + "-" + file.originalname);
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const MONGODB_URI = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.edrzp.mongodb.net/messages?retryWrites=true&w=majority`;

// MIDDLEWARES
// app.use(express.urlencoded({ extended: true })); //x-www-form-urlencoded data handling done using this
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  // Set which domains can send requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  // Set types of HTTP requests to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  // Set the types of headers that the client can set on their requests
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// ROUTES
app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

// ERROR HANDLING MIDDLEWARE
app.use((error, req, res, next) => {
  console.log(error);
  const statusCode = error.statusCode || 500;
  const message = error.message;
  const data = error.data || [];
  res.status(statusCode).json({ message: message, data: data });
});

// CONNECT TO DB
mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    console.log("DB CONNECTED");
    const server = app.listen(8080);
    const io = require("./socket").init(server);

    io.on("connection", (socket) => {
      console.log("Client connected");
    });
  })
  .catch((err) => console.error(err));
