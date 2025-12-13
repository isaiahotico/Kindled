import { db } from "../firebase/config.js";
import { ref, push, onChildAdded } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const chatRef = ref(db,"chat");
const box = document.getElementById("messages");

onChildAdded(chatRef,s=>{
  box.innerHTML += `<p>${s.val().text}</p>`;
});

document.getElementById("send").onclick=()=>{
  push(chatRef,{text:document.getElementById("msg").value});
};
