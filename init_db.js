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

var list1 = {
    _id: ObjectId(),
    name: "Продукты на неделю",
    description: "Основные продукты на 7 дней",
    createdBy: user1._id,
    createdAt: new Date("2025-02-15"),
    items: [
        {
            itemId: "item_001",
            name: "Молоко",
            quantity: 2.5,
            unit: "л",
            category: "Молочные продукты",
            status: 0,
            addedBy: user1._id,
            addedAt: new Date("2025-02-15"),
            lastUpdatedBy: user1._id,
            lastUpdatedAt: new Date("2025-02-15"),
            comments: [
                {
                    commentId: "comm_001",
                    text: "Без лактозы, пожалуйста",
                    authorId: user2._id,
                    createdAt: new Date("2025-02-16")
                }
            ]
        },
        {
            itemId: "item_002",
            name: "Яблоки",
            quantity: 1.5,
            unit: "кг",
            category: "Овощи и фрукты",
            status: 0,
            addedBy: user1._id,
            addedAt: new Date("2025-02-15"),
            lastUpdatedBy: user1._id,
            lastUpdatedAt: new Date("2025-02-15"),
            comments: []
        },
        {
            itemId: "item_003",
            name: "Хлеб",
            quantity: 1,
            unit: "шт",
            category: "Хлебобулочные",
            status: 1,
            addedBy: user2._id,
            addedAt: new Date("2025-02-16"),
            lastUpdatedBy: user2._id,
            lastUpdatedAt: new Date("2025-02-17"),
            comments: []
        }
    ]
};
