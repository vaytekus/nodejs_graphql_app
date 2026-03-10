const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');
const clearImage = require('../utils/file');

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
  },
  login: async ({email, password}) => {
    const user = await User.findOne({ email: email });
    if(!user) {
      const error = new Error('User not found.');
      error.code = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if(!isEqual) {
      const error = new Error('Wrong password.');
      error.code = 401;
      throw error;
    }

    const token = jwt.sign({
      email: user.email,
      userId: user._id.toString()
    }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return { token: token, userId: user._id.toString() };
  },
  createPost: async ({PostInput}, req) => {
    if(!req.isAuth) {
      const error = new Error('Unauthenticated.');
      error.code = 401;
      throw error;
    }

    const errors = [];

    if(validator.isEmpty(PostInput.title)) {
      errors.push('Title is required.');
    }
    if(validator.isEmpty(PostInput.content)) {
      errors.push('Content is required.');
    }
    if(validator.isEmpty(PostInput.imageUrl)) {
      errors.push('Image URL is required.');
    }

    if(errors.length > 0) {
      const error = new Error('Validation failed.');
      error.code = 422;
      error.extensions.data = errors;
      throw error;
    }

    const user = await User.findById(req.userId);

    if(!user) {
      const error = new Error('User not found.');
      error.code = 404;
      throw error;
    }

    const post = new Post({
      title: PostInput.title,
      content: PostInput.content,
      imageUrl: PostInput.imageUrl,
      creator: user
    });

    const createdPost = await post.save();
    user.posts.push(createdPost);
    await user.save();

    // add post to user
    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString()
    };
  },
  posts: async ({ page }, req) => {
    if(!req.isAuth) {
      const error = new Error('Unauthenticated.');
      error.code = 401;
      throw error;
    }

    const currentPage = page || 1;
    const perPage = 2;

    const totalPosts = await Post.countDocuments();
    const posts = await Post.find()
      .populate('creator')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    return {
      posts: posts.map(post => {
        return {
          ...post._doc,
          _id: post._id.toString(),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          creator: {
            _id: post.creator._id.toString(),
            name: post.creator.name
          }
        };
      }),
      totalPosts: totalPosts
    };
  },
  post: async ({ id }, req) => {
    if (!req.isAuth) {
      const error = new Error('Unauthenticated.');
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id).populate('creator');
    if (!post) {
      const error = new Error('Post not found.');
      error.code = 404;
      throw error;
    }
    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      creator: {
        _id: post.creator._id.toString(),
        name: post.creator.name
      }
    };
  },
  updatePost: async ({ id, PostInput }, req) => {
    if (!req.isAuth) {
      const error = new Error('Unauthenticated.');
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id).populate('creator');
    if (!post) {
      const error = new Error('Post not found.');
      error.code = 404;
      throw error;
    }

    if(post.creator._id.toString() !== req.userId) {
      const error = new Error('Not authorized.');
      error.code = 403;
      throw error;
    }

    const errors = [];

    if(validator.isEmpty(PostInput.title)) {
      errors.push('Title is required.');
    }
    if(validator.isEmpty(PostInput.content)) {
      errors.push('Content is required.');
    }
    if(validator.isEmpty(PostInput.imageUrl)) {
      errors.push('Image URL is required.');
    }

    if(errors.length > 0) {
      const error = new Error('Validation failed.');
      error.code = 422;
      error.extensions.data = errors;
      throw error;
    }

    post.title = PostInput.title;
    post.content = PostInput.content;
    if(PostInput.imageUrl) {
      post.imageUrl = PostInput.imageUrl;
    }
    const updatedPost = await post.save();
    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString()
    };
  },
  deletePost: async ({ id }, req) => {
    if (!req.isAuth) {
      const error = new Error('Unauthenticated.');
      error.code = 401;
      throw error;
    }
    
    const post = await Post.findById(id).populate('creator');
    if (!post) {
      const error = new Error('Post not found.');
      error.code = 404;
      throw error;
    }
    
    if(post.creator._id.toString() !== req.userId) {
      const error = new Error('Not authorized.');
      error.code = 403;
      throw error;
    }

    clearImage(post.imageUrl);
    await Post.findByIdAndDelete(id);
    const user = await User.findById(req.userId);
    user.posts.pull(id);
    await user.save();
    return true;
  }
};