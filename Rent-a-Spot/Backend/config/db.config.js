require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const url = process.env.COSMOS_DB_URI || process.env.MONGO_URI;
        
        if (!url) {
            throw new Error('COSMOS_DB_URI or MONGO_URI environment variable is not defined');
        }
        
        console.log('Attempting to connect to CosmosDB...');
        
        const conn = await mongoose.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // CosmosDB specific options
            ssl: true,
            sslValidate: false,
            retryWrites: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log(`CosmosDB Connected: ${conn.connection.host}`);
        return conn;
        
    } catch (error) {
        console.error("Error connecting to CosmosDB:", error);
        throw error;
    }
};

module.exports = {
    connectDB
};
