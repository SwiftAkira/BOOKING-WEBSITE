const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('mydatabase.db');

// Create table if it doesn't exist
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS json_data (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS slots (id INTEGER PRIMARY KEY AUTOINCREMENT, time TEXT, availableSpaces INTEGER)");
});

// Function to insert JSON data
const insertJsonData = (jsonData) => {
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO json_data (data) VALUES (?)", JSON.stringify(jsonData), function(err) {
      if (err) {
        return reject(err);
      }
      resolve(this.lastID);
    });
  });
};

// Function to get all JSON data
const getAllJsonData = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM json_data", [], (err, rows) => {
      if (err) {
        return reject(err);
      }
      const parsedRows = rows.map(row => ({ id: row.id, data: JSON.parse(row.data) }));
      resolve(parsedRows);
    });
  });
};

// Function to update slot availability
const updateSlotAvailability = (time, availableSpaces) => {
  return new Promise((resolve, reject) => {
    db.run("UPDATE slots SET availableSpaces = ? WHERE time = ?", [availableSpaces, time], function(err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

// Function to get all slots
const getAllSlots = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM slots", [], (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
};

// Function to delete JSON data
const deleteJsonData = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT data FROM json_data WHERE id = ?", [id], (err, row) => {
      if (err) {
        return reject(err);
      }
      if (row) {
        const bookingData = JSON.parse(row.data);
        const timeSlot = bookingData.timeSlot;
        const groupSize = bookingData.groupSize;

        db.run("DELETE FROM json_data WHERE id = ?", [id], function(err) {
          if (err) {
            return reject(err);
          }
          if (this.changes > 0) {
            // Update the slot availability
            db.run("UPDATE slots SET availableSpaces = availableSpaces + ? WHERE time = ?", [groupSize, timeSlot], function(err) {
              if (err) {
                return reject(err);
              }
              resolve(this.changes > 0);
            });
          } else {
            resolve(false);
          }
        });
      } else {
        resolve(false);
      }
    });
  });
};

// Function to clear all slots
const clearSlots = () => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM slots", function(err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

// Initialize slots in the database
const initializeSlots = async () => {
  await clearSlots(); // Clear existing slots

  const startTime = new Date('2025-04-01T08:30:00');
  const endTime = new Date('2025-04-01T16:30:00');

  const slots = [];
  for (let time = startTime; time <= endTime; time.setMinutes(time.getMinutes() + 30)) {
    const slotTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    slots.push({ time: slotTime, availableSpaces: 20 });
  }

  slots.forEach(slot => {
    db.run("INSERT INTO slots (time, availableSpaces) VALUES (?, ?)", [slot.time, slot.availableSpaces]);
  });
};

module.exports = { insertJsonData, getAllJsonData, updateSlotAvailability, getAllSlots, deleteJsonData, initializeSlots };
