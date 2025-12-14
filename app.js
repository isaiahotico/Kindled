// Firebase config (replace with your Firebase project info)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// DOM elements
const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const emojiBtn = document.getElementById('emojiBtn');

// Send message
sendBtn.addEventListener('click', () => {
  const msg = messageInput.value.trim();
  if(msg){
    const messageData = { text: msg, type: 'user', timestamp: Date.now() };
    db.ref('messages').push(messageData);
    messageInput.value = '';
  }
});

// Emoji picker (simple)
emojiBtn.addEventListener('click', () => {
  messageInput.value += '😀';
  messageInput.focus();
});

// Listen for new messages
db.ref('messages').on('child_added', snapshot => {
  const msg = snapshot.val();
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', msg.type);
  msgDiv.innerText = msg.text;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
});
