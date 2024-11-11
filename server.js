const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const CharacterAI = require("node_characterai");
const fs = require("fs");
const PlayHT = require("playht");
const path = require("path");
const cors = require("cors"); // Import cors

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const characterAI = new CharacterAI();

// Initialize PlayHT API with your credentials
PlayHT.init({
  apiKey: 'YOUR_API_KEY',
  userId: 'YOUR_USER_ID',
});

// Configure streaming options
const streamingOptions = {
  voiceEngine: 'PlayHT2.0-turbo',
  voiceId: 'YOUR_VOICE_ID',
  sampleRate: 44100,
  outputFormat: 'mp3',
  speed: 0.8,
};

// Enable CORS for all domains (you can restrict this to specific domains later)
app.use(cors());  // Add this line to enable CORS for all origins

// Serve static files
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

(async () => {
  try {
    await characterAI.authenticateWithToken("YOUR_TOKEN");

    const characterId = "YOUR_CHARACTER_ID";
    const chat = await characterAI.createOrContinueChat(characterId);

    io.on("connection", (socket) => {
      console.log("a user connected");

      socket.on("message", async (msg) => {
        try {
          const response = await chat.sendAndAwaitResponse(msg, true);
          socket.emit("response", response.text);
        } catch (error) {
          console.error("Error in sending message:", error);
          socket.emit("response", "An error occurred while processing your message.");
        }
      });

      socket.on("generateAudio", async (text) => {
        try {
          const stream = await PlayHT.stream(text, streamingOptions);

          // Save MP3 file to public folder
          const filePath = `public/output_${Date.now()}.mp3`;
          const fileStream = fs.createWriteStream(filePath);

          stream.on('data', (chunk) => {
            fileStream.write(chunk);
          });

          stream.on('end', () => {
            fileStream.end();
            console.log(`MP3 file saved as ${filePath}`);
            socket.emit("audio", filePath.replace("public/", ""));
          });

          stream.on('error', (error) => {
            console.error('Error while writing to file:', error);
            socket.emit("audio", { error: true, message: "An error occurred while generating the audio." });
          });

        } catch (audioError) {
          console.error("Error in generating audio:", audioError);
          socket.emit("audio", { error: true, message: "An error occurred while generating the audio." });
        }
      });

      socket.on("disconnect", () => {
        console.log("user disconnected");
      });
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error in initialization:", error);
  }
})();
