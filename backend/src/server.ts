// src/server.ts
import 'dotenv/config';
import express,{ Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import routes from './routes/index';        
import multer from 'multer';
import cors from 'cors';
const app = express();

// Middlewares
app.use(cors({ origin:'http://localhost:5173',credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // simple logging
app.use(cookieParser());

// Routes
app.use('/api', routes);


app.get('/',(req,res)=>{
res.send({message:"hello"})
});

// Route not found
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});


app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'You can upload a maximum of 5 images.',
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error',
    });
  }

  // Pass to next error handler if not a MulterError
  next(err);
});

// Server + DB setup
const PORT = Number(process.env.PORT) || 4000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error(' ERROR: MONGO_URI missing in .env');
  process.exit(1);
}

async function start() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI as string);
    console.log('MongoDB connected');

    app.listen(PORT, '0.0.0.0',() => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
