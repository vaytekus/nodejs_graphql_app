const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');

  if(!authHeader) {
    req.isAuth = false;
    return next();
  }
  // Token can come from Authorization header or from httpOnly cookie
  const token = authHeader
    ? authHeader.split(' ')[1]
    : (req.cookies && req.cookies.token);

  if (!token) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch(err) {
    req.isAuth = false;
    return next();
  }
  if(!decodedToken) {
    req.isAuth = false;
    return next();
  }
  req.userId = decodedToken.userId;
  req.isAuth = true;
  next();
}