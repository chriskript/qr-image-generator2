document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("qrForm");
    const urlInput = document.getElementById("urlInput");
    const qrCodeDiv = document.getElementById("qrCode");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const url = urlInput.value.trim();
  
      if (!url) {
        alert("Please enter a valid URL.");
        return;
      }
  
      try {
        const response = await fetch(`/generate?q=${encodeURIComponent(url)}`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const qrBlob = await response.blob();
        const qrUrl = URL.createObjectURL(qrBlob);
        qrCodeDiv.innerHTML = `<img src="${qrUrl}" alt="QR Code">`;
      } catch (error) {
        console.error("Error generating QR code:", error);
        alert("An error occurred while generating the QR code. Please try again.");
      }
    });
  });
  