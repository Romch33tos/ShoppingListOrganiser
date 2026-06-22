const express = require('express');
const session = require('express-session');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(session({
  secret: 'shopping-list-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'ShoppingListOrganizer';

let db;
let usersCollection;
let shoppingListsCollection;
let permissionsCollection;

async function connectDB() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
  usersCollection = db.collection('users');
  shoppingListsCollection = db.collection('shoppingLists');
  permissionsCollection = db.collection('permissions');
  console.log('Connected to MongoDB');
}
