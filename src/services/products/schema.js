const { Schema, model } = require("mongoose");

const productSchema = new Schema(
  {
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
    color: {
      type: String,
    },
    woodType: {
      type: String,
    },
    clicked: {
      type: Number,
    },
    price: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

const ProductSchema = model("products", productSchema);

module.exports = ProductSchema;
