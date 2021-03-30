const { validationResult } = require("express-validator");

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id: "1",
        title: "First post",
        content: "THis is a sample content of first post",
        imageUrl: "images/duck.jpg",
        creator: {
          name: "Kunj",
        },
        createdAt: new Date(),
      },
    ],
  });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({
        message: "Validation failed, entered data is incorrect",
        errors: errors.array(),
      });
  }
  const title = req.body.title;
  const content = req.body.content;
  res.status(201).json({
    message: "Post created successfully",
    post: {
      id: new Date().toISOString(),
      title: title,
      content: content,
      imageUrl: "images/duck.jpg",
      creator: {
        name: "Kunj",
      },
      createdAt: new Date(),
    },
  });
};