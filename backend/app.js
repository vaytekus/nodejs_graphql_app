const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const multer = require('multer');
const { graphqlHTTP } = require('express-graphql');
const schema = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const auth = require('./middleware/auth');
const clearImage = require('./utils/file');
const app = express();

const MONGODB_URI = process.env.MONGODB_URI;

// file upload middleware
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/images', express.static(path.join(__dirname, 'images')));

// set headers (use specific origin when using cookies + credentials)
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', frontendOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if(req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(auth);

app.put('/post-image', (req, res, next) => {  
  if(!req.isAuth) {
    const error = new Error('Unauthenticated.');
    error.statusCode = 401;
    throw error;
  }
  if(!req.file) {
    const error = new Error('No image provided.');
    error.statusCode = 422;
    throw error;
  }
  if(req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  const imageUrl = req.file.path;
  res.status(200).json({ message: 'Image uploaded successfully.', image: imageUrl });
});

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: resolvers,
  graphiql: true,
  customFormatErrorFn: (error) => {
    return {
      message: error.message,
      status: error.extensions?.code,
      data: error.extensions?.data
    };
  }
}));

// error handling middleware
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

// connect to database
mongoose
  .connect(
    MONGODB_URI
  )
  .then(result => {
    const server = app.listen(8080);
  })
  .catch(err => {
    console.log(err);
  });