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

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

async function checkAccess(listId, userId, requiredRole = null) {
  const list = await shoppingListsCollection.findOne({ _id: new ObjectId(listId) });
  if (!list) return false;

  if (list.createdBy.toString() === userId.toString()) return true;

  const permission = await permissionsCollection.findOne({
    listId: new ObjectId(listId),
    userId: new ObjectId(userId)
  });

  if (!permission) return false;

  if (!requiredRole) return true;

  const roleHierarchy = { owner: 3, editor: 2, commenter: 1, viewer: 0 };
  const userRoleLevel = roleHierarchy[permission.role];
  const requiredLevel = roleHierarchy[requiredRole];

  return userRoleLevel >= requiredLevel;
}

async function getUserRole(listId, userId) {
  const list = await shoppingListsCollection.findOne({ _id: new ObjectId(listId) });
  if (list && list.createdBy.toString() === userId.toString()) return 'owner';

  const permission = await permissionsCollection.findOne({
    listId: new ObjectId(listId),
    userId: new ObjectId(userId)
  });
  return permission ? permission.role : null;
}

async function getUserNameById(userId) {
  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  return user ? user.name : 'Неизвестный';
}

function validateString(str, fieldName, min = 1, max = 100) {
  if (!str || typeof str !== 'string') {
    return `${fieldName} обязательно для заполнения`;
  }
  const trimmed = str.trim();
  if (trimmed.length < min) {
    return `${fieldName} должен содержать минимум ${min} символ${min === 1 ? '' : 'а'}`;
  }
  if (trimmed.length > max) {
    return `${fieldName} не может превышать ${max} символов`;
  }
  return null;
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return 'Email обязателен для заполнения';
  }
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 100) {
    return 'Email должен содержать от 5 до 100 символов';
  }
  const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return 'Введите корректный email адрес';
  }
  return null;
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return 'Пароль обязателен для заполнения';
  }
  if (password.length < 4) {
    return 'Пароль должен содержать минимум 4 символа';
  }
  if (password.length > 50) {
    return 'Пароль не может превышать 50 символов';
  }
  return null;
}

function validateQuantity(quantity) {
  if (quantity === undefined || quantity === null || quantity === '') {
    return null;
  }
  const num = parseFloat(quantity);
  if (isNaN(num)) {
    return 'Количество должно быть числом';
  }
  if (num <= 0) {
    return 'Количество должно быть больше нуля';
  }
  if (num > 99999) {
    return 'Количество не может превышать 99999';
  }
  return null;
}

function validateComment(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }
  const trimmed = text.trim();
  if (trimmed.length > 500) {
    return 'Комментарий не может превышать 500 символов';
  }
  return null;
}

app.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('register', { error: null, formData: {} });
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const errors = [];

  const nameError = validateString(name, 'Имя', 2, 50);
  if (nameError) errors.push(nameError);

  const emailError = validateEmail(email);
  if (emailError) errors.push(emailError);

  const passwordError = validatePassword(password);
  if (passwordError) errors.push(passwordError);

  if (errors.length > 0) {
    return res.render('register', { error: errors[0], formData: { name, email } });
  }

  const existingUser = await usersCollection.findOne({ email: email.trim() });
  if (existingUser) {
    return res.render('register', { error: 'Пользователь с таким email уже существует', formData: { name, email } });
  }

  const user = {
    name: name.trim(),
    email: email.trim(),
    passwordHash: `hash_${password}`,
    registeredAt: new Date()
  };

  const result = await usersCollection.insertOne(user);
  req.session.userId = result.insertedId.toString();
  req.session.userName = user.name;
  res.redirect('/');
});

app.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('login', { error: null, formData: {} });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const emailError = validateEmail(email);
  if (emailError) {
    return res.render('login', { error: emailError, formData: { email } });
  }

  if (!password || password.length < 1) {
    return res.render('login', { error: 'Введите пароль', formData: { email } });
  }

  const user = await usersCollection.findOne({ email: email.trim() });
  if (!user || user.passwordHash !== `hash_${password}`) {
    return res.render('login', { error: 'Неверный email или пароль', formData: { email } });
  }

  req.session.userId = user._id.toString();
  req.session.userName = user.name;
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/', requireAuth, async (req, res) => {
  const userId = new ObjectId(req.session.userId);

  const ownedLists = await shoppingListsCollection.find({ createdBy: userId }).toArray();

  const permissions = await permissionsCollection.find({ userId }).toArray();
  const sharedListIds = permissions.map(p => p.listId);
  const sharedLists = sharedListIds.length > 0 
    ? await shoppingListsCollection.find({ _id: { $in: sharedListIds } }).toArray()
    : [];

  const allLists = [...ownedLists, ...sharedLists];

  const listsWithStats = await Promise.all(allLists.map(async (list) => {
    const notPurchasedCount = list.items.filter(item => item.status === 0).length;
    let userRole = 'viewer';
    if (list.createdBy.toString() === req.session.userId) {
      userRole = 'owner';
    } else {
      const perm = permissions.find(p => p.listId.toString() === list._id.toString());
      if (perm) userRole = perm.role;
    }
    return {
      ...list,
      notPurchasedCount,
      userRole
    };
  }));

  res.render('index', { lists: listsWithStats, userName: req.session.userName });
});

app.get('/list/create', requireAuth, (req, res) => {
  res.render('createList', { error: null, formData: {} });
});

app.post('/list/create', requireAuth, async (req, res) => {
  const { name, description } = req.body;

  const nameError = validateString(name, 'Название списка', 1, 100);
  if (nameError) {
    return res.render('createList', { error: nameError, formData: { name, description } });
  }

  let descriptionError = null;
  if (description && description.trim().length > 500) {
    descriptionError = 'Описание не может превышать 500 символов';
  }
  if (descriptionError) {
    return res.render('createList', { error: descriptionError, formData: { name, description } });
  }

  const list = {
    name: name.trim(),
    description: description?.trim() || '',
    createdBy: new ObjectId(req.session.userId),
    createdAt: new Date(),
    items: []
  };

  await shoppingListsCollection.insertOne(list);
  res.redirect('/');
});

app.post('/list/:listId/delete', requireAuth, async (req, res) => {
  const { listId } = req.params;
  const userId = req.session.userId;

  if (!ObjectId.isValid(listId)) {
    return res.status(400).send('Неверный идентификатор списка');
  }

  const list = await shoppingListsCollection.findOne({ _id: new ObjectId(listId) });
  
  if (!list) {
    return res.status(404).send('Список не найден');
  }
  
  if (list.createdBy.toString() !== userId) {
    return res.status(403).send('Только владелец может удалить список');
  }

  await permissionsCollection.deleteMany({ listId: new ObjectId(listId) });
  await shoppingListsCollection.deleteOne({ _id: new ObjectId(listId) });

  res.redirect('/');
});

app.get('/list/:listId', requireAuth, async (req, res) => {
  const { listId } = req.params;
  const userId = req.session.userId;

  if (!ObjectId.isValid(listId)) {
    return res.status(400).send('Неверный идентификатор списка');
  }

  const hasAccess = await checkAccess(listId, userId);
  if (!hasAccess) {
    return res.status(403).send('Доступ запрещён');
  }

  const list = await shoppingListsCollection.findOne({ _id: new ObjectId(listId) });
  if (!list) return res.status(404).send('Список не найден');

  const userRole = await getUserRole(listId, userId);

  const itemsWithAuthors = await Promise.all(list.items.map(async (item) => {
    const addedByName = await getUserNameById(item.addedBy);
    const commentsWithAuthors = await Promise.all((item.comments || []).map(async (comment) => {
      const authorName = await getUserNameById(comment.authorId);
      return { ...comment, authorName };
    }));

    return {
      ...item,
      addedByName,
      comments: commentsWithAuthors
    };
  }));

  const permissionsList = await permissionsCollection.find({ listId: new ObjectId(listId) }).toArray();
  const membersWithNames = await Promise.all(permissionsList.map(async (perm) => {
    const user = await usersCollection.findOne({ _id: perm.userId });
    return {
      userId: perm.userId,
      userName: user ? user.name : 'Неизвестный',
      role: perm.role,
      invitedAt: perm.invitedAt
    };
  }));

  const owner = await usersCollection.findOne({ _id: list.createdBy });

  res.render('list', {
    list,
    items: itemsWithAuthors,
    userRole,
    userId: req.session.userId,
    members: membersWithNames,
    owner: owner ? owner.name : 'Неизвестный',
    listId,
    error: null,
    success: null
  });
});

app.post('/list/:listId/item/add', requireAuth, async (req, res) => {
  const { listId } = req.params;
  const { name, quantity, unit, category, comment } = req.body;
  const userId = req.session.userId;

  if (!ObjectId.isValid(listId)) {
    return res.status(400).send('Неверный идентификатор списка');
  }

  const canEdit = await checkAccess(listId, userId, 'editor');
  if (!canEdit) {
    return res.status(403).send('Доступ запрещён');
  }

  const nameError = validateString(name, 'Название товара', 1, 100);
  if (nameError) {
    const list = await shoppingListsCollection.findOne({ _id: new ObjectId(listId) });
    return res.render('list', { 
      list, items: [], userRole: 'editor', userId, members: [], owner: '', listId, 
      error: nameError, success: null 
    });
  }

  const quantityError = validateQuantity(quantity);
  if (quantityError) {
    const list = await shoppingListsCollection.findOne({ _id: new ObjectId(listId) });
    return res.render('list', { 
      list, items: [], userRole: 'editor', userId, members: [], owner: '', listId, 
      error: quantityError, success: null 
    });
  }

  const commentError = validateComment(comment);
  if (commentError) {
    const list = await shoppingListsCollection.findOne({ _id: new ObjectId(listId) });
    return res.render('list', { 
      list, items: [], userRole: 'editor', userId, members: [], owner: '', listId, 
      error: commentError, success: null 
    });
  }

  const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const quantityValue = quantity && quantity !== '' ? parseFloat(quantity) : 1;
  
  const newItem = {
    itemId,
    name: name.trim(),
    quantity: quantityValue,
    unit: unit || 'шт',
    category: category || 'Другое',
    status: 0,
    addedBy: new ObjectId(userId),
    addedAt: new Date(),
    lastUpdatedBy: new ObjectId(userId),
    lastUpdatedAt: new Date(),
    comments: []
  };

  if (comment && comment.trim()) {
    newItem.comments.push({
      commentId: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      text: comment.trim().substring(0, 500),
      authorId: new ObjectId(userId),
      createdAt: new Date()
    });
  }

  await shoppingListsCollection.updateOne(
    { _id: new ObjectId(listId) },
    { $push: { items: newItem } }
  );

  res.redirect(`/list/${listId}`);
});

app.post('/list/:listId/item/:itemId/edit', requireAuth, async (req, res) => {
  const { listId, itemId } = req.params;
  const { status, quantity } = req.body;
  const userId = req.session.userId;

  if (!ObjectId.isValid(listId)) {
    return res.status(400).send('Неверный идентификатор списка');
  }

  const canEdit = await checkAccess(listId, userId, 'editor');
  if (!canEdit) {
    const canView = await checkAccess(listId, userId, 'viewer');
    if (!canView || status === undefined) {
      return res.status(403).send('Доступ запрещён');
    }
  }

  const list = await shoppingListsCollection.findOne({ _id: new ObjectId(listId) });
  const itemIndex = list.items.findIndex(item => item.itemId === itemId);

  if (itemIndex === -1) return res.status(404).send('Товар не найден');

  const updateFields = {
    'items.$.lastUpdatedBy': new ObjectId(userId),
    'items.$.lastUpdatedAt': new Date()
  };

  if (status !== undefined) {
    const newStatus = parseInt(status);
    if (newStatus === 0 || newStatus === 1) {
      updateFields['items.$.status'] = newStatus;
    }
  }

  if (quantity !== undefined && (canEdit || await checkAccess(listId, userId, 'editor'))) {
    const quantityError = validateQuantity(quantity);
    if (!quantityError) {
      updateFields['items.$.quantity'] = parseFloat(quantity);
    }
  }

  await shoppingListsCollection.updateOne(
    { _id: new ObjectId(listId), 'items.itemId': itemId },
    { $set: updateFields }
  );

  res.redirect(`/list/${listId}`);
});

app.post('/list/:listId/item/:itemId/delete', requireAuth, async (req, res) => {
  const { listId, itemId } = req.params;
  const userId = req.session.userId;

  if (!ObjectId.isValid(listId)) {
    return res.status(400).send('Неверный идентификатор списка');
  }

  const canEdit = await checkAccess(listId, userId, 'editor');
  if (!canEdit) {
    return res.status(403).send('Доступ запрещён');
  }

  await shoppingListsCollection.updateOne(
    { _id: new ObjectId(listId) },
    { $pull: { items: { itemId: itemId } } }
  );

  res.redirect(`/list/${listId}`);
});

app.post('/list/:listId/item/:itemId/comment/add', requireAuth, async (req, res) => {
  const { listId, itemId } = req.params;
  const { commentText } = req.body;
  const userId = req.session.userId;

  if (!ObjectId.isValid(listId)) {
    return res.status(400).send('Неверный идентификатор списка');
  }

  const canComment = await checkAccess(listId, userId, 'commenter');
  if (!canComment) {
    return res.status(403).send('Доступ запрещён');
  }

  const commentError = validateComment(commentText);
  if (commentError) {
    const list = await shoppingListsCollection.findOne({ _id: new ObjectId(listId) });
    const userRole = await getUserRole(listId, userId);
    const itemsWithAuthors = await Promise.all((list.items || []).map(async (item) => ({
      ...item,
      addedByName: await getUserNameById(item.addedBy),
      comments: await Promise.all((item.comments || []).map(async (c) => ({
        ...c,
        authorName: await getUserNameById(c.authorId)
      })))
    })));
    const permissionsList = await permissionsCollection.find({ listId: new ObjectId(listId) }).toArray();
    const membersWithNames = await Promise.all(permissionsList.map(async (perm) => {
      const user = await usersCollection.findOne({ _id: perm.userId });
      return { userId: perm.userId, userName: user ? user.name : 'Неизвестный', role: perm.role };
    }));
    const owner = await usersCollection.findOne({ _id: list.createdBy });
    
    return res.render('list', {
      list, items: itemsWithAuthors, userRole, userId: req.session.userId,
      members: membersWithNames, owner: owner ? owner.name : 'Неизвестный', listId,
      error: commentError, success: null
    });
  }

  if (!commentText || commentText.trim() === '') {
    return res.redirect(`/list/${listId}`);
  }

  const newComment = {
    commentId: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    text: commentText.trim().substring(0, 500),
    authorId: new ObjectId(userId),
    createdAt: new Date()
  };

  await shoppingListsCollection.updateOne(
    { _id: new ObjectId(listId), 'items.itemId': itemId },
    { $push: { 'items.$.comments': newComment } }
  );

  await shoppingListsCollection.updateOne(
    { _id: new ObjectId(listId), 'items.itemId': itemId },
    {
      $set: {
        'items.$.lastUpdatedBy': new ObjectId(userId),
        'items.$.lastUpdatedAt': new Date()
      }
    }
  );

  res.redirect(`/list/${listId}`);
});

app.get('/list/:listId/invite', requireAuth, async (req, res) => {
  const { listId } = req.params;
  const userId = req.session.userId;

  if (!ObjectId.isValid(listId)) {
    return res.status(400).send('Неверный идентификатор списка');
  }

  const canEdit = await checkAccess(listId, userId, 'editor');
  if (!canEdit) {
    return res.status(403).send('Доступ запрещён');
  }

  res.render('invite', { listId, error: null });
});

app.post('/list/:listId/invite', requireAuth, async (req, res) => {
  const { listId } = req.params;
  const { email, role } = req.body;
  const userId = req.session.userId;

  if (!ObjectId.isValid(listId)) {
    return res.status(400).send('Неверный идентификатор списка');
  }

  const canEdit = await checkAccess(listId, userId, 'editor');
  if (!canEdit) {
    return res.status(403).send('Доступ запрещён');
  }

  const emailError = validateEmail(email);
  if (emailError) {
    return res.render('invite', { listId, error: emailError });
  }

  const userToInvite = await usersCollection.findOne({ email: email.trim() });
  if (!userToInvite) {
    return res.render('invite', { listId, error: 'Пользователь с таким email не найден' });
  }

  if (userToInvite._id.toString() === userId) {
    return res.render('invite', { listId, error: 'Вы не можете пригласить самого себя' });
  }

  const list = await shoppingListsCollection.findOne({ _id: new ObjectId(listId) });
  if (list.createdBy.toString() === userToInvite._id.toString()) {
    return res.render('invite', { listId, error: 'Пользователь уже является владельцем этого списка' });
  }

  const validRoles = ['viewer', 'commenter', 'editor'];
  const finalRole = validRoles.includes(role) ? role : 'viewer';

  const existingPermission = await permissionsCollection.findOne({
    listId: new ObjectId(listId),
    userId: userToInvite._id
  });

  if (existingPermission) {
    await permissionsCollection.updateOne(
      { _id: existingPermission._id },
      { $set: { role: finalRole, invitedAt: new Date() } }
    );
  } else {
    await permissionsCollection.insertOne({
      listId: new ObjectId(listId),
      userId: userToInvite._id,
      role: finalRole,
      invitedAt: new Date()
    });
  }

  res.redirect(`/list/${listId}`);
});

app.listen(PORT, async () => {
  await connectDB();
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
