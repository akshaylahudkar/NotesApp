const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserNoteMappingSchema = new Schema({
 userId: {
   type: Schema.Types.ObjectId,
   required: true,
   ref: 'User'
 },
 noteId: {
   type: Schema.Types.ObjectId,
   required: true,
   ref: 'Note'
 },
 isDeleted: {
    type: Boolean
 }
});

module.exports = mongoose.model('UserNoteMapping', UserNoteMappingSchema);
