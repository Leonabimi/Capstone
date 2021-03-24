const express = require("express");
const ProductSchema = require("../products/schema");
const { authorize } = require("../auth/middleware");
const UserSchema = require("../users/schema");

const producstRouter = express.Router();

producstRouter.post("/", authorize, async (req, res, next) => {
  try {
    const newProduct = new ProductSchema(req.body);
    console.log(req.body);
    await newProduct.save();
    res.status(200).send(newProduct);
  } catch (error) {
    next(error);
  }
});

producstRouter.get("/", authorize, async (req, res, next) => {
  try {
    const products = await ProductSchema.find().populate("user");
    res.status(200).send(products);
  } catch (error) {
    next(error);
  }
});

producstRouter.get("/:id", authorize, async (req, res, next) => {
  try {
    const product = await ProductSchema.findById(req.params.id);
    res.status(200).send(product);
  } catch (error) {
    next(error);
  }
});

producstRouter.put("/:id", authorize, async (req, res, next) => {
  try {
    const productToUpdate = await ProductSchema.findOneAndUpdate(
      { _id: req.params.id },
      { ...req.body },
      {
        runValidators: true,
        new: true,
      }
    );
    if (!productToUpdate) {
      const error = new Error(`Post with id:${req.params.id} not found.`);
      error.httpStatusCode = 404;
      next(error);
    }
    res.status(200).send(productToUpdate);
  } catch (error) {
    next(error);
  }
});

producstRouter.delete("/:id", authorize, async (req, res, next) => {
  try {
    const productToDelete = await ProductSchema.findByIdAndDelete(
      req.params.id
    );
    if (!productToDelete || Object.values(productToDelete).length === 0) {
      const error = new Error(`There is no post with id ${req.params.id}`);
      error.httpStatusCode = 404;
      next(error);
    }
    res.status(204).send("Successfully Deleted Post");
  } catch (error) {
    next(error);
  }
});

module.exports = producstRouter;
