document.addEventListener("DOMContentLoaded", function () {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const context = canvas.getContext("2d");
  const captureButton = document.getElementById("capture");
  let stream = null; // Variable to hold the stream reference

  // Access the webcam
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (mediaStream) {
        stream = mediaStream; // Store the stream reference
        video.srcObject = mediaStream;
      })
      .catch(function (error) {
        console.log("Error accessing the webcam", error);
      });
  }

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

  function displayImageAndDescription(imageUrl, description) {
    const imageElement = document.getElementById("generatedImage");
    const descriptionElement = document.getElementById("imageDescription");

    if (imageElement) {
      imageElement.src = imageUrl;
      imageElement.onload = function () {
        // Ensure the image is loaded before displaying and setting widths
        imageElement.style.display = "block"; // Show the image

        // Set the description textarea width to match the image width
        if (descriptionElement) {
          descriptionElement.value = description; // Set the description text
          descriptionElement.style.display = "block"; // Show the textarea
          adjustTextAreaHeight(descriptionElement); // Adjust the height if you have this function
        }
      };
    }
  }

  // Capture button event listener
  captureButton.addEventListener("click", function () {
    // Show the loading animation
    document.getElementById("loadingAnimation").style.display = "flex";

    captureButton.style.display = "none";
    video.style.display = "none"; // Hide the video element

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Draw the video frame to the canvas
    canvas.toBlob(function (blob) {
      const formData = new FormData();
      formData.append("image", blob); // Append the image blob to the form data

      // Send the image to the server
      fetch("/upload", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          displayImageAndDescription(data.imageUrl, data.description); // Display the image and description
          stopCamera(); // Stop the camera after taking the picture
          //captureButton.style.display = "none"; // Hide the capture button

          // Hide the loading animation once the image is received
          document.getElementById("loadingAnimation").style.display = "none";
        })
        .catch((error) => {
          console.error("Error:", error);
          document.getElementById("loadingAnimation").style.display = "none";
        });
    }, "image/jpeg");
  });
});
