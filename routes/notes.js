/**
 * @swagger
 * tags:
 *   name: Notes
 *   description: Operations related to user notes
 */

const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/auth'); // You need to implement authentication middleware
const Note = require('../models/Note');
const UserNoteMapping = require('../models/UserNoteMapping');
const authenticateUser = passport.authenticate('local', { session: false });


router.get('/notes', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id; // Extract user ID from authentication middleware

   // Find all user mappings for the given user and populate the 'noteId' field with the actual note document
   const userMappings = await UserNoteMapping.find({ userId }).populate('noteId');

   // Extract notes from the populated 'noteId' field
   const userNotes = userMappings.map(mapping => mapping.noteId);
    res.json(userNotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notes/:id: Get a note by ID for the authenticated user
router.get('/notes/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;
    const note = await Note.findOne({ _id: noteId, ownerId: userId });

    if (!note) {
      return res.status(404).json({ message: 'Note not found for the authenticated user.' });
    }

    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notes: Create a new note for the authenticated user
router.post('/notes', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content } = req.body;

    const newNote = new Note({
        title,
        content,
        ownerId: userId,
      });
  
    const savedNote = await newNote.save();
    //create note mapping as well 
    const userNoteMapping = new UserNoteMapping({
      userId,
      noteId: savedNote._id, // Use savedNote._id instead of newNote.id
    });
  
    await userNoteMapping.save();
    res.status(201).json(savedNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notes/:id: Update an existing note by ID for the authenticated user
router.put('/notes/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;
    const { title, content } = req.body;

    const updatedNote = await Note.findOneAndUpdate(
      { _id: noteId, ownerId: userId },
      { title, content },
      { new: true }
    );

    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found for the authenticated user.' });
    }

    res.json(updatedNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notes/:id: Delete a note by ID for the authenticated user
router.delete('/notes/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    const deletedNote = await Note.findOneAndDelete({ _id: noteId, ownerId: userId });

    if (!deletedNote) {
      return res.status(404).json({ message: 'Note not found for the authenticated user.' });
    }

    res.json({ message: 'Note deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notes/:id/share: Share a note with another user for the authenticated user
router.post('/notes/:id/share', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;
    const { receiverId } = req.body;

    // Check if the specified email exists and retrieve its user ID
    const userToShareWith = await User.findOne({
        'id':receiverId
    })

    if (!userToShareWith) {
      return res.status(404).json({ message: 'User with specified email not found.' });
    }

    // Check if the authenticated user owns the note
    const noteToShare = await Note.findOne({ _id: noteId, ownerId: userId });

    if (!noteToShare) {
      return res.status(404).json({ message: 'Note not found for the authenticated user.' });
    }

    // Check if the note is already shared with the user
    const existingMapping = await UserNoteMapping.findOne({ userId: userToShareWith.userId, noteId });

    if (existingMapping) {
      return res.status(400).json({ message: 'Note is already shared with the specified user.' });
    }

    // Create a new UserNoteMapping record to represent the sharing relationship
    const newMapping = new UserNoteMapping({
      userId: userToShareWith.userId,
      noteId,
      isActive: true, // You may set this based on your logic
    });

    await newMapping.save();

    res.status(200).json({ message: 'Note shared successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/search?q=:query: Search for notes based on keywords for the authenticated user
router.get('/search', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const query = req.query.q;
    // Ensure that you have a text index on 'title' and 'content' fields in your Note model
    // Search only in notes shared with the user
    const searchResults = await Note.find({
      _id: { $in: await getSharedNoteIds(userId) }, // Search in shared notes
      $text: { $search: query }, // Include text search if needed
    });

    res.json(searchResults);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


