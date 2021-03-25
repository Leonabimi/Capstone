const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const validator = require("validator");

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Type your Name"],
    },
    surname: {
      type: String,
      required: [true, "Type your Surname"],
    },
    email: {
      type: String,
      required: [true, "Type your Email"],
      unique: [true, "This email already exists"],
      validate: [validator.isEmail, "Please enter valid email"],
    },
    password: {
      type: String,
      minLength: [4, "Password is to short (4 characters minimum)"],
    },
    role: {
      type: String,
      enum: ["Admin", "User"],
    },
    cart: [
      {
        total: Number,
        products: { type: Schema.Types.ObjectId, ref: "products" },
        quantity: { type: Number, default: 1 },
      },
    ],
    refreshTokens: [{ token: { type: String } }],
  },
  {
    timestamps: true,
  }
);

userSchema.static("findProductInCart", async function (id, productId) {
  const isProduct = await UserSchema.findOne({
    _id: id,
    "cart.products": productId,
  });
  return isProduct;
});

userSchema.static("addProductToCart", async function (id, product) {
  await UserSchema.findOneAndUpdate(
    { _id: id },
    {
      $addToSet: { cart: { products: product } },
    }
  );
});

userSchema.static("removeProductFromCart", async function (id, product) {
  await UserSchema.findOneAndUpdate(
    { _id: id },
    {
      $pull: { cart: { products: product.products } },
    }
  );
});

userSchema.static(
  "incrementCartQuantity",
  async function (id, productId, quantity) {
    await UserSchema.findOneAndUpdate(
      {
        _id: id,
        "cart.products": productId,
      },
      {
        $inc: { "cart.$.quantity": quantity },
      }
    );
  }
);

userSchema.static("calculateCartTotal", async function (id) {
  const { cart } = await UserSchema.findById(id);
  return cart
    .map((product) => product.price * price.quantity)
    .reduce((acc, el) => acc + el, 0);
});

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.__v;

  return userObject;
};

userSchema.statics.findByCredentials = async function (email, plainPW) {
  const user = await this.findOne({ email });

  if (user) {
    const isMatch = await bcrypt.compare(plainPW, user.password);
    if (isMatch) return user;
    else return null;
  } else {
    return null;
  }
};

userSchema.pre("save", async function (next) {
  const user = this;
  const plainPW = user.password;

  if (!user.password) {
    user.password = crypto.randomBytes(12).toString("hex");
  }
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  next();
});

userSchema.pre("findOneAndUpdate", async function (next) {
  const user = this.getUpdate();

  const current = await UserSchema.findOne({ email: user.email });
  if (user.password) {
    const isMatch = await bcrypt.compare(user.password, current.password);
    if (!isMatch) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  }
});

const UserSchema = model("users", userSchema);

module.exports = UserSchema;
