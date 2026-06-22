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
