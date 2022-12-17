const express = require('express');
const ws = require('ws');
const path = require('path');
const mysql = require('mysql');
const crypto = require('crypto');
const fs = require('fs');
const https = require('https');

let app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = new https.createServer({key: fs.readFileSync("key.pem"), cert:fs.readFileSync("cert.pem")}, app);

//DB connection
let connection = mysql.createConnection({
    host: 'eksamendisdb-do-user-13059227-0.b.db.ondigitalocean.com',
    port: '25060',
    user: 'doadmin',
    password: 'AVNS_j7ZwIAjXh5v2kLvi1-P',
    database: 'chatapp',
    ssl: {
        ca: fs.readFileSync(path.join(__dirname, 'ca-certificate.crt'))
    }
});

connection.connect();

//API
app.post('/api/register', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    connection.query(`SELECT * FROM users WHERE username = '${username}'`, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send('Server error');
            return;
        }

        if (result.length > 0) {
            res.status(400).send('Username already exists');
            return;
        }

        let salt = crypto.randomBytes(16).toString('hex');
        connection.query(`INSERT INTO users (username, password, salt) VALUES ('${username}', '${crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')}', '${salt}')`, (err, result) => {
            if (err) {
                res.status(500).send('Server error');
                return;
            }

            res.status(200).send('User created');
        });
    });
});

app.post('/api/login', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    connection.query(`SELECT * FROM users WHERE username = '${username}'`, (err, result) => {
        if (err) {
            res.status(500).send('Server error');
            return;
        }

        if (result.length === 0) {
            res.status(400).send('Username is incorrect');
            return;
        }

        let hash = crypto.pbkdf2Sync(password, result[0].salt, 1000, 64, 'sha512').toString('hex');
        if (hash !== result[0].password) {
            res.status(400).send('Password is incorrect');
            return;
        }

        let token = crypto.randomBytes(16).toString('hex');
        connection.query(`UPDATE users SET token = '${token}' WHERE username = '${username}'`, (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send('Server error');
                return;
            }

            res.status(200).send({ token: token });
        });
    });
});

app.post('/api/me', (req, res) => {
    let token = req.body.token;

    connection.query(`SELECT * FROM users WHERE token = '${token}'`, (err, result) => {
        if (err) {
            res.status(500).send('Server error');
            return;
        }

        if (result.length === 0) {
            res.status(400).send('Invalid token');
            return;
        }

        res.status(200).send({ username: result[0].username });
    });
});

//Web socket
let wss = new ws.Server({ server });
let authenicatedClients = [];
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        try {
            if (message) {
                let jsonMessage = JSON.parse(message);
                if (jsonMessage.token) {
                    connection.query(`SELECT * FROM users WHERE token = '${jsonMessage.token}'`, (err, result) => {
                        if (err) {
                            console.log(err);
                            return;
                        }

                        if (result.length === 0) {
                            ws.close();
                            return;
                        }

                        authenicatedClients.push({ username: result[0].username, ws: ws });
                        ws.send(JSON.stringify({ status: 'connected' }));
                    });
                }

                let authenicatedClient = authenicatedClients.find((client) => client.ws === ws);
                if (authenicatedClient && jsonMessage.message) {
                    authenicatedClients.forEach((client) => {
                        client.ws.send(JSON.stringify({ username: authenicatedClient.username, timestamp: new Date(), message: jsonMessage.message }));
                    });
                }
            }
        } catch (error) {
            console.log("Not valid json message");
        }
    });

    ws.on('close', () => {
        authenicatedClients = authenicatedClients.filter((client) => client !== ws);
    });
});

app.use(express.static(path.join(__dirname, 'public')));

server.listen(443, () => {
    console.log('Server is now running');
});
