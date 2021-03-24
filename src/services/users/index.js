const express = require("express");
const bcrypt = require("bcrypt");
const { authenticate, verifyJWT, refreshToken } = require("../auth/tools");
const { authorize } = require("../auth/middleware");
const UserSchema = require("./schema");
const ProductsSchema = require("../products/schema");
const passport = require("passport");
ObjectId = require("mongodb").ObjectID;
const usersRouter = express.Router();

usersRouter.post("/register", async (req, res, next) => {
  try {
    const newUser = await UserSchema(req.body);
    const { _id } = await newUser.save();
    res.send(newUser);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

usersRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UserSchema.findByCredentials(email, password);

    const token = await authenticate(user);
    console.log(token.token);
    res
      .cookie("token", token, {
        httpOnly: true,
      })
      .cookie("refreshToken", token.refreshToken, {
        httpOnly: true,
        path: "/api/users/refreshToken",
      })
      .send({ message: "logged in" });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

usersRouter.get("/refreshToken", async (req, res, next) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken;

    const token = await refreshToken(oldRefreshToken);
    console.log(token);
    res.cookie("token", token.accessToken, {
      httpOnly: true,
    });
    res.cookie("refreshToken", token.refreshToken, {
      httpOnly: true,
      path: "/api/users/refreshToken",
    });

    res.send(token);
  } catch (error) {
    next(error);
  }
});

usersRouter.post(
  "/addProductToCart/:productId",
  authorize,
  async (req, res, next) => {
    try {
      const productId = req.params.productId;
      const product = await ProductsSchema.findById(productId);
      if (product) {
        const newProduct = {
          ...product.toObject(),
          quantity: req.body.quantity,
        };

        const isProductThere = await UserSchema.findProductInCart(
          req.user._id,
          req.params.productId
        );
        if (isProductThere) {
          await UserSchema.incrementCartQuantity(
            req.user._id,
            req.params.productId,
            req.body.quantity
          );
          res.send("Quantity incremented");
        } else {
          await UserSchema.addProductToCart(req.user._id, newProduct);
          res.send("new Product Added to cart");
        }
      }
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.delete(
  "/removeProductFromCart/:userId/:productId",
  authorize,
  async (req, res, next) => {
    try {
      const productId = req.params.productId;

      console.log(req.params.productId, "aaaaaaaaaaaaaaaaaaaaaaaaa");

      const product = await ProductsSchema.findById(req.params.productId);

      if (product) {
        const isProductThere = await UserSchema.findProductInCart(
          req.params.userId,
          req.params.productId
        );

        if (isProductThere) {
          const correctProduct = await isProductThere.cart.find(
            (prod) => prod.products == req.params.productId
          );
          console.log("correctProduct", correctProduct);
          if (correctProduct.quantity > 1) {
            await UserSchema.incrementCartQuantity(
              req.params.userId,
              req.params.productId,
              req.body.quantity
            );
            console.log("isProductThere", isProductThere);
            res.send("Quantinty decremendted");
          } else {
            let user = await UserSchema.findOne({ _id: req.params.userId });
            if (user !== undefined && user !== null) {
              UserSchema.removeProductFromCart(
                req.params.userId,
                correctProduct
              );
              res.send(" Product deleted from cart");
            } else {
              throw new Error("User is undefined");
            }
          }
        } else {
          throw new Error("This is bad no clue !");
        }
      }
    } catch (error) {
      next(error);
    }
  }
);

module.exports = usersRouter;
