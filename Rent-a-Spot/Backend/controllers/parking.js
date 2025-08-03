import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { createParking, updateParking } from '../api/api'
import './../css/createParking.scss'

const ParkingForm = () => {
  const { state } = useLocation()
  const user = useSelector((state) => state.user);

  // Create a form object for storing values with default empty strings
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    lat: '',
    long: ''
  })

  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Handles form values upon change
  const handleFormChange = ({ key, value }) => {
    setForm({ ...form, [key]: value })
    // Clear error when user starts typing
    if (error) setError('')
  }

  // Validate coordinates are within Egypt bounds
  const validateEgyptCoordinates = (lat, lng) => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    // Egypt approximate bounds
    const validLat = latitude >= 22 && latitude <= 32;
    const validLng = longitude >= 25 && longitude <= 37;
    
    return validLat && validLng;
  }

  // Validate ObjectId format (24 character hex string)
  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  // Create new parking API - UPDATED VERSION
  const handleCreateParking = () => {
    setSuccessMessage('')
    setError('')
    setIsLoading(true)

    // Validate user_id exists
    if (!user?._id) {
      setError('User not found. Please log in again.');
      setIsLoading(false)
      return;
    }

    // Clean the user_id - remove any whitespace and normalize
    const cleanUserId = String(user._id).trim();
    
    console.log('=== USER ID DEBUG ===');
    console.log('Original user._id:', JSON.stringify(user._id));
    console.log('Cleaned user_id:', JSON.stringify(cleanUserId));
    console.log('Length:', cleanUserId.length);
    console.log('Is valid ObjectId format:', /^[0-9a-fA-F]{24}$/.test(cleanUserId));
    
    // Validate user_id format (must be valid ObjectId - exactly 24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(cleanUserId)) {
      console.error('Invalid user_id format. Expected 24 hex characters, got:', {
        value: cleanUserId,
        length: cleanUserId.length,
        type: typeof cleanUserId
      });
      setError(`Invalid user ID format. Please log in again. (ID: ${cleanUserId.substring(0, 8)}...)`);
      setIsLoading(false)
      return;
    }

    // Ensure all values are properly trimmed strings
    const body = {
      name: String(form.name || '').trim(),
      address: String(form.address || '').trim(), 
      city: String(form.city || '').trim(),
      lat: String(form.lat || '').trim(),
      long: String(form.long || '').trim(),
      user_id: cleanUserId // Use the cleaned user_id
    }

    // Additional validation to ensure no empty strings
    if (!body.name) {
      setError('Name cannot be empty');
      setIsLoading(false);
      return;
    }

    if (!body.address) {
      setError('Address cannot be empty');
      setIsLoading(false);
      return;
    }

    if (!body.city) {
      setError('City cannot be empty'); 
      setIsLoading(false);
      return;
    }

    if (!body.lat || isNaN(parseFloat(body.lat))) {
      setError('Valid latitude is required');
      setIsLoading(false);
      return;
    }

    if (!body.long || isNaN(parseFloat(body.long))) {
      setError('Valid longitude is required');
      setIsLoading(false);
      return;
    }

    console.log('Final body being sent:', JSON.stringify(body, null, 2));
    console.log('Body data types and lengths:', {
      name: `${typeof body.name} (${body.name.length}) - "${body.name}"`,
      address: `${typeof body.address} (${body.address.length}) - "${body.address}"`,
      city: `${typeof body.city} (${body.city.length}) - "${body.city}"`,
      lat: `${typeof body.lat} (${body.lat.length}) - "${body.lat}"`,
      long: `${typeof body.long} (${body.long.length}) - "${body.long}"`,
      user_id: `${typeof body.user_id} (${body.user_id.length}) - "${body.user_id}"`
    });

    createParking({ 
      body, 
      handleCreateParkingSuccess: (data) => {
        setIsLoading(false)
        handleCreateParkingSuccess(data)
      },
      handleCreateParkingFailure: (error) => {
        setIsLoading(false)
        handleCreateParkingFailure(error)
      }
    })
  }

  const handleCreateParkingSuccess = (data) => {
    setSuccessMessage('Parking created successfully!')
    // Reset form after successful creation
    setForm({
      name: '',
      address: '',
      city: '',
      lat: '',
      long: ''
    })
  }

  const handleCreateParkingFailure = (error) => {
    console.log('Raw error passed from API:', JSON.stringify(error, null, 2));
    console.log('Error type:', typeof error);

    // Handle the new error format from updated backend
    let errorMessage = 'Failed to create parking';

    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      // Handle the updated backend error structure
      if (error.error && typeof error.error === 'string') {
        // This handles Joi validation errors and other string errors
        errorMessage = error.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.error && error.error.codeName) {
        // Handle MongoDB errors
        if (error.error.codeName === 'BadValue') {
          errorMessage = 'Invalid data format. Please check all required fields.';
        } else {
          errorMessage = `Database error: ${error.error.codeName} (code: ${error.error.code})`;
        }
      } else if (error.codeName) {
        errorMessage = `Database error: ${error.codeName} (code: ${error.code})`;
      } else {
        errorMessage = 'Unknown error occurred. Please try again.';
      }
    }

    console.log('Final error message:', errorMessage);
    setError(errorMessage);
  }

  // Edit parking API
  const handleUpdateParking = () => {
    setSuccessMessage('')
    setError('')
    setIsLoading(true)

    // Ensure all values are properly trimmed strings
    const body = {
      name: String(form.name || '').trim(),
      address: String(form.address || '').trim(),
      city: String(form.city || '').trim(),
      lat: String(form.lat || '').trim(),
      long: String(form.long || '').trim()
    }

    // Additional validation to ensure no empty strings
    if (!body.name) {
      setError('Name cannot be empty');
      setIsLoading(false);
      return;
    }

    if (!body.address) {
      setError('Address cannot be empty');
      setIsLoading(false);
      return;
    }

    if (!body.city) {
      setError('City cannot be empty'); 
      setIsLoading(false);
      return;
    }

    if (!body.lat || isNaN(parseFloat(body.lat))) {
      setError('Valid latitude is required');
      setIsLoading(false);
      return;
    }

    if (!body.long || isNaN(parseFloat(body.long))) {
      setError('Valid longitude is required');
      setIsLoading(false);
      return;
    }

    console.log('Form values:', JSON.stringify(form, null, 2));
    console.log('Updating parking data:', JSON.stringify(body, null, 2));
    console.log('Body data types:', {
      name: typeof body.name + ' - ' + body.name,
      address: typeof body.address + ' - ' + body.address,
      city: typeof body.city + ' - ' + body.city,
      lat: typeof body.lat + ' - ' + body.lat,
      long: typeof body.long + ' - ' + body.long
    });

    updateParking({ 
      id: state?.parking?._id, 
      body, 
      handleUpdateParkingSuccess: (data) => {
        setIsLoading(false)
        handleUpdateParkingSuccess(data)
      },
      handleUpdateParkingFailure: (error) => {
        setIsLoading(false)
        handleUpdateParkingFailure(error)
      }
    })
  }

  const handleUpdateParkingSuccess = (data) => {
    setSuccessMessage('Parking updated successfully!')
  }

  const handleUpdateParkingFailure = (error) => {
    console.log('Raw update error passed from API:', JSON.stringify(error, null, 2));
    console.log('Update error type:', typeof error);

    // Handle the new error format from updated backend
    let errorMessage = 'Failed to update parking';

    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      // Handle the updated backend error structure
      if (error.error && typeof error.error === 'string') {
        // This handles Joi validation errors and other string errors
        errorMessage = error.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.error && error.error.codeName) {
        // Handle MongoDB errors
        if (error.error.codeName === 'BadValue') {
          errorMessage = 'Invalid data format. Please check all required fields.';
        } else {
          errorMessage = `Database error: ${error.error.codeName} (code: ${error.error.code})`;
        }
      } else if (error.codeName) {
        errorMessage = `Database error: ${error.codeName} (code: ${error.code})`;
      } else {
        errorMessage = 'Unknown error occurred. Please try again.';
      }
    }

    console.log('Final update error message:', errorMessage);
    setError(errorMessage);
  }

  const handleSubmit = () => {
    // Reset messages
    setSuccessMessage('')
    setError('')

    // Validate all required fields
    if (!form.name || !form.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!form.address || !form.address.trim()) {
      setError('Address is required');
      return;
    }

    if (!form.city || !form.city.trim()) {
      setError('City is required');
      return;
    }

    if (!form.lat || !form.lat.trim()) {
      setError('Latitude is required');
      return;
    }

    if (!form.long || !form.long.trim()) {
      setError('Longitude is required');
      return;
    }

    // Validate lat/long are valid numbers (even though we send as strings)
    const latitude = parseFloat(form.lat.trim());
    const longitude = parseFloat(form.long.trim());

    if (isNaN(latitude)) {
      setError('Latitude must be a valid number');
      return;
    }

    if (isNaN(longitude)) {
      setError('Longitude must be a valid number');
      return;
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      setError('Latitude must be between -90 and 90');
      return;
    }

    if (longitude < -180 || longitude > 180) {
      setError('Longitude must be between -180 and 180');
      return;
    }

    // Egypt-specific validation
    if (!validateEgyptCoordinates(latitude, longitude)) {
      setError('Coordinates must be within Egypt boundaries (Lat: 22-32, Long: 25-37)');
      return;
    }

    // Additional validation for user login (only for create)
    if (!state?.parking && (!user?._id || !isValidObjectId(user._id))) {
      setError('Please log in with a valid account to create parking.');
      return;
    }

    if (state?.parking) {
      handleUpdateParking()
    } else {
      handleCreateParking()
    }
  }

  useEffect(() => {
    if (state?.parking) {
      setForm({
        name: state.parking.name || '',
        address: state.parking.address || '',
        city: state.parking.city || '',
        lat: state.parking.lat ? String(state.parking.lat) : '',
        long: state.parking.long ? String(state.parking.long) : ''
      })
    }
  }, [state])

  // ADDED: Debug Redux user store
  useEffect(() => {
    console.log('=== REDUX USER DEBUG ===');
    console.log('Full user object from Redux:', user);
    console.log('user._id value:', JSON.stringify(user?._id));
    console.log('user._id type:', typeof user?._id);
    console.log('user._id length:', user?._id?.length);
    
    if (user?._id) {
      // Check if it's a valid ObjectId format
      const isValidFormat = /^[0-9a-fA-F]{24}$/.test(user._id);
      console.log('Is valid ObjectId format:', isValidFormat);
      
      if (!isValidFormat) {
        console.log('PROBLEM: user_id is not in valid ObjectId format!');
        console.log('Expected: 24 hexadecimal characters');
        console.log('Got:', user._id, 'with length:', user._id.length);
        
        // Check for common issues
        if (user._id.length > 24) {
          console.log('user_id is too long - might have extra characters');
        } else if (user._id.length < 24) {
          console.log('user_id is too short - might be truncated');
        }
      }
    }
    console.log('=== END REDUX DEBUG ===');
  }, [user]);

  return (
    <div className="parking-form-container">
      <div className="form-header">
        <h2>{state?.parking ? 'Update Parking' : 'Create New Parking'}</h2>
        {!state?.parking && (
          <p className="form-subtitle">
            Please ensure you are logged in to create a parking spot.
          </p>
        )}
      </div>

      <form className="parking-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div className="form-group">
          <label htmlFor="name">Parking Name *</label>
          <input
            type="text"
            id="name"
            value={form.name || ''}
            onChange={(e) => handleFormChange({ key: 'name', value: e.target.value })}
            placeholder="Enter parking name (e.g., Downtown Parking)"
            disabled={isLoading}
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">Address *</label>
          <input
            type="text"
            id="address"
            value={form.address || ''}
            onChange={(e) => handleFormChange({ key: 'address', value: e.target.value })}
            placeholder="Enter full address"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="city">City *</label>
          <input
            type="text"
            id="city"
            value={form.city || ''}
            onChange={(e) => handleFormChange({ key: 'city', value: e.target.value })}
            placeholder="Enter city name"
            disabled={isLoading}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="lat">Latitude *</label>
            <input
              type="text"
              id="lat"
              value={form.lat || ''}
              onChange={(e) => handleFormChange({ key: 'lat', value: e.target.value })}
              placeholder="30.0444"
              disabled={isLoading}
            />
            <small>Egypt bounds: 22 to 32 (enter as decimal)</small>
          </div>

          <div className="form-group">
            <label htmlFor="long">Longitude *</label>
            <input
              type="text"
              id="long"
              value={form.long || ''}
              onChange={(e) => handleFormChange({ key: 'long', value: e.target.value })}
              placeholder="31.2357"
              disabled={isLoading}
            />
            <small>Egypt bounds: 25 to 37 (enter as decimal)</small>
          </div>
        </div>

        {/* User Status Display */}
        {!state?.parking && (
          <div className="user-status">
            <small>
              {user?._id ? (
                <span className="logged-in">✓ Logged in as: {user.name || user.email}</span>
              ) : (
                <span className="not-logged-in">⚠ Please log in to create parking</span>
              )}
            </small>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            <strong>✓ {successMessage}</strong>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <strong>✗ {error}</strong>
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button 
            type="submit" 
            className={`submit-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || (!state?.parking && !user?._id)}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner">⏳</span>
                Processing...
              </>
            ) : (
              state?.parking ? 'Update Parking' : 'Create Parking'
            )}
          </button>
        </div>
      </form>

      {/* Coordinate Helper */}
      <div className="coordinate-helper">
        <h4>🗺️ Common Egypt Coordinates:</h4>
        <div className="coordinate-examples">
          <div className="coordinate-item" onClick={() => {
            setForm(prev => ({ ...prev, lat: '30.0444', long: '31.2357' }));
            setError('');
          }}>
            <strong>Cairo/New Cairo:</strong> 30.0444, 31.2357
            <small>(Click to use)</small>
          </div>
          <div className="coordinate-item" onClick={() => {
            setForm(prev => ({ ...prev, lat: '31.2001', long: '29.9187' }));
            setError('');
          }}>
            <strong>Alexandria:</strong> 31.2001, 29.9187
            <small>(Click to use)</small>
          </div>
          <div className="coordinate-item" onClick={() => {
            setForm(prev => ({ ...prev, lat: '30.0131', long: '31.2089' }));
            setError('');
          }}>
            <strong>Giza:</strong> 30.0131, 31.2089
            <small>(Click to use)</small>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="form-tips">
        <h4>💡 Tips:</h4>
        <ul>
          <li>Use precise coordinates for better location accuracy</li>
          <li>Double-check your coordinates are within Egypt</li>
          <li>Click on the coordinate examples above to auto-fill</li>
          <li>Make sure you're logged in before creating parking</li>
        </ul>
      </div>
    </div>
  )
}

export default ParkingForm
