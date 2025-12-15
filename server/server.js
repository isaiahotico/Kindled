import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const YT_KEY = process.env.YT_API_KEY;

/* --- Video Stats --- */
app.get("/video-stats/:videoId", async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${YT_KEY}`;
    const r = await fetch(url);
    const data = await r.json();

    if(!data.items || !data.items[0]) return res.json({error:"Video not found"});
    const video = data.items[0];
    res.json({
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      description: video.snippet.description,
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount||0,
      commentCount: video.statistics.commentCount||0,
      thumbnail: video.snippet.thumbnails?.medium?.url||""
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({error:"Server error"});
  }
});

/* --- Watch-time validation --- */
const watchSessions = {}; // memory store

app.post("/watch/start", (req,res)=>{
  const {userId,videoId} = req.body;
  if(!watchSessions[userId]) watchSessions[userId]={};
  watchSessions[userId][videoId]=0;
  res.json({started:true});
});

app.post("/watch/validate",(req,res)=>{
  const {userId,videoId,watchedSeconds}=req.body;
  if(!watchSessions[userId]) watchSessions[userId]={};
  watchSessions[userId][videoId]=watchedSeconds;
  const validated = watchedSeconds>=60;
  res.json({validated});
});

/* --- Start Server --- */
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));
