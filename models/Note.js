const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NoteSchema = new Schema({
    title: {
      type: String,
      required: true,
      index:'text'
    },
    content: {
      type: String,
      required: true,
      index:'text'
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
   });
   
   module.exports = mongoose.model('Note', NoteSchema);
   