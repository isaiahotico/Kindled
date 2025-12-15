import express from "express";
import cors from "cors";
import { Low, JSONFile } from "lowdb";

const app = express();
app.use(express.json());
app.use(cors());

const adapter = new JSONFile("db.json");
const db = new Low(adapter);

await db.read();
db.data ||= { users: {}, videos: {}, withdrawals: [] };

// Add Video
app.post("/add-video", async (req, res) => {
  const { userId, videoId, title } = req.body;
  if (!db.data.users[userId]) db.data.users[userId] = { videos: [], wallet: 0 };
  if (db.data.users[userId].videos.length >= 5) return res.json({ success: false, message: "Max 5 videos" });

  db.data.users[userId].videos.push({ videoId, title });
  db.data.videos[videoId] = { userId, title };
  await db.write();
  res.json({ success: true, videos: db.data.users[userId].videos });
});

// Get user videos
app.get("/user-videos/:userId", async (req, res) => {
  await db.read();
  res.json(db.data.users[req.params.userId]?.videos || {});
});

// Get all videos
app.get("/all-videos", async (req, res) => {
  await db.read();
  res.json(Object.entries(db.data.videos).map(([videoId, info]) => ({ videoId, title: info.title, userId: info.userId })));
});

// Watch validation
app.post("/watch/validate", async (req,res)=>{
  const {userId, videoId, watchedSeconds}=req.body;
  await db.read();
  if (watchedSeconds>=60){
    if (!db.data.users[userId]) db.data.users[userId]={videos:[],wallet:0};
    db.data.users[userId].wallet = (db.data.users[userId].wallet||0)+1.5;
    await db.write();
    return res.json({validated:true,wallet:db.data.users[userId].wallet});
  }
  res.json({validated:false,wallet:db.data.users[userId]?.wallet||0});
});

// Withdraw
app.post("/withdraw", async (req,res)=>{
  const {userId,gcashNumber,amount}=req.body;
  await db.read();
  if(!db.data.users[userId]||db.data.users[userId].wallet<amount) return res.json({success:false,message:"Insufficient wallet"});
  const id = Date.now();
  db.data.withdrawals.push({id,userId,gcashNumber,amount,status:"Pending",date:new Date().toISOString()});
  db.data.users[userId].wallet-=amount;
  await db.write();
  res.json({success:true});
});

// User withdraw history
app.get("/withdrawals/:userId", async(req,res)=>{
  await db.read();
  res.json(db.data.withdrawals.filter(w=>w.userId===req.params.userId));
});

// Owner withdrawals
app.get("/owner/withdrawals", async(req,res)=>{
  await db.read();
  res.json(db.data.withdrawals);
});

// Owner process withdrawal
app.post("/owner/process", async(req,res)=>{
  const {id,status}=req.body;
  await db.read();
  const wd=db.data.withdrawals.find(w=>w.id===id);
  if(!wd) return res.json({success:false});
  wd.status=status;
  await db.write();
  res.json({success:true});
});

app.listen(3000,()=>console.log("Server running on port 3000"));
