const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { connectDB } = require("./config/db.config");
const cors = require('cors');

console.log('=== STARTING APPLICATION ===');

// Set body-parser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const port = process.env.PORT || 1337;

// CORS Configuration
const corsOptions = {
    origin: [
        'https://rent-spot-backend-f6cretc2bccehuas.francecentral-01.azurewebsites.net',
        'http://localhost:3000',
        'http://localhost:3001'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Test endpoint (works without database)
app.get('/test', (req, res) => {
    res.status(200).json({ 
        message: 'Basic test endpoint working',
        timestamp: new Date().toISOString(),
        port: port
    });
});

// Connect to CosmosDB with proper error handling
let dbConnected = false;

console.log('Attempting CosmosDB connection...');
connectDB()
    .then(() => {
        console.log('✅ CosmosDB connected successfully');
        dbConnected = true;
    })
    .catch((error) => {
        console.error('❌ CosmosDB connection failed:', error.message);
        dbConnected = false;
        // Don't crash the app, continue without database
    });

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Rent-a-Spot API is running',
        timestamp: new Date().toISOString(),
        port: port,
        database: dbConnected ? 'connected' : 'disconnected'
    });
});

// INLINE PARKING ROUTES - Direct implementation
try {
    console.log('Loading parking schema...');
    const Parking = require("./models/parkingSchema");
    const Review = require("./models/reviewSchema");
    const Joi = require('joi');
    const { Types } = require("mongoose");
    
    console.log('✅ Parking dependencies loaded successfully');

    // GET /parking - Fetch parking list
    app.get('/parking', async (req, res) => {
        try {
            console.log('GET /parking called with query:', req.query);
            const { user_id } = req.query;
            let parking;
            
            if (user_id) {
                parking = await Parking.find({ user_id }).populate('user_id');
            } else {
                parking = await Parking.find({}).populate('user_id');
            }

            const reviews = await Review.find();

            const parkingWithOwnerRatings = parking.map((item) => {
                let rating = 0;
                let count = 0;
                const userReviews = reviews.filter((review) => {
                    return review.owner_id.equals(item?.user_id?._id);
                });
                
                userReviews.forEach((review) => {
                    rating += review?.rating;
                    count++;
                });
                
                const owner_rating = rating > 0 ? (rating / count) : 0;
                return { ...item.toObject(), owner_rating };
            });
           
            console.log(`✅ Found ${parkingWithOwnerRatings.length} parking spots`);
            res.json(parkingWithOwnerRatings);
        } catch (error) {
            console.error('❌ GET /parking error:', error);
            res.status(500).json({ 
                error: 'Failed to fetch parking spots',
                details: error.message 
            });
        }
    });

    // POST /parking - Create new parking
    app.post('/parking', async (req, res) => {
        try {
            console.log('POST /parking called with body:', req.body);
            let { name, address, city, lat, long, user_id } = req.body;

            // Input validation
            const schema = Joi.object({
                name: Joi.string().required(),
                address: Joi.string().required(),
                city: Joi.string().required(),
                lat: Joi.string().required(),
                long: Joi.string().required(),
                user_id: Joi.string().required(),
            });

            const { error } = schema.validate({ name, address, city, lat, long, user_id });
            if (error) {
                console.log('❌ Validation error:', error.details[0].message);
                return res.status(400).json({ error: error.details[0].message });
            }

            const parking = await Parking.create({ name, address, city, lat, long, user_id });
            console.log('✅ Parking created successfully:', parking._id);
            res.status(201).json({ 
                message: "Parking created", 
                parking 
            });
        } catch (error) {
            console.error('❌ POST /parking error:', error);
            res.status(500).json({ 
                error: 'Failed to create parking',
                details: error.message 
            });
        }
    });

    // PUT /parking/:id - Update parking
    app.put('/parking/:id', async (req, res) => {
        try {
            console.log('PUT /parking/:id called with id:', req.params.id, 'body:', req.body);
            const { id } = req.params;

            if (!Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid parking id" });
            }

            const parking = await Parking.findById(id);
            if (!parking) {
                return res.status(404).json({ error: "Parking not found" });
            }

            // Input validation
            const schema = Joi.object({
                name: Joi.string().required(),
                address: Joi.string().required(),
                city: Joi.string().required(),
                lat: Joi.string().required(),
                long: Joi.string().required(),
                user_id: Joi.string().required(),
            });

            let { name, address, city, lat, long, user_id } = parking;
            user_id = user_id.toString();
            const updatedParkingObj = { name, address, city, lat, long, user_id, ...req.body };

            const { error } = schema.validate(updatedParkingObj);
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }

            const updatedParking = await parking.updateOne(updatedParkingObj);
            if (updatedParking) {
                console.log('✅ Parking updated successfully');
                res.json({ message: 'Parking updated successfully' });
            } else {
                res.status(400).json({ error: 'Parking not updated' });
            }
        } catch (error) {
            console.error('❌ PUT /parking/:id error:', error);
            res.status(500).json({ 
                error: 'Failed to update parking',
                details: error.message 
            });
        }
    });

    // DELETE /parking/:id - Delete parking
    app.delete('/parking/:id', async (req, res) => {
        try {
            console.log('DELETE /parking/:id called with id:', req.params.id);
            const { id } = req.params;

            if (!Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid parking id" });
            }

            const parking = await Parking.findByIdAndDelete(id);
            if (parking) {
                console.log('✅ Parking deleted successfully');
                res.json({ message: "Parking deleted successfully" });
            } else {
                res.status(404).json({ error: "Parking not found" });
            }
        } catch (error) {
            console.error('❌ DELETE /parking/:id error:', error);
            res.status(500).json({ 
                error: 'Failed to delete parking',
                details: error.message 
            });
        }
    });

    console.log('✅ Inline parking routes loaded successfully');

} catch (error) {
    console.error('❌ Failed to load parking dependencies:', error);
    
    // Emergency fallback parking routes
    app.all('/parking*', (req, res) => {
        res.status(500).json({
            error: 'Parking dependencies failed to load',
            details: error.message,
            method: req.method,
            path: req.path,
            body: req.body
        });
    });
}

// Load other routes (optional - comment out if they cause issues)
try {
    console.log('Loading other route controllers...');
    
    const userRouter = require("./controllers/user");
    app.use("/user", userRouter);
    console.log('✅ User router loaded');
    
    const paymentMethodRouter = require("./controllers/paymentMethod");
    app.use("/paymentMethod", paymentMethodRouter);
    console.log('✅ PaymentMethod router loaded');
    
    const bookingRouter = require("./controllers/booking");
    app.use("/booking", bookingRouter);
    console.log('✅ Booking router loaded');
    
    const spaceRouter = require("./controllers/spaceRouter");
    app.use("/space", spaceRouter);
    console.log('✅ Space router loaded');
    
    const reviewRouter = require("./controllers/review");
    app.use("/review", reviewRouter);
    console.log('✅ Review router loaded');
    
    const { isLoggedIn } = require("./controllers/middleware");
    console.log('✅ Middleware loaded');
    
    // Protected root endpoint
    app.get('/', isLoggedIn, async (req, res) => {
        res.json({ 
            message: 'Hello world! Rent-a-Spot API is running.',
            dbStatus: dbConnected ? 'connected' : 'disconnected'
        });
    });

} catch (error) {
    console.error('❌ Other routes failed to load:', error.message);
    
    // Basic root endpoint if middleware fails
    app.get('/', (req, res) => {
        res.json({ 
            message: 'API running with inline parking routes',
            dbStatus: dbConnected ? 'connected' : 'disconnected',
            parkingRoutesStatus: 'inline implementation active'
        });
    });
}

// Add a test endpoint for parking specifically
app.get('/parking-test', (req, res) => {
    res.json({ 
        message: 'Parking route test endpoint working',
        timestamp: new Date().toISOString(),
        dbStatus: dbConnected ? 'connected' : 'disconnected',
        implementation: 'inline routes'
    });
});

// Error handlers
app.use((req, res, next) => {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
    res.status(404).json({
        error: "Not Found",
        method: req.method,
        url: req.url,
        availableRoutes: ['/test', '/health', '/parking', '/parking-test']
    });
});

app.use((error, req, res, next) => {
    console.log(`❌ Error handler caught:`, error.message);
    res.status(error.status || 500).json({
        error: error.message,
        status: error.status || 500
    });
});

// Start server
app.listen(port, () => {
    console.log(`=== Rent-a-Spot API STARTED on port ${port} ===`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${dbConnected ? 'CosmosDB Connected' : 'Database Disconnected'}`);
    console.log(`Parking routes: Inline implementation`);
    console.log(`Available routes: /test, /health, /parking, /parking-test`);
    process.stdout.write(`STARTUP COMPLETE: Server running on port ${port}\n`);
});
