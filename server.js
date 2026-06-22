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
