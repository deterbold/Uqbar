const express = require("express");
const multer = require("multer");
const { OpenAI } = require("openai");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});
console.log(process.env.OPENAI_KEY);

// Setup multer for file handling
const storage = multer.memoryStorage(); // Use memory storage to handle file as buffer
const upload = multer({ storage: storage });

// Serve static files
app.use(express.static("public"));

// Route to handle file upload and OpenAI API request
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    // Convert the uploaded image buffer to a Base64 string
    const base64Image = req.file.buffer.toString("base64");

    // Prepare the payload for the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What’s in this image?" },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });
    //console.log(response);
    console.log(response.choices[0].message.content);
    const description = response.choices[0].message.content;

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: description,
      n: 1,
      size: "1024x1024",
    });

    // Extract the URL of the generated image
    //console.log(imageResponse);
    console.log(imageResponse.data[0].url);
    const imageUrl = imageResponse.data[0].url;
    // Send the URL of the generated image and the description back to the client
    res.json({ imageUrl, description: description }); // Include the description in the response
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
// app.listen(port, () => {
//   console.log(`Server listening at http://localhost:${port}`);
// });

app.listen(process.env.PORT || port, () => {
  console.log(
    `Server listening at http://localhost:${process.env.PORT || port}`
  );
});
