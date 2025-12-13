import { db } from "../firebase/config.js";
import { ref, onValue } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const table = document.getElementById("board");

onValue(ref(db, "users"), snap => {
  table.innerHTML = "";
  let users = [];

  snap.forEach(s => users.push(s.val()));
  users.sort((a,b)=> (b.coins||0)-(a.coins||0));

  users.slice(0,10).forEach((u,i)=>{
    table.innerHTML += `<tr><td>${i+1}</td><td>${u.coins}</td></tr>`;
  });
});
