let socket; // WebSocket connection for real-time communication
let currentUser = '';

document.addEventListener('DOMContentLoaded', (event) => {
    fetchUsers(); // Fetch the list of users from the server
});

function toggleForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
    registerForm.style.display = registerForm.style.display === 'none' ? 'block' : 'none';
}

// Handles user login
async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    // Send login credentials to the server
    const response = await fetch('http://localhost:3030/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    // Handle login success or failure
    if (result === "Login successful") {
        currentUser = username;
        document.getElementById('current-user').textContent = username;
        showChat();
        connectWebSocket();
    } else {
        alert(result);
    }
}

// Handles user registration
async function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    const response = await fetch('http://localhost:3030/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (result === 'Registration successful') {
        alert('Акаунт створено, можете входити в акаунт!');
        toggleForm();
    } else {
        alert(result);
    }
}

// Displays the chat interface and hides the login/register forms
function showChat() {
    document.getElementById('login-register').style.display = 'none';
    document.getElementById('chat-container').style.display = 'flex';
    fetchUsers();
}


// Fetches the list of users from the server
function fetchUsers() {
    fetch('http://localhost:3030/users')
        .then(response => response.json())
        .then(users => {
            const usersList = document.getElementById('users');
            usersList.innerHTML = '';
            users.forEach(user => {
                if(user !== currentUser){
                    const userItem = document.createElement('li');
                    userItem.textContent = user;
                    userItem.onclick = () => selectUser(user);
                    usersList.appendChild(userItem);
                }
            });
        });
}

// Fetches the chat history between the current user and the selected user
async function fetchChatHistory(userFrom, userTo) {
    try {
        const url = new URL('http://localhost:3030/history');
        const params = { user_from: userFrom, user_to: userTo };

        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            const messages = await response.json();
            displayChatHistory(messages);
        } else {
            console.error('Failed to fetch chat history');
        }
    } catch (error) {
        console.error('Error fetching chat history:', error);
    }
}

// Displays chat history in the chat window
function displayChatHistory(messages) {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';

    messages.forEach((message) => {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = `${message.sender}: ${message.message}`;
        messagesDiv.appendChild(messageDiv);
    });
}

function selectUser(user) {
    document.getElementById('chat-with').textContent = user;
    fetchChatHistory(currentUser, user);
}

// Establishes a WebSocket connection for real-time chat
function connectWebSocket() {
    const socketUrl = `ws://localhost:3030/chat`;
    socket = new WebSocket(socketUrl);
    console.log(encodeURIComponent(currentUser));
    socket.onopen = () => {
        console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if(message.sender === currentUser || message.receiver === currentUser)
            displayMessage(message);
    };

    socket.onclose = () => {
        console.log('WebSocket closed');
    };
}

// Displays a single message in the chat window
function displayMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.textContent = `${message.sender}: ${message.message}`;
    messagesDiv.appendChild(messageDiv);
}

function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value;

    if (message && socket.readyState === WebSocket.OPEN) {
        const messagePayload = {
            sender: currentUser,
            receiver: document.getElementById('chat-with').textContent,
            message
        };
        console.log(JSON.stringify(messagePayload));
        socket.send(JSON.stringify(messagePayload));
        messageInput.value = '';
    }
}