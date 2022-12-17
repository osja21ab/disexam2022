window.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('registerBtn').addEventListener('click', (event) => {
        if (!document.getElementById('username').value) {
            alert('Username cannot be empty');
            return;
        }
        if (!document.getElementById('password').value) {
            alert('Password cannot be empty');
            return;
        }
        if (document.getElementById('password').value !== document.getElementById('passwordConfirm').value) {
            alert('Passwords do not match');
            return;
        }

        fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: document.getElementById('username').value,
                password: document.getElementById('password').value,
            })
        }).then((response) => {
            if (response.status === 200) {
                alert('User created');
                window.location.href = '/login.html';
            } else if (response.status === 400) {
                alert('Username already exists');
            } else {
                alert('Registration failed');
            }
        })
    });
});