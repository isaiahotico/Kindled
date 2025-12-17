import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';

const app = express();
app.use(bodyParser.json());

const TELEGRAM_BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const TELEGRAM_ADMIN_CHAT_ID = 'YOUR_ADMIN_CHAT_ID';

// Endpoint to send Telegram notification
app.post('/notify', async (req, res) => {
  const { message } = req.body;
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_ADMIN_CHAT_ID,
      text: message
    });
    res.status(200).send({ success: true });
  } catch(e) {
    res.status(500).send({ success: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
