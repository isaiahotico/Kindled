import { db } from "../firebase/config.js";
import { ref, push } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const tgId = localStorage.getItem("tgId");

document.getElementById("req").onclick=()=>{
  push(ref(db,"withdrawals"),{
    user:tgId,
    amount:document.getElementById("amt").value,
    method:document.getElementById("method").value,
    status:"pending"
  });
  alert("Submitted");
};
