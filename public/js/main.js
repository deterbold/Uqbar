document.addEventListener("DOMContentLoaded", function () {
  const video = document.getElementById("video");
  video.setAttribute("autoplay", "");
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", ""); // Required to work on iOS Safari
  const canvas = document.getElementById("canvas");
  const context = canvas.getContext("2d");
  const captureButton = document.getElementById("capture");
  const uploadButton = document.getElementById("uploadButton");
  const modelButton = document.getElementById("modelButton");
  const uploadInput = document.getElementById("uploadImage");
  let stream = null; // Variable to hold the stream reference
  const mobileOnlyButton = document.getElementById("mobileOnlyButton");
  let facingMode = "user";
  let selectedModel = "dall-e-2"; // Default model is DALL·E 2

  // Access the webcam with the given facing mode
  function getCameraStream() {
    if (navigator.mediaDevices.getUserMedia) {
      const constraints = {
        video: { facingMode: facingMode },
      };

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (mediaStream) {
          stream = mediaStream; // Store the stream reference
          video.srcObject = mediaStream;
        })
        .catch(function (error) {
          console.log("Error accessing the webcam", error);
        });
    }
  }
  getCameraStream(); // Access the webcam

  // Function to stop the camera
  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  // Function to adjust the height of the textarea to fit its content
  function adjustTextAreaHeight(textArea) {
    textArea.style.height = "auto"; // Reset the height
    textArea.style.height = textArea.scrollHeight + "px"; // Set the height to fit the content
  }

  function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getRandomFloat(min, max, decimalPlaces) {
    const randomNumber = Math.random() * (max - min) + min;
    return randomNumber.toFixed(decimalPlaces);
  }

  function displayImageAndDescription(
    originalImageUrl,
    imageUrl,
    originalDescription,
    revisedDescription
  ) {
    const originalImageElement = document.getElementById("originalImage");
    const imageElement = document.getElementById("generatedImage");
    const reloadButton = document.getElementById("reloadButton");
    const originalPromptElement = document.getElementById("originalPrompt");
    const descriptionElement = document.getElementById("imageDescription");
    const impactElement = document.getElementById("environmentalImpact");
    const footerElement = document.getElementById("pageFooter");
    const sourcesElement = document.getElementById("sourcesElement");

    if (originalImageElement && imageElement) {
      originalImageElement.src = originalImageUrl;
      imageElement.src = imageUrl;
      imageElement.onload = function () {
        // Ensure the image is loaded before displaying and setting widths
        originalImageElement.style.display = "block"; // Show the original image
        if (originalPromptElement) {
          originalPromptElement.value = originalDescription; // Set the original prompt text
          originalPromptElement.style.display = "block"; // Show the textarea
          adjustTextAreaHeight(originalPromptElement); // Adjust the height
        }
        imageElement.style.display = "block"; // Show the image
        reloadButton.style.display = "block"; // Show the reload button when the image is displayed
        footerElement.style.display = "block";

        // Set the description textarea width to match the image width
        if (descriptionElement) {
          const rDescription = "Revised Prompt: " + revisedDescription;
          descriptionElement.value = rDescription; // Set the description text
          descriptionElement.style.display = "block"; // Show the textarea
          adjustTextAreaHeight(descriptionElement); // Adjust the height if you have this function
        }

        if (impactElement) {
          const randomWaterUsage = getRandomNumber(10, 50);
          const randomCO2 = getRandomFloat(4.0, 6.0, 2);
          impactElement.style.display = "block";
          impactElement.value = `For this interaction, ChatGPT has used approximately ${randomWaterUsage} ml of water (about half a espresso), and released approximately ${randomCO2}g of CO2 (a regular Google search uses around 0,2 g.).`;
          adjustTextAreaHeight(impactElement); // Adjust the height if you have this function
        }

        if (sourcesElement) {
          sourcesElement.style.display = "block";
        }
      };
      // Event listener for the reload button
      reloadButton.addEventListener("click", function () {
        // Reload the webpage
        location.reload();
      });
    }
  }

  function processImage(blob, originalImageUrl) {
    const formData = new FormData();
    formData.append("image", blob); // Append the image blob to the form data
    formData.append("model", selectedModel); // Add the model selection based on the model button text

    // Show the loading animation
    document.getElementById("loadingAnimation").style.display = "flex";

    // Send the image to the server
    fetch("/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        displayImageAndDescription(
          originalImageUrl,
          data.imageUrl,
          data.description,
          data.revisedPrompt
        ); // Display the image and description
        stopCamera(); // Stop the camera after taking the picture
        // Hide the loading animation once the image is received
        document.getElementById("loadingAnimation").style.display = "none";
      })
      .catch((error) => {
        console.error("Error:", error);
        document.getElementById("loadingAnimation").style.display = "none";
      });
  }

  // Capture button event listener
  captureButton.addEventListener("click", function () {
    // Hide the elements
    captureButton.style.display = "none";
    uploadButton.style.display = "none";
    modelButton.style.display = "none";
    mobileOnlyButton.style.display = "none";
    video.style.display = "none"; // Hide the video element

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const originalImageUrl = canvas.toDataURL("image/jpeg");

    canvas.toBlob(function (blob) {
      processImage(blob, originalImageUrl);
    }, "image/jpeg");
  });

  // Upload button event listener
  uploadButton.addEventListener("click", function () {
    uploadInput.click(); // Trigger the file input click
  });

  // Handle image upload
  uploadInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const originalImageUrl = e.target.result;

        // Show the loading animation
        document.getElementById("loadingAnimation").style.display = "flex";

        // Hide the buttons and stop the webcam
        captureButton.style.display = "none";
        uploadButton.style.display = "none";
        modelButton.style.display = "none";
        mobileOnlyButton.style.display = "none";
        stopCamera();
        video.style.display = "none"; // Hide the video element

        processImage(file, originalImageUrl);
      };
      reader.readAsDataURL(file);
    }
  });

  mobileOnlyButton.addEventListener("click", function () {
    facingMode = facingMode === "user" ? "environment" : "user";
    getCameraStream(); // Re-fetch the camera stream with the new facing mode
  });

  // Model button event listener
  modelButton.addEventListener("click", function () {
    if (selectedModel === "dall-e-2") {
      selectedModel = "dall-e-3";
      modelButton.textContent = "Model: DALL·E 3";
    } else {
      selectedModel = "dall-e-2";
      modelButton.textContent = "Model: DALL·E 2";
    }
  });

  // Function to detect a mobile device
  function isMobileDevice() {
    console.log("testing Mobile device");
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent
    );
  }
  if (isMobileDevice()) {
    console.log("mobile device");
    // If it's a mobile device, show the button
    mobileOnlyButton.style.display = "block"; // Or "inline-block", depending on your layout needs
  }
});
