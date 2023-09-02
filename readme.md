# Tables
 - pets

| Column Name | Data Type | Description                               |
|-------------|-----------|-------------------------------------------|
| id          | INTEGER   | Primary Key, Auto-increment               |
| category_id | INTEGER   | Foreign Key (References categories.id)    |
| name        | TEXT      | Not Null                                  |
| status      | TEXT      |                                           |

- categories

| Column Name | Data Type | Description                               |
|-------------|-----------|-------------------------------------------|
| id          | INTEGER   | Primary Key, Auto-increment               |
| name        | TEXT      | Not Null                                  |

 - tags

| Column Name | Data Type | Description                               |
|-------------|-----------|-------------------------------------------|
| id          | INTEGER   | Primary Key, Auto-increment               |
| name        | TEXT      | Not Null                                  |

 - pet_tags

| Column Name | Data Type | Description                                        |
|-------------|-----------|----------------------------------------------------|
| pet_id      | INTEGER   | Foreign Key (References pets.id) ON DELETE CASCADE |
| tag_id      | INTEGER   | Foreign Key (References tags.id) ON DELETE CASCADE |

 - pet_photos

| Column Name | Data Type | Description                                         |
|-------------|-----------|-----------------------------------------------------|
| pet_id      | INTEGER   | Foreign Key (References pets.id)  ON DELETE CASCADE |
| photo_url   | TEXT      |                                                     |


# Create sample tables
```

CREATE TABLE pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    name TEXT NOT NULL,
    status TEXT,
    FOREIGN KEY(category_id) REFERENCES Categories(id)
);
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);
CREATE TABLE pet_tags (
    pet_id INTEGER,
    tag_id INTEGER,
    FOREIGN KEY(pet_id) REFERENCES pets(id) ON DELETE CASCADE,
    FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
CREATE TABLE pet_photos (
    pet_id INTEGER,
    photo_url TEXT,
    FOREIGN KEY(pet_id) REFERENCES Pets(id) ON DELETE CASCADE
);
```

# Create sample data
```
INSERT INTO pets (id, category_id, name, status) VALUES (1, 1, 'Buddy', 'available');
INSERT INTO pets (id, category_id, name, status) VALUES (2, 2, 'Whiskers', 'pending');
INSERT INTO pets (id, category_id, name, status) VALUES (3, 3, 'Taro', 'available');
INSERT INTO pets (id, category_id, name, status) VALUES (4, 4, 'Pome', 'sold');

INSERT INTO categories (name) VALUES ('Toy Breeds');
INSERT INTO categories (name) VALUES ('Working Dogs');
INSERT INTO categories (name) VALUES ('Sporting Dogs');
INSERT INTO categories (name) VALUES ('Hound Dogs');

INSERT INTO tags (name) VALUES ('Small');
INSERT INTO tags (name) VALUES ('Cute');
INSERT INTO tags (name) VALUES ('Wild');

INSERT INTO pet_tags (pet_id, tag_id) VALUES (1, 1);
INSERT INTO pet_tags (pet_id, tag_id) VALUES (1, 2);
INSERT INTO pet_tags (pet_id, tag_id) VALUES (2, 3);
INSERT INTO pet_tags (pet_id, tag_id) VALUES (2, 1);
INSERT INTO pet_tags (pet_id, tag_id) VALUES (3, 2);
INSERT INTO pet_tags (pet_id, tag_id) VALUES (3, 3);
INSERT INTO pet_tags (pet_id, tag_id) VALUES (4, 1);
INSERT INTO pet_tags (pet_id, tag_id) VALUES (4, 2);

INSERT INTO pet_photos (pet_id, photo_url) VALUES (1, 'http://example.com/buddy001.jpg');
INSERT INTO pet_photos (pet_id, photo_url) VALUES (1, 'http://example.com/buddy002.jpg');
INSERT INTO pet_photos (pet_id, photo_url) VALUES (2, 'http://example.com/whiskers001.jpg');
INSERT INTO pet_photos (pet_id, photo_url) VALUES (2, 'http://example.com/whiskers002.jpg');
INSERT INTO pet_photos (pet_id, photo_url) VALUES (3, 'http://example.com/taro001.jpg');
INSERT INTO pet_photos (pet_id, photo_url) VALUES (3, 'http://example.com/taro002.jpg');
INSERT INTO pet_photos (pet_id, photo_url) VALUES (4, 'http://example.com/pome001.jpg');
INSERT INTO pet_photos (pet_id, photo_url) VALUES (4, 'http://example.com/pome002.jpg');
```
