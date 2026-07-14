import jwt from 'jsonwebtoken';

// A JWT payload is readable by anyone holding the token, so we only put the id in it.
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export default generateToken;
