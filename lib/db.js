import mongoose from "mongoose";

export const connectDB = async () => {
  try {
   
    // Set up connection event listeners
    mongoose.connection.on('connected', () => 
      console.log('Database connected')
    );
     // Connect to MongoDB without deprecated options
    await mongoose.connect (`${process.env.MONGODB_URI}`)


   

  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit process on connection failure
  }
};