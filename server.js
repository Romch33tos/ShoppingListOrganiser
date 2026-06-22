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
