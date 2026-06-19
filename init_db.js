db = db.getSiblingDB("ShoppingListOrganizer");

if (db.users) db.users.drop();
if (db.shoppingLists) db.shoppingLists.drop();
if (db.permissions) db.permissions.drop();

print("Начинаем создание базы данных...");

var user1 = { _id: ObjectId(), name: "Роман Хадралиев", email: "roman@example.com", passwordHash: "hash_roman123", registeredAt: new Date("2025-01-10") };
var user2 = { _id: ObjectId(), name: "Анна Смирнова", email: "anna@example.com", passwordHash: "hash_anna456", registeredAt: new Date("2025-01-15") };
var user3 = { _id: ObjectId(), name: "Иван Петров", email: "ivan@example.com", passwordHash: "hash_ivan789", registeredAt: new Date("2025-01-20") };
var user4 = { _id: ObjectId(), name: "Елена Козлова", email: "elena@example.com", passwordHash: "hash_lena321", registeredAt: new Date("2025-02-01") };
var user5 = { _id: ObjectId(), name: "Дмитрий Соколов", email: "dmitry@example.com", passwordHash: "hash_dima654", registeredAt: new Date("2025-02-10") };

db.users.insertMany([user1, user2, user3, user4, user5]);
print("Пользователи добавлены: " + db.users.count());
