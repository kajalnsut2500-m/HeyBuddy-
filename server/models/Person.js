const {STRING, BOOLEAN, DATE} = require('sequelize');
const db = require('../config/database');

const Person = db.define('person', {
    nickname: {type: STRING},
    email: {type: STRING},
    password: {type: STRING},
    image: {
        type: STRING,
        defaultValue: "https://res.cloudinary.com/dluwizg51/image/upload/v1650639365/no-pic-ava_ac9buw.jpg"
    },
    isOnline: {
        type: BOOLEAN,
        defaultValue: false
    },
    lastSeen: {
        type: DATE,
        allowNull: true
    }
});

module.exports = Person;