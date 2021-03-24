const jwt = require("jsonwebtoken");
const UserSchema = require("../users/schema");

const authenticate = async (user) => {
  try {
    const newAccessToken = await generateJWT({ _id: user._id });
    const newRefreshToken = await generateRefreshJWT({ _id: user._id });

    user.refreshTokens = user.refreshTokens.concat({ token: newRefreshToken });
    await user.save();

    return { token: newAccessToken, refreshToken: newRefreshToken };
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

const generateJWT = (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

const verifyJWT = (token) =>
  new Promise((res, rej) =>
    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
      if (error) rej(error);
      res(decoded);
    })
  );

const generateRefreshJWT = (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1 week" },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

const verifyRefreshToken = (token) =>
  new Promise((res, rej) =>
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) rej(err);
      res(decoded);
    })
  );

const refreshToken = async (oldRefreshToken) => {
  try {
    const decoded = await verifyRefreshToken(oldRefreshToken);

    const user = await UserSchema.findOne({ _id: decoded._id });

    const currentRefreshToken = user.refreshTokens.find(
      (token) => token.token === oldRefreshToken
    );

    if (!currentRefreshToken) {
      throw new Error("Bad refresh token provided!");
    }

    const newAccessToken = await generateJWT({ _id: user._id });
    const newRefreshToken = await generateRefreshJWT({ _id: user._id });

    const newRefreshTokensList = user.refreshTokens
      .filter((token) => token.token !== oldRefreshToken)
      .concat({ token: newRefreshToken });

    user.refreshTokens = [...newRefreshTokensList];
    await user.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (error) {
    console.log(error);
  }
};

module.exports = { authenticate, verifyJWT, refreshToken };
