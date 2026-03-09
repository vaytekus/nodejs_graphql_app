const User = require('../models/user');
const bcrypt = require('bcryptjs');
const validator = require('validator');

module.exports = {
  createUser: async ({UserInput}, req) => {
    if(!validator.isEmail(UserInput.email)) {
      throw new Error('Invalid email.');
    }
    if(!validator.isLength(UserInput.password, { min: 5 })) {
      throw new Error('Invalid password.');
    }
    if(!validator.isLength(UserInput.name, { min: 3 })) {
      throw new Error('Invalid name.');
    }


    const existingUser = await User.findOne({ email: UserInput.email });
    if(existingUser) {
      throw new Error('User already exists.');
    }
    const hashedPassword = await bcrypt.hash(UserInput.password, 12);
    const user = new User({
      email: UserInput.email,
      password: hashedPassword,
      name: UserInput.name
    });
    const createdUser = await user.save();
    return {
      ...createdUser._doc,
      _id: createdUser._id.toString(),
      password: null
    };
  }
  // createUser: async (req, res, next) => {
  //   const errors = validationResult(req);
  //   if (!errors.isEmpty()) {
  //     const error = new Error('Validation failed, entered data is incorrect.');
  //     error.statusCode = 422;
  //     error.data = errors.array();
  //     throw error;
  //   }
  //   const email = req.body.email;
  //   const name = req.body.name;
  //   const password = req.body.password;
  //   const user = new User({
  //     email: email,
  //     password: password,
  //     name: name
  //   });
  //   await user.save();
  //   return {
  //     _id: user._id,
  //     email: user.email,
  //     name: user.name
  //   };
  // }
};