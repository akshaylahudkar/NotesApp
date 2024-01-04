/**
 * @swagger
 * tags:
 *   name: Notes
 *   description: Operations related to user notes
 */

const express = require("express");
const passport = require("passport");
const router = express.Router();
const Note = require("../models/Note");
const UserNoteMapping = require("../models/UserNoteMapping");
const User = require("../models/User");
const authenticateUser = passport.authenticate("jwt", { session: false });
/**
 * @swagger
 * components:
 *   schemas:
 *     Note:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The note ID
 *         title:
 *           type: string
 *           description: The title of the note
 *         content:
 *           type: string
 *           description: The content of the note
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the note was created
 *         ownerId:
 *           type: string
 *           description: The ID of the note owner
 *       required:
 *         - title
 *         - content
 *         - ownerId
 */
/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: Get paginated notes for the authenticated user
 *     tags: 
 *       - Notes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number (default- 1)
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         required: false
 *         description: Number of items per page (default- 10)
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully retrieved paginated notes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Note'
 *       401:
 *         description: Unauthorized - Invalid token
 *       500:
 *         description: Internal Server Error
 */
router.get("/notes", authenticateUser, async (req, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
  
      const skip = (page - 1) * pageSize;
  
      const userMappings = await UserNoteMapping.find({ userId })
        .populate("noteId")
        .skip(skip)
        .limit(pageSize);
  
      const userNotes = userMappings.map((mapping) => mapping.noteId);
  
      res.json(userNotes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

/**
 * @swagger
 * /api/notes/{id}:
 *   get:
 *     summary: Get a note by ID for the authenticated user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the note
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved the note
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Note not found for the authenticated user
 *       500:
 *         description: Internal Server Error
 */
router.get("/notes/:id", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;
    const note = await Note.findOne({ _id: noteId, ownerId: userId });

    if (!note) {
      return res
        .status(404)
        .json({ message: "Note not found for the authenticated user." });
    }

    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Create a new note for the authenticated user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Note created successfully
 *       401:
 *         description: Unauthorized - Invalid token
 *       500:
 *         description: Internal Server Error
 */
router.post("/notes", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content } = req.body;
    const newNote = new Note({
      title,
      content,
      ownerId: userId,
    });

    const savedNote = await newNote.save();

    const userNoteMapping = new UserNoteMapping({
      userId,
      noteId: savedNote._id,
    });

    await userNoteMapping.save();
    res.status(201).json(savedNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/notes/{id}:
 *   put:
 *     summary: Update an existing note by ID for the authenticated user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the note
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully updated the note
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Note not found for the authenticated user
 *       500:
 *         description: Internal Server Error
 */
router.put("/notes/:id", authenticateUser, async (req, res) => {
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
      return res
        .status(404)
        .json({ message: "Note not found for the authenticated user." });
    }

    res.json(updatedNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/notes/{id}:
 *   delete:
 *     summary: Delete a note by ID for the authenticated user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the note
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note deleted successfully
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Note not found for the authenticated user
 *       500:
 *         description: Internal Server Error
 */
router.delete("/notes/:id", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    const deletedNote = await Note.findOneAndDelete({
      _id: noteId,
      ownerId: userId,
    });

    if (!deletedNote) {
      return res
        .status(404)
        .json({ message: "Note not found for the authenticated user." });
    }

    res.json({ message: "Note deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/notes/{id}/share:
 *   post:
 *     summary: Share a note with another user for the authenticated user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the note
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiverId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note shared successfully
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: User with specified ID not found
 *       400:
 *         description: Note is already shared with the specified user
 *       500:
 *         description: Internal Server Error
 */
router.post("/notes/:id/share", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;
    const { receiverId } = req.body;

    const userToShareWith = await User.findById(receiverId);

    if (!userToShareWith) {
      return res
        .status(404)
        .json({ message: "User with specified ID not found." });
    }

    const noteToShare = await Note.findOne({ _id: noteId, ownerId: userId });

    if (!noteToShare) {
      return res
        .status(404)
        .json({ message: "Note not found for the authenticated user." });
    }

    const existingMapping = await UserNoteMapping.findOne({
      userId: userToShareWith.id,
      noteId,
    });

    if (existingMapping) {
      return res
        .status(400)
        .json({ message: "Note is already shared with the specified user." });
    }

    const newMapping = new UserNoteMapping({
      userId: userToShareWith.id,
      noteId,
      isActive: true,
    });

    await newMapping.save();

    res.status(200).json({ message: "Note shared successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search for notes based on keywords for the authenticated user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         description: Search query
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number (default- 1)
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         required: false
 *         description: Number of items per page (default- 10)
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully retrieved paginated search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Note'
 *       401:
 *         description: Unauthorized - Invalid token
 *       500:
 *         description: Internal Server Error
 */
router.get("/search", authenticateUser, async (req, res) => {
    try {
      const userId = req.user.id;
      const query = req.query.q;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
  
      const skip = (page - 1) * pageSize;
  
      const searchResults = await Note.find({
        _id: { $in: await getSharedNoteIds(userId) },
        $text: { $search: query },
      })
        .skip(skip)
        .limit(pageSize);
  
      res.json(searchResults);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  async function getSharedNoteIds(userId) {
    const sharedMappings = await UserNoteMapping.find({ userId });
    return sharedMappings.map((mapping) => mapping.noteId);
  }
  


module.exports = router;
