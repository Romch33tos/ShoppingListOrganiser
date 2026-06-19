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

var list2 = {
    _id: ObjectId(),
    name: "Вечеринка",
    description: "На день рождения",
    createdBy: user2._id,
    createdAt: new Date("2025-02-20"),
    items: [
        {
            itemId: "item_004",
            name: "Пицца",
            quantity: 3,
            unit: "шт",
            category: "Готовая еда",
            status: 0,
            addedBy: user2._id,
            addedAt: new Date("2025-02-20"),
            lastUpdatedBy: user2._id,
            lastUpdatedAt: new Date("2025-02-20"),
            comments: []
        },
        {
            itemId: "item_005",
            name: "Кока-кола",
            quantity: 2,
            unit: "л",
            category: "Напитки",
            status: 0,
            addedBy: user3._id,
            addedAt: new Date("2025-02-21"),
            lastUpdatedBy: user3._id,
            lastUpdatedAt: new Date("2025-02-21"),
            comments: [
                {
                    commentId: "comm_002",
                    text: "Лучше взять Zero",
                    authorId: user2._id,
                    createdAt: new Date("2025-02-21")
                }
            ]
        },
        {
            itemId: "item_006",
            name: "Чипсы",
            quantity: 2,
            unit: "пачки",
            category: "Снеки",
            status: 1,
            addedBy: user2._id,
            addedAt: new Date("2025-02-20"),
            lastUpdatedBy: user4._id,
            lastUpdatedAt: new Date("2025-02-22"),
            comments: []
        },
        {
            itemId: "item_007",
            name: "Торт",
            quantity: 1,
            unit: "шт",
            category: "Десерты",
            status: 0,
            addedBy: user2._id,
            addedAt: new Date("2025-02-20"),
            lastUpdatedBy: user2._id,
            lastUpdatedAt: new Date("2025-02-20"),
            comments: [
                {
                    commentId: "comm_003",
                    text: "С шоколадом, пожалуйста",
                    authorId: user3._id,
                    createdAt: new Date("2025-02-21")
                }
            ]
        },
        {
            itemId: "item_008",
            name: "Сок апельсиновый",
            quantity: 1.5,
            unit: "л",
            category: "Напитки",
            status: 0,
            addedBy: user4._id,
            addedAt: new Date("2025-02-22"),
            lastUpdatedBy: user4._id,
            lastUpdatedAt: new Date("2025-02-22"),
            comments: []
        }
    ]
};

var list3 = {
    _id: ObjectId(),
    name: "Хозяйственные товары",
    description: "Для дома",
    createdBy: user3._id,
    createdAt: new Date("2025-02-25"),
    items: [
        {
            itemId: "item_009",
            name: "Стиральный порошок",
            quantity: 1,
            unit: "уп",
            category: "Бытовая химия",
            status: 0,
            addedBy: user3._id,
            addedAt: new Date("2025-02-25"),
            lastUpdatedBy: user3._id,
            lastUpdatedAt: new Date("2025-02-25"),
            comments: []
        },
        {
            itemId: "item_010",
            name: "Губки для посуды",
            quantity: 5,
            unit: "шт",
            category: "Бытовая химия",
            status: 0,
            addedBy: user5._id,
            addedAt: new Date("2025-02-26"),
            lastUpdatedBy: user5._id,
            lastUpdatedAt: new Date("2025-02-26"),
            comments: [
                {
                    commentId: "comm_005",
                    text: "С абразивным слоем",
                    authorId: user3._id,
                    createdAt: new Date("2025-02-26")
                }
            ]
        }
    ]
};

var list4 = {
    _id: ObjectId(),
    name: "Дача",
    description: "Для сада и огорода",
    createdBy: user4._id,
    createdAt: new Date("2025-03-01"),
    items: [
        {
            itemId: "item_011",
            name: "Семена помидоров",
            quantity: 3,
            unit: "пачки",
            category: "Сад",
            status: 0,
            addedBy: user4._id,
            addedAt: new Date("2025-03-01"),
            lastUpdatedBy: user4._id,
            lastUpdatedAt: new Date("2025-03-01"),
            comments: []
        },
        {
            itemId: "item_012",
            name: "Лопата",
            quantity: 1,
            unit: "шт",
            category: "Инструменты",
            status: 0,
            addedBy: user1._id,
            addedAt: new Date("2025-03-02"),
            lastUpdatedBy: user1._id,
            lastUpdatedAt: new Date("2025-03-02"),
            comments: [
                {
                    commentId: "comm_006",
                    text: "Штыковая, не совковая",
                    authorId: user4._id,
                    createdAt: new Date("2025-03-02")
                }
            ]
        }
    ]
};

var list5 = {
    _id: ObjectId(),
    name: "Офис",
    description: "Канцелярия",
    createdBy: user5._id,
    createdAt: new Date("2025-03-05"),
    items: [
        {
            itemId: "item_013",
            name: "Бумага А4",
            quantity: 2,
            unit: "пачки",
            category: "Канцелярия",
            status: 0,
            addedBy: user5._id,
            addedAt: new Date("2025-03-05"),
            lastUpdatedBy: user5._id,
            lastUpdatedAt: new Date("2025-03-05"),
            comments: []
        },
        {
            itemId: "item_014",
            name: "Ручки синие",
            quantity: 10,
            unit: "шт",
            category: "Канцелярия",
            status: 1,
            addedBy: user2._id,
            addedAt: new Date("2025-03-06"),
            lastUpdatedBy: user2._id,
            lastUpdatedAt: new Date("2025-03-07"),
            comments: [
                {
                    commentId: "comm_007",
                    text: "Гелевые",
                    authorId: user5._id,
                    createdAt: new Date("2025-03-06")
                }
            ]
        },
        {
            itemId: "item_015",
            name: "Степлер",
            quantity: 1,
            unit: "шт",
            category: "Канцелярия",
            status: 0,
            addedBy: user5._id,
            addedAt: new Date("2025-03-05"),
            lastUpdatedBy: user5._id,
            lastUpdatedAt: new Date("2025-03-05"),
            comments: []
        }
    ]
};

db.shoppingLists.insertMany([list1, list2, list3, list4, list5]);
print("Списки добавлены: " + db.shoppingLists.count());

db.permissions.insertMany([
    { _id: ObjectId(), listId: list1._id, userId: user2._id, role: "commenter", invitedAt: new Date("2025-02-16") },
    { _id: ObjectId(), listId: list1._id, userId: user3._id, role: "viewer", invitedAt: new Date("2025-02-17") },
    { _id: ObjectId(), listId: list2._id, userId: user1._id, role: "editor", invitedAt: new Date("2025-02-21") },
    { _id: ObjectId(), listId: list2._id, userId: user3._id, role: "commenter", invitedAt: new Date("2025-02-21") },
    { _id: ObjectId(), listId: list2._id, userId: user4._id, role: "viewer", invitedAt: new Date("2025-02-22") },
    { _id: ObjectId(), listId: list3._id, userId: user5._id, role: "editor", invitedAt: new Date("2025-02-26") },
    { _id: ObjectId(), listId: list3._id, userId: user4._id, role: "viewer", invitedAt: new Date("2025-02-27") },
    { _id: ObjectId(), listId: list4._id, userId: user1._id, role: "editor", invitedAt: new Date("2025-03-02") },
    { _id: ObjectId(), listId: list4._id, userId: user2._id, role: "commenter", invitedAt: new Date("2025-03-02") },
    { _id: ObjectId(), listId: list5._id, userId: user2._id, role: "editor", invitedAt: new Date("2025-03-06") },
    { _id: ObjectId(), listId: list5._id, userId: user3._id, role: "viewer", invitedAt: new Date("2025-03-06") }
]);

print("Права доступа добавлены: " + db.permissions.count());

db.users.createIndex({ email: 1 }, { unique: true });
db.shoppingLists.createIndex({ "items.status": 1 });
db.permissions.createIndex({ userId: 1, listId: 1 }, { unique: true });
db.permissions.createIndex({ listId: 1 });
db.permissions.createIndex({ userId: 1 });

print("Индексы созданы");
