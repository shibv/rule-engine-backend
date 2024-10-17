import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv'
import cors from 'cors';
import morgan from 'morgan';
import ruleRoutes from './routes/ruleRoutes.js';
import { connectDB } from './config/db.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors());

// Connect to the database
connectDB();

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});


// Routes
app.use('/api/rules', ruleRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
