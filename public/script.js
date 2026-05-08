document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const form = document.getElementById("qrForm");
    const urlInput = document.getElementById("urlInput");
    const qrCodeDiv = document.getElementById("qrCode");
    const resultCard = document.getElementById("resultCard");
    const loadingState = document.getElementById("loadingState");
    const downloadQrBtn = document.getElementById("downloadQrBtn");
    const modalOverlay = document.getElementById("modalOverlay");
    const modalMessage = document.getElementById("modalMessage");
    const modalInstruction = document.getElementById("modalInstruction");
    const modalCloseBtn = document.getElementById("modalCloseBtn");

    // Mode toggle elements
    const urlModeBtn = document.getElementById("urlModeBtn");
    const vcardModeBtn = document.getElementById("vcardModeBtn");
    const urlFormContainer = document.getElementById("urlFormContainer");
    const vcardFormContainer = document.getElementById("vcardFormContainer");

    // vCard form elements
    const vcardForm = document.getElementById("vcardForm");
    const firstNameInput = document.getElementById("firstName");
    const lastNameInput = document.getElementById("lastName");
    const phoneInput = document.getElementById("phone");
    const emailInput = document.getElementById("email");
    const organizationInput = document.getElementById("organization");
    const titleInput = document.getElementById("title");
    const websiteInput = document.getElementById("website");
    const addressInput = document.getElementById("address");
    const downloadVCardBtn = document.getElementById("downloadVCardBtn");

    let currentQrBlob = null;

    // Modal popup notification
    function showModal(message, instruction = "") {
      modalMessage.textContent = message;
      modalInstruction.textContent = instruction;
      modalOverlay.classList.remove("hidden");
    }

    // Close modal when clicking button or overlay
    modalCloseBtn.addEventListener("click", () => {
      modalOverlay.classList.add("hidden");
    });

    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.add("hidden");
      }
    });

    // Set loading state
    function setLoading(isLoading, btn) {
      const btnText = btn.querySelector(".btn-text");
      const spinner = btn.querySelector(".spinner");

      if (isLoading) {
        btn.disabled = true;
        btnText.classList.add("hidden");
        spinner.classList.remove("hidden");
        loadingState.classList.remove("hidden");
        qrCodeDiv.classList.add("hidden");
      } else {
        btn.disabled = false;
        btnText.classList.remove("hidden");
        spinner.classList.add("hidden");
        loadingState.classList.add("hidden");
        qrCodeDiv.classList.remove("hidden");
      }
    }

    // Show result card
    function showResult() {
      resultCard.classList.remove("hidden");
      resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    // Hide result card
    function hideResult() {
      resultCard.classList.add("hidden");
      qrCodeDiv.innerHTML = "";
      currentQrBlob = null;
      downloadQrBtn.disabled = true;
    }

    // Mode toggle functionality
    urlModeBtn.addEventListener("click", () => {
      urlFormContainer.classList.remove("hidden");
      vcardFormContainer.classList.add("hidden");
      urlModeBtn.classList.add("active");
      vcardModeBtn.classList.remove("active");
      hideResult();
    });

    vcardModeBtn.addEventListener("click", () => {
      urlFormContainer.classList.add("hidden");
      vcardFormContainer.classList.remove("hidden");
      vcardModeBtn.classList.add("active");
      urlModeBtn.classList.remove("active");
      hideResult();
    });

    // URL QR Code generation
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const url = urlInput.value.trim();

      if (!url) {
        showModal("Please enter a valid URL");
        urlInput.focus();
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      setLoading(true, submitBtn);
      showResult();

      try {
        const response = await fetch(`/generate?q=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error("Network response was not ok");

        currentQrBlob = await response.blob();
        const qrUrl = URL.createObjectURL(currentQrBlob);
        qrCodeDiv.innerHTML = `<img src="${qrUrl}" alt="QR Code" id="generatedQr">`;
        downloadQrBtn.disabled = false;
        showModal("QR code generated successfully!", "Download the image and share it anywhere. Others can scan it with their phone camera.");
        if (window.umami) umami.track('generate_url_qr', { url: url });
      } catch (error) {
        console.error("Error generating QR code:", error);
        showModal("Failed to generate QR code", "Please check your internet connection and try again.");
        hideResult();
        if (window.umami) umami.track('generate_url_qr_error');
      } finally {
        setLoading(false, submitBtn);
      }
    });

    // vCard QR Code generation
    vcardForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const firstName = firstNameInput.value.trim();
      const lastName = lastNameInput.value.trim();
      const phone = phoneInput.value.trim();
      const email = emailInput.value.trim();
      const organization = organizationInput.value.trim();
      const title = titleInput.value.trim();
      const website = websiteInput.value.trim();
      const address = addressInput.value.trim();

      if (!firstName && !lastName && !phone && !email) {
        showModal("Please enter at least one contact field");
        firstNameInput.focus();
        return;
      }

      const params = new URLSearchParams();
      if (firstName) params.append("firstName", firstName);
      if (lastName) params.append("lastName", lastName);
      if (phone) params.append("phone", phone);
      if (email) params.append("email", email);
      if (organization) params.append("organization", organization);
      if (title) params.append("title", title);
      if (website) params.append("website", website);
      if (address) params.append("address", address);

      const submitBtn = vcardForm.querySelector('button[type="submit"]');
      setLoading(true, submitBtn);
      showResult();

      try {
        const response = await fetch(`/generate-vcard-qr?${params.toString()}`);
        if (!response.ok) throw new Error("Network response was not ok");

        currentQrBlob = await response.blob();
        const qrUrl = URL.createObjectURL(currentQrBlob);
        qrCodeDiv.innerHTML = `<img src="${qrUrl}" alt="QR Code" id="generatedQr">`;
        downloadQrBtn.disabled = false;
        showModal("Contact QR code ready!", "Others can scan this QR code with their phone camera to instantly add your contact details.");
        if (window.umami) umami.track('generate_vcard_qr', { firstName, lastName });
      } catch (error) {
        console.error("Error generating QR code:", error);
        showModal("Failed to generate QR code", "Please check your internet connection and try again.");
        hideResult();
        if (window.umami) umami.track('generate_vcard_qr_error');
      } finally {
        setLoading(false, submitBtn);
      }
    });

    // Download vCard file
    downloadVCardBtn.addEventListener("click", async () => {
      const firstName = firstNameInput.value.trim();
      const lastName = lastNameInput.value.trim();
      const phone = phoneInput.value.trim();
      const email = emailInput.value.trim();
      const organization = organizationInput.value.trim();
      const title = titleInput.value.trim();
      const website = websiteInput.value.trim();
      const address = addressInput.value.trim();

      if (!firstName && !lastName && !phone && !email) {
        showModal("Please enter at least one contact field");
        firstNameInput.focus();
        return;
      }

      const params = new URLSearchParams();
      if (firstName) params.append("firstName", firstName);
      if (lastName) params.append("lastName", lastName);
      if (phone) params.append("phone", phone);
      if (email) params.append("email", email);
      if (organization) params.append("organization", organization);
      if (title) params.append("title", title);
      if (website) params.append("website", website);
      if (address) params.append("address", address);

      try {
        const response = await fetch(`/download-vcard?${params.toString()}`);
        if (!response.ok) throw new Error("Network response was not ok");

        const vcardBlob = await response.blob();
        const vcardUrl = URL.createObjectURL(vcardBlob);

        const link = document.createElement("a");
        link.href = vcardUrl;
        link.download = `${firstName || "contact"}_${lastName || "vcard"}.vcf`.replace(/\s+/g, "_");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(vcardUrl);
        showModal("vCard downloaded!", "Share the .vcf file via email, WhatsApp, or any messaging app. Recipients can tap to add you to their contacts.");
        if (window.umami) umami.track('download_vcard', { firstName, lastName });
      } catch (error) {
        console.error("Error downloading vCard:", error);
        showModal("Failed to download vCard", "Please check your internet connection and try again.");
        if (window.umami) umami.track('download_vcard_error');
      }
    });

    // Helper function to add branding to QR code
    async function addBrandingToQR(blob) {
      return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
          const padding = 20;
          const textHeight = 35;
          const canvas = document.createElement("canvas");
          canvas.width = img.width + padding * 2;
          canvas.height = img.height + padding * 2 + textHeight;
          const ctx = canvas.getContext("2d");

          // White background
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw QR code
          ctx.drawImage(img, padding, padding);

          // Add branding text
          ctx.fillStyle = "#64748b";
          ctx.font = "13px Inter, Arial, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("Powered by Oneskript · oneskript.com", canvas.width / 2, img.height + padding * 2 + 22);

          URL.revokeObjectURL(url);
          canvas.toBlob(resolve, "image/png");
        };
        img.src = url;
      });
    }

    // Download QR Code
    downloadQrBtn.addEventListener("click", async () => {
      if (!currentQrBlob) return;

      const brandedBlob = await addBrandingToQR(currentQrBlob);
      const url = URL.createObjectURL(brandedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "qr-code.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showModal("QR code saved!", "The image has been saved to your Downloads folder. Share it or print it for easy scanning.");
      if (window.umami) umami.track('download_qr_image');
    });

    // Clear result when switching modes
    urlModeBtn.addEventListener("click", hideResult);
    vcardModeBtn.addEventListener("click", hideResult);
  });
  