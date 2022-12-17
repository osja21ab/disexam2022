window.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('loginBtn').addEventListener('click', (event) => {
        if (!document.getElementById('username').value) {
            alert('Username cannot be empty');
            return;
        }
        if (!document.getElementById('password').value) {
            alert('Password cannot be empty');
            return;
        }

        fetch('/api/login', {
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
                response.json().then((data) => {
                    localStorage.setItem('token', data.token);
                    alert('Login successful');
                    window.location.href = '/index.html';
                });
            } else {
                alert('Login failed');
            }
        })
    });
});