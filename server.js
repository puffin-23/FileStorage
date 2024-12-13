const express = require('express');
const http = require('http');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = 8580;

let dataFilesPath = './uploads/uploads.json';

const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      const totalSize = req.headers['content-length'];
      let uploadedSize = 0;
      req.on('data', (chunk) => {

         uploadedSize += chunk.length;
         const progress = Math.round((uploadedSize / totalSize) * 100)

         io.emit('uploadedProgress', progress);

      });

      req.on('end', () => {
         io.emit('uploadedProgress', 100);
      });

      cb(null, 'uploads/');

   },
   filename: (req, file, cb) => {
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
      cb(null, originalName); // сохраняем с оригинальным именем
   }
});

const upload = multer({ storage: storage })

app.use(cors());
app.use('/', express.static(path.join(__dirname)));

const readFileData = () => {
   if (fs.existsSync(dataFilesPath)) {
      const data = fs.readFileSync(dataFilesPath);
      return JSON.parse(data);
   }
   return [];
};

const writeFileData = (fileData) => {
   fs.writeFileSync(dataFilesPath, JSON.stringify(fileData, null, 2));
};

// Endpoint для загрузки файла
app.post('/upload', upload.single('file'), (req, res) => {

   const comment = req.body.comment;
   const fileInfo = {
      filename: req.file.originalname,
      path: req.file.path,
      comment: comment
   }

   const fileData = readFileData();
   fileData.push(fileInfo);
   writeFileData(fileData);

   res.send('Файл загружен с комментарием: ' + comment);

});

// Endpoint для получения списка загруженных файлов
app.get('/files', (req, res) => {
   const fileData = readFileData();
   res.send(fileData);
});


io.on('connection', (socket) => {
   console.log('Client connected');
})


server.listen(port, () => {
   console.log('Server is running on port', port);
})