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
