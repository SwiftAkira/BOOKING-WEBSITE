document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    if (password === 'CJ') {
        window.location.href = '/admin?password=' + password;
    } else {
        alert('Incorrect password. Please try again.');
    }
});
