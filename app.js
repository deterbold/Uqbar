const express = require("express");
const multer = require("multer");
const { OpenAI } = require("openai");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const port = 3000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

// Setup multer for file handling
const storage = multer.memoryStorage(); // Use memory storage to handle file as buffer
const upload = multer({ storage: storage });

// Serve static files
app.use(express.static("public"));

// Route to handle file upload and OpenAI API request
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    // Create a unique folder for each session
    const folderPath = createUniqueFolder();
    // Convert the uploaded image buffer to a Base64 string
    const base64Image = req.file.buffer.toString("base64");
    const timestamp = new Date().toISOString();

    const modelSelection = req.body.model; // Get the model selection from the request

    fs.writeFileSync(
      path.join(folderPath, `webcam_${timestamp}.jpeg`),
      req.file.buffer
    );

    // Set model and max_tokens based on the selection
    const model = modelSelection === "dall-e-2" ? "dall-e-2" : "dall-e-3";
    console.log(model);
    const maxTokens = modelSelection === "dall-e-2" ? 200 : 300;

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
      max_tokens: maxTokens,
    });
    console.log(response.choices[0].message.content);
    const description = response.choices[0].message.content;

    const imageResponse = await openai.images.generate({
      model: model,
      prompt: description,
      n: 1,
      size: "1024x1024",
    });

    // Extract the URL of the generated image
    console.log(imageResponse.data[0].revised_prompt);
    const revisedPrompt = imageResponse.data[0].revised_prompt;
    console.log(imageResponse.data[0].url);
    const imageUrl = imageResponse.data[0].url;

    // After receiving the image URL from OpenAI, save the generated image
    const imageResponseBuffer = await fetch(imageUrl).then((res) =>
      res.buffer()
    );
    fs.writeFileSync(
      path.join(folderPath, `generated_${timestamp}.jpeg`),
      imageResponseBuffer
    );

    const generatedImageFilename = `generated_${timestamp}.jpeg`;
    const webcamImageFilename = `webcam_${timestamp}.jpeg`;

    // Create JSON file with the required data
    const jsonData = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      model: model,
      imageDescription: description, // Assuming this comes from your OpenAI API interaction
      generatedImageFilename: generatedImageFilename,
      webcamImageFilename: webcamImageFilename,
    };
    // Include revisedPrompt in JSON data if it's not undefined
    if (revisedPrompt !== undefined) {
      jsonData.revisedPrompt = revisedPrompt;
    }
    fs.writeFileSync(
      path.join(folderPath, "data.json"),
      JSON.stringify(jsonData, null, 2)
    );

    // Send the URL of the generated image and the description back to the client
    res.json({ imageUrl, description: description, revisedPrompt }); // Include the description in the response
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

//SAVING DATA FUNCTIONS
// Utility function to create a unique folder for each session
function createUniqueFolder() {
  const date = new Date();
  const folderName = `Echo_${date.toISOString().replace(/:/g, "-")}`;
  const dir = path.join(__dirname, "uploads", folderName);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return dir;
}
