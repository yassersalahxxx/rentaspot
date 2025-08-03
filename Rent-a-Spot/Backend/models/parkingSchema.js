const mongoose = require('mongoose')

const parkingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,  
        required: true,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    lat: {
        type: Number, // Changed from String to Number for better performance
        required: true,
        validate: {
            validator: function(v) {
                return v >= -90 && v <= 90; // Valid latitude range
            },
            message: 'Latitude must be between -90 and 90 degrees'
        }
    },
    long: {
        type: Number, // Changed from String to Number for better performance
        required: true,
        validate: {
            validator: function(v) {
                return v >= -180 && v <= 180; // Valid longitude range
            },
            message: 'Longitude must be between -180 and 180 degrees'
        }
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true, // Added required validation
        ref: 'User'
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
})

// Add index for better query performance
parkingSchema.index({ user_id: 1 })
parkingSchema.index({ city: 1 })
parkingSchema.index({ lat: 1, long: 1 }) // Geospatial queries

// Add a virtual for full address
parkingSchema.virtual('fullAddress').get(function() {
    return `${this.address}, ${this.city}`
})

// Ensure virtual fields are serialized
parkingSchema.set('toJSON', { virtuals: true })

module.exports = mongoose.model("Parking", parkingSchema)
