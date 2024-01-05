const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");

let authToken = "";
let createdNoteId = "";
let createdNote2 = "";
let testUser2 = "";
let username = faker.internet.userName();
let password = faker.internet.password();
let email = faker.internet.email();

describe("Authentication Routes", () => {
  describe("POST /api/auth/signup", () => {
    it("should create a new user account", async () => {
      const response = await request(app).post("/api/auth/signup").send({
        username: username,
        password: password,
        email: email,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "User created successfully!"
      );
    });

    it("should return validation error if required fields are missing", async () => {
      const response = await request(app).post("/api/auth/signup").send({});

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should log in and return an access token", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: username,
        password: password,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("accessToken");
    });

    it("should return validation error if required fields are missing", async () => {
      const response = await request(app).post("/api/auth/login").send({});
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });

    it("should return unauthorized if wrong username or password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: "nonexistentuser",
        password: "wrongpassword",
      });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty(
        "message",
        "Unauthorized - Wrong username or password"
      );
    });
  });
});

describe("Notes Routes", () => {
  beforeAll(async () => {
    // Sign up a new user
    const signupResponse = await request(app).post("/api/auth/signup").send({
      username: "testuser",
      password: "testpassword",
      email: "testuser@example.com",
    });

    // expect(signupResponse.statusCode).toBe(200);

    // Login to get the JWT token
    const loginResponse = await request(app).post("/api/auth/login").send({
      username: "testuser",
      password: "testpassword",
    });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body).toHaveProperty("accessToken");

    authToken = `Bearer ${loginResponse.body.accessToken}`;
    testUser = signupResponse.body.userId;

    const newNote = {
      title: "Test Note",
      content: "Test Content",
    };

    const response = await request(app)
      .post("/api/notes")
      .set("Authorization", authToken)
      .send(newNote);
    createdNoteId = response.body._id;
  });

  describe("GET /api/notes", () => {
    it("should get paginated notes for the authenticated user", async () => {
      const response = await request(app)
        .get("/api/notes")
        .set("Authorization", authToken);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
    });

    it("should return 401 for unauthorized access", async () => {
      const response = await request(app).get("/api/notes");

      expect(response.statusCode).toBe(401);
    });
  });

  describe("GET /api/notes/:id", () => {
    it("should get a note by ID for the authenticated user", async () => {
      // Assuming you have a note ID
      const response = await request(app)
        .get(`/api/notes/${createdNoteId}`)
        .set("Authorization", authToken);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("title");
      expect(response.body).toHaveProperty("content");
    });

    it("should return 401 for unauthorized access", async () => {
      // Assuming you have a note ID
      const noteId = "your-note-id";
      const response = await request(app).get(`/api/notes/${noteId}`);

      expect(response.statusCode).toBe(401);
    });

    it("should return 404 for a note not found for the authenticated user", async () => {
      // Assuming you have a non-existing note ID
      const nonExistingNoteId = "6597949477fe9684c2cf805c";
      const response = await request(app)
        .get(`/api/notes/${nonExistingNoteId}`)
        .set("Authorization", authToken);

      expect(response.statusCode).toBe(404);
    });
  });

  describe("POST /api/notes", () => {
    it("should create a new note for the authenticated user", async () => {
      const newNote = {
        title: "Test Note 2",
        content: "Test Content 2",
      };

      const response = await request(app)
        .post("/api/notes")
        .set("Authorization", authToken)
        .send(newNote);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty("title", newNote.title);
      expect(response.body).toHaveProperty("content", newNote.content);
      createdNote2 = response.body._id;
    });

    it("should return 401 for unauthorized access", async () => {
      const response = await request(app).post("/api/notes");

      expect(response.statusCode).toBe(401);
    });
  });

  describe("PUT /api/notes/:id", () => {
    it("should update an existing note by ID for the authenticated user", async () => {
      // Assuming you have a note ID and updated data
      const updatedNote = {
        title: "Updated Test Note",
        content: "Updated Test Content",
      };

      const response = await request(app)
        .put(`/api/notes/${createdNoteId}`)
        .set("Authorization", authToken)
        .send(updatedNote);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("title", updatedNote.title);
      expect(response.body).toHaveProperty("content", updatedNote.content);
    });

    it("should return 401 for unauthorized access", async () => {
      // Assuming you have a note ID and updated data

      const updatedNote = {
        title: "Updated Test Note",
        content: "Updated Test Content",
      };

      const response = await request(app)
        .put(`/api/notes/${createdNoteId}`)
        .send(updatedNote);

      expect(response.statusCode).toBe(401);
    });

    it("should return 404 for a note not found for the authenticated user", async () => {
      // Assuming you have a non-existing note ID and updated data
      const nonExistingNoteId = "6597949477fe9684c2cf805c";
      const updatedNote = {
        title: "Updated Test Note",
        content: "Updated Test Content",
      };

      const response = await request(app)
        .put(`/api/notes/${nonExistingNoteId}`)
        .set("Authorization", authToken)
        .send(updatedNote);

      expect(response.statusCode).toBe(404);
    });
  });

  describe("DELETE /api/notes/:id", () => {
    it("should delete a note by ID for the authenticated user", async () => {
      // Assuming you have a note ID

      const response = await request(app)
        .delete(`/api/notes/${createdNoteId}`)
        .set("Authorization", authToken);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Note deleted successfully."
      );
    });

    it("should return 401 for unauthorized access", async () => {
      // Assuming you have a note ID

      const response = await request(app).delete(`/api/notes/${createdNote2}`);

      expect(response.statusCode).toBe(401);
    });

    it("should return 404 for a note not found for the authenticated user", async () => {
      // Assuming you have a non-existing note ID
      const nonExistingNoteId = "6597949477fe9684c2cf805c";

      const response = await request(app)
        .delete(`/api/notes/${nonExistingNoteId}`)
        .set("Authorization", authToken);

      expect(response.statusCode).toBe(404);
    });
  });

  describe("POST /api/notes/:id/share", () => {
    it("should share a note with another user for the authenticated user", async () => {
      // Assuming you have a note ID and a user ID to share with
      username = faker.internet.userName();
      password = faker.internet.password();
      email = faker.internet.email();
      const signupResponse = await request(app).post("/api/auth/signup").send({
        username: username,
        password: password,
        email: email,
      });

      testUser2 = signupResponse.body.user.id;
      const response = await request(app)
        .post(`/api/notes/${createdNote2}/share`)
        .set("Authorization", authToken)
        .send({ receiverId: testUser2 });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Note shared successfully."
      );
    });

    it("should return 401 for unauthorized access", async () => {
      // Assuming you have a note ID and a user ID to share with
      const noteId = createdNote2;
      const receiverId = testUser2;

      const response = await request(app)
        .post(`/api/notes/${noteId}/share`)
        .send({ receiverId });

      expect(response.statusCode).toBe(401);
    });

    it("should return 404 for a user not found", async () => {
      // Assuming you have a note ID and a non-existing user ID

      const nonExistingReceiverId = "65979cff00f5d1455732ff99";

      const response = await request(app)
        .post(`/api/notes/${createdNote2}/share`)
        .set("Authorization", authToken)
        .send({ receiverId: nonExistingReceiverId });

      expect(response.statusCode).toBe(404);
    });

    it("should return 400 if the note is already shared with the specified user", async () => {
      // Assuming you have a note ID and a user ID to share with
      const noteId = createdNote2;
      const receiverId = testUser2;

      // Share the note once
      await request(app)
        .post(`/api/notes/${noteId}/share`)
        .set("Authorization", authToken)
        .send({ receiverId });

      // Try sharing the same note again
      const response = await request(app)
        .post(`/api/notes/${noteId}/share`)
        .set("Authorization", authToken)
        .send({ receiverId });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /api/search", () => {
    it("should search for notes based on keywords for the authenticated user", async () => {
      // Assuming you have a search query
      const query = "test";

      const response = await request(app)
        .get(`/api/search?q=${query}`)
        .set("Authorization", authToken);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
    });

    it("should return 401 for unauthorized access", async () => {
      // Assuming you have a search query
      const query = "your-search-query";

      const response = await request(app).get(`/api/search?q=${query}`);

      expect(response.statusCode).toBe(401);
    });
  });
});

afterAll(async () => {
  await new Promise((resolve) => setTimeout(() => resolve(), 500)); // avoid jest open handle error
  await app.closeServer();
  await mongoose.disconnect();
});
