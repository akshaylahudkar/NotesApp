const express = require("express");
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors");


// Load environment variables from .env file
require("dotenv").config();
// Passport configuration for authentication
const passport = require('./config/passport');
// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log(err));

const app = express();
const port = process.env.PORT || 3000;

// Rate limitor config; when there are multiple instances of the service running
// we can configure Redis to store the counters 
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 50, // limit each IP to 100 requests per minute
    message: "Too many requests from this IP, please try again later.",
  });

// Setting up CORS to allow localhost to enable access from Docker 
const allowedOrigins = ['http://localhost:'+port];
app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  }));
app.use(limiter);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({ secret: process.env.JWT_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/notes"));
// Swagger documentation setup
const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Express API with Swagger",
        version: "0.1.0",
        description: "This is a Notes CRUD API application made with Express and documented with Swagger",
        contact: {
          name: "Akshay Lahudkar",
          url: "",
          email: "akshaylahudkar@icloud.com",
        },
      },
      servers: [
        {
          url: "http://localhost:"+port,
        },
      ],
      security: [
        {
          bearerAuth: [],
        },
      ],
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
        },
      },      
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
    apis: ["./routes/*.js"],
  };

const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Start the server
server = app.listen(port, () => console.log(`Server is running on port ${port}`));

app.closeServer =async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  };

process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT. Closing server and disconnecting from MongoDB...');
    await app.closeServer();
    await mongoose.disconnect();
    process.exit();
  });

module.exports = app;