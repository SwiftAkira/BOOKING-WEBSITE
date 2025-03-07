const fetchBookings = () => {
  fetch('/api/bookings')
    .then(response => response.json())
    .then(data => {
      console.log('Fetched bookings:', data); // Debugging log
      const bookingTable = document.getElementById('booking-table');
      bookingTable.innerHTML = ''; // Clear existing rows
      data.forEach(booking => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class='py-2 px-4'>${booking.name || 'N/A'}</td>
          <td class='py-2 px-4'>${booking.email || 'N/A'}</td> <!-- Display email -->
          <td class='py-2 px-4'>${booking.timeSlot || 'N/A'}</td>
          <td class='py-2 px-4'>${booking.groupSize || 'N/A'}</td>
          <td class='py-2 px-4'>
            <button class='btn btn-edit bg-yellow-500 text-white rounded-lg px-4 py-2' data-id='${booking.id}'>Edit</button>
            <button class='btn btn-delete bg-red-500 text-white rounded-lg px-4 py-2' data-id='${booking.id}'>Delete</button>
            <select class='form-control border rounded-lg p-2' id='payment-status-${booking.id}'>
              <option value='false' ${!booking.paid ? 'selected' : ''}>Not Paid</option>
              <option value='true' ${booking.paid ? 'selected' : ''}>Paid</option>
            </select>
          </td>
        `;
        bookingTable.appendChild(row);
      });
      addEventListeners();
    })
    .catch(error => console.error('Error fetching bookings:', error));
};

// Call fetchBookings on page load
document.addEventListener('DOMContentLoaded', fetchBookings);

function addEventListeners() {
  const deleteButtons = document.querySelectorAll('.btn-delete');
  deleteButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const bookingId = e.target.getAttribute('data-id');
      console.log('Deleting booking with ID:', bookingId); // Debugging log
      deleteBooking(bookingId);
    });
  });

  const paymentStatusSelects = document.querySelectorAll('[id^=payment-status-]');
  paymentStatusSelects.forEach(select => {
    select.addEventListener('change', (e) => {
      const bookingId = e.target.id.split('-')[2];
      updatePaymentStatus(bookingId, e.target.value);
    });
  });
}

function deleteBooking(bookingId) {
  fetch(`/api/bookings/${bookingId}`, {
    method: 'DELETE'
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message);
    fetchBookings(); // Refresh the booking list dynamically
  })
  .catch(error => console.error('Error deleting booking:', error));
}

function updatePaymentStatus(bookingId, status) {
  fetch(`/api/bookings/${bookingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ paid: status === 'true' })
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message);
    fetchBookings(); // Refresh the booking list dynamically
  })
  .catch(error => console.error('Error updating payment status:', error));
}
