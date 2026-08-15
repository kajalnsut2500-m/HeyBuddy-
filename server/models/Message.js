const {STRING, INTEGER, DATE} = require('sequelize');
const db = require('../config/database');

const Message = db.define('message', {
    id: {type: INTEGER, autoIncrement: true, primaryKey: true},
    createdAt: {
        type: DATE,
        get() {
            const val = this.getDataValue('createdAt');
            if (!val) return null;
            // Return proper ISO 8601 with Z so the client can parse it unambiguously
            return (val instanceof Date ? val : new Date(val)).toISOString();
        }
    },
    chatId: {type: STRING},
    senderId: {type: STRING},
    text: {type: STRING}
})

module.exports = Message;
