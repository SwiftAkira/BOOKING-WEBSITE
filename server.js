const express = require('express');
const bodyParser = require('body-parser');
const { db, insertJsonData, getAllJsonData, updateSlotAvailability, getAllSlots, initializeSlots, deleteJsonData } = require('./database');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to the Laser Tag Booking API');
});

// Fetch available time slots
app.get('/api/timeslots', async (req, res) => {
  try {
    const slots = await getAllSlots();
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving time slots', error });
  }
});

// API endpoint to handle booking
app.post('/api/book', async (req, res) => {
  const { name, timeSlot, groupSize, email, className, paymentMethod } = req.body;

  try {
    const slots = await getAllSlots();
    const slot = slots.find(s => s.time === timeSlot);
    if (slot && slot.availableSpaces >= groupSize) {
      const newAvailableSpaces = slot.availableSpaces - groupSize;
      await updateSlotAvailability(timeSlot, newAvailableSpaces);
      const jsonData = { name, timeSlot, groupSize, email, className, paymentMethod, paid: false };
      await insertJsonData(jsonData);
      res.status(200).json({ message: 'Booking successful!', id: jsonData });
    } else {
      res.status(400).json({ message: 'Not enough spaces available for your group size.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error processing booking', error });
  }
});

// API endpoint to get all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await getAllJsonData();
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      name: booking.data.name,
      timeSlot: booking.data.timeSlot,
      groupSize: booking.data.groupSize,
      email: booking.data.email, // Include email in the response
      paid: booking.data.paid
    }));
    res.status(200).json(formattedBookings);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving bookings', error });
  }
});

// Create the slots table and initialize slots
initializeSlots();

// Middleware for authentication
const authenticate = (req, res, next) => {
  const password = req.query.password;
  if (password === 'CJ') {
    next();
  } else {
    res.status(403).send('Forbidden: Incorrect password');
  }
};

// Admin dashboard route with authentication
app.get('/admin', (req, res) => {
  if (!req.query.password || req.query.password !== 'CJ') {
    res.redirect('/login');
  } else {
    res.sendFile(__dirname + '/public/admin.html');
  }
});

// Update booking
app.put('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  const { name, timeSlot, groupSize, email, paid } = req.body; // Include email in the update
  try {
    const bookings = await getAllJsonData();
    const bookingIndex = bookings.findIndex(b => b.id === parseInt(id));
    if (bookingIndex !== -1) {
      bookings[bookingIndex].data.name = name;
      bookings[bookingIndex].data.timeSlot = timeSlot;
      bookings[bookingIndex].data.groupSize = groupSize;
      bookings[bookingIndex].data.email = email; // Update email
      bookings[bookingIndex].data.paid = paid;
      // Update the existing booking instead of inserting a new one
      await db.run("UPDATE json_data SET data = ? WHERE id = ?", JSON.stringify(bookings[bookingIndex].data), id);
      console.log(`Booking with ID ${id} updated successfully:`, bookings[bookingIndex].data);
      res.json({ message: 'Booking updated successfully.' });
    } else {
      res.status(404).json({ message: 'Booking not found.' });
    }
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Error updating booking', error });
  }
});

// Delete booking
app.delete('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await deleteJsonData(id);
    if (result) {
      res.json({ message: 'Booking deleted successfully.' });
    } else {
      res.status(404).json({ message: 'Booking not found.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting booking', error });
  }
});

// Login route
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

// Confirmation route
app.get('/confirmation', (req, res) => {
  res.sendFile(__dirname + '/public/confirmation.html');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
