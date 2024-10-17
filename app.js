import express from 'express';
import dotenv from 'dotenv'
import cors from 'cors';
import { connectDB } from './config/db.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to the database
connectDB();

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});


// Routes


// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
