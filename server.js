const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Настройка хранения файлов с помощью multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
   const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
    cb(null, originalName); // сохраняем с оригинальным именем
  }
});

const upload = multer({ storage: storage });

// Middleware для поддержки CORS
app.use(cors());
app.use('/uploads', express.static('uploads'));

// Endpoint для загрузки файла
app.post('/upload', upload.single('file'), (req, res) => {
  const comment = req.body.comment;
  console.log(`File uploaded: ${req.file.originalname} with comment: ${comment}`);
  res.sendStatus(200);
});

// Endpoint для получения списка загруженных файлов
app.get('/files', (req, res) => {
  const fs = require('fs');
  const files = fs.readdirSync(path.join(__dirname, 'uploads'));
  res.json(files);
});

// WebSocket для отслеживания прогресса
wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Слушаем на порту 3000
server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});