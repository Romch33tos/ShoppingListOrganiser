db = db.getSiblingDB("ShoppingListOrganizer");

if (db.users) db.users.drop();
if (db.shoppingLists) db.shoppingLists.drop();
if (db.permissions) db.permissions.drop();

print("Начинаем создание базы данных...");
