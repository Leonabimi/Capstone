const { verifyJWT } = require("./tools");
const userModel = require("../users/schema");

const authorize = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const decoded = await verifyJWT(token);
    const user = await userModel.findOne({ _id: decoded._id });

    if (!user) {
      throw new Error();
    }
    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authorize };
