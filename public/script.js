document.addEventListener('DOMContentLoaded', () => {
  const bookingForm = document.getElementById('booking-form');
  const timeSlotSelect = document.getElementById('time-slot');
  const qrCodeDiv = document.getElementById('qr-code');
  const dateInput = document.getElementById('date');
  const nextStep1Button = document.getElementById('next-step-1');
  const nextStep2Button = document.getElementById('next-step-2');

  // Fetch available time slots for April 1st
  const fetchTimeSlots = () => {
    fetch('/api/timeslots')
      .then(response => response.json())
      .then(data => {
        timeSlotSelect.innerHTML = ''; // Clear existing options
        data.forEach(slot => {
          const option = document.createElement('option');
          option.value = slot.time;
          option.textContent = `${slot.time} (${slot.availableSpaces} spaces available)`;
          timeSlotSelect.appendChild(option);
        });
      });
  };

  // Fetch time slots on page load
  fetchTimeSlots();

  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loader';
  document.body.appendChild(loadingIndicator);

  if (nextStep1Button) {
    nextStep1Button.addEventListener('click', () => {
      document.getElementById('step-1').classList.add('hidden');
      document.getElementById('step-2').classList.remove('hidden');
    });
  } else {
    console.error('Next Step 1 button not found');
  }

  if (nextStep2Button) {
    nextStep2Button.addEventListener('click', () => {
      const timeSlot = document.getElementById('time-slot').value;
      const groupSize = document.getElementById('group-size').value;
      document.getElementById('confirmation-details').innerHTML = `
        <p>Time Slot: ${timeSlot}</p>
        <p>Group Size: ${groupSize}</p>
      `;
      document.getElementById('step-2').classList.add('hidden');
      document.getElementById('step-3').classList.remove('hidden');
    });
  } else {
    console.error('Next Step 2 button not found');
  }

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const timeSlot = document.getElementById('time-slot').value;
      const groupSize = document.getElementById('group-size').value;
      const email = document.getElementById('email').value;
      const className = document.getElementById('class-name').value;
      const paymentMethod = document.getElementById('payment-method').value;

      // Debugging logs
      console.log('Booking request details:');
      console.log('Name:', name);
      console.log('Time Slot:', timeSlot);
      console.log('Group Size:', groupSize);
      console.log('Email:', email);
      console.log('Class Name:', className);
      console.log('Payment Method:', paymentMethod);

      // Show loading indicator
      loadingIndicator.style.display = 'block';

      // Send booking request
      fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, timeSlot, groupSize, email, className, paymentMethod })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Booking failed: ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        // Hide loading indicator
        loadingIndicator.style.display = 'none';

        if (data.qrCodeUrl) {
          // Redirect to confirmation page
          window.location.href = '/confirmation';
        } else {
          alert(data.message);
        }
      })
      .catch(error => {
        alert(error.message);
      });
    });
  } else {
    console.error('Booking form not found');
  }

  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
});

function showDebugMessage(message) {
  const debugArea = document.getElementById('debug-area');
  debugArea.innerHTML += `<p>${message}</p>`;
  debugArea.style.display = 'block';
}
