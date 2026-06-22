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
