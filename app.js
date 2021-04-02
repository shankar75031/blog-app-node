const path = require("path");
const express = require("express");
const multer = require("multer");
const hash = require("random-hash");
const mongoose = require("mongoose");
const { graphqlHTTP } = require("express-graphql");
const graphQlSchema = require("./graphql/schema");
const graphQlResolvers = require("./graphql/resolvers");
const app = express();
const auth = require("./middleware/auth");
const fs = require("fs");
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
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(auth);

app.put("/post-image", (req, res, next) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }
  if (!req.file) {
    return res.status(200).json({ message: "No file provided!" });
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  return res
    .status(201)
    .json({ message: "File stored", filePath: req.file.path });
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphQlSchema,
    rootValue: graphQlResolvers,
    graphiql: true,
    customFormatErrorFn(err) {
      if (!err.originalError) {
        return err;
      }
      const data = err.originalError.data;
      const message = err.message || "An error occured";
      const code = err.originalError.statusCode || 500;
      return {
        message: message,
        status: code,
        data: data,
      };
    },
  })
);

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
    app.listen(8080);
  })
  .catch((err) => console.error(err));

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
