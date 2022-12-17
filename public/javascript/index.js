var ws = new WebSocket("wss://206.189.49.53");

window.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('logoutBtn').addEventListener('click', (event) => {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });

    document.getElementById('sendBtn').addEventListener('click', (event) => {
        if (ws.readyState != ws.OPEN) {
            alert('Not connected');
            return;
        }
        if (!document.getElementById('messageInput').value) {
            alert('Message cannot be empty');
            return;
        }

        ws.send(JSON.stringify({
            message: document.getElementById('messageInput').value
        }));

        document.getElementById('messageInput').value = '';
    });

    fetch('/api/me', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token: localStorage.getItem('token')
        })
    }).then((response) => {
        if (response.status === 200) {
            response.json().then((data) => {
                document.getElementById('loggedInAs').innerText = data.username;
            });
        } else {
            window.location.href = '/login.html';
        }
    });

    ws.onopen = () => {
        ws.send(JSON.stringify({
            token: localStorage.getItem('token')
        }));
    };

    ws.onmessage = (message) => {
        let jsonMessage = JSON.parse(message.data);
        if (jsonMessage.status && jsonMessage.status == 'connected') {
            document.getElementById('status').innerText = 'Connected';
            document.getElementById('status').style.color = 'green';
        } else if (jsonMessage.message && jsonMessage.username == document.getElementById('loggedInAs').innerText) {
            console.log(new Date(jsonMessage.timestamp));
            document.getElementById('chats').innerHTML = `<li class="clearfix">
            <div class="message-data">
                <span class="message-data-time">Me, ${new Date(jsonMessage.timestamp).toTimeString().substring(0, 17)}</span>
            </div>
            <div class="message my-message">${jsonMessage.message}</div>
            </li>`
                + document.getElementById('chats').innerHTML;
        } else if (jsonMessage.message && jsonMessage.username) {
            document.getElementById('chats').innerHTML = `<li class="clearfix">
            <div class="message-data d-flex justify-content-end">
                <span class="message-data-time">${jsonMessage.username}, 10:18</span>
            </div>
            <div class="message other-message float-right">${jsonMessage.message}</div>
            </li>`
                + document.getElementById('chats').innerHTML;
        }
    };

    ws.onclose = function () {
        document.getElementById('status').innerText = 'Disconnected';
        document.getElementById('status').style.color = 'red';
    };
});
