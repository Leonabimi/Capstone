const router = require("express").Router();

const usersRouter = require("./users");
const postsRouter = require("./products");

router.use("/users", usersRouter);
router.use("/products", postsRouter);

module.exports = router;
