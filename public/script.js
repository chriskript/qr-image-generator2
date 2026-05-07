document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const form = document.getElementById("qrForm");
    const urlInput = document.getElementById("urlInput");
    const qrCodeDiv = document.getElementById("qrCode");
    const resultCard = document.getElementById("resultCard");
    const loadingState = document.getElementById("loadingState");
    const downloadQrBtn = document.getElementById("downloadQrBtn");
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");

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

    // Toast notification
    function showToast(message, duration = 3000) {
      toastMessage.textContent = message;
      toast.classList.remove("hidden");
      setTimeout(() => {
        toast.classList.add("hidden");
      }, duration);
    }

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
        showToast("Please enter a valid URL");
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
        showToast("QR code generated successfully!");
      } catch (error) {
        console.error("Error generating QR code:", error);
        showToast("Failed to generate QR code. Please try again.");
        hideResult();
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
        showToast("Please enter at least one contact field");
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
        showToast("Contact QR code generated successfully!");
      } catch (error) {
        console.error("Error generating QR code:", error);
        showToast("Failed to generate QR code. Please try again.");
        hideResult();
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
        showToast("Please enter at least one contact field");
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
        showToast("vCard downloaded successfully!");
      } catch (error) {
        console.error("Error downloading vCard:", error);
        showToast("Failed to download vCard. Please try again.");
      }
    });

    // Download QR Code
    downloadQrBtn.addEventListener("click", () => {
      if (!currentQrBlob) return;

      const url = URL.createObjectURL(currentQrBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "qr-code.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("QR code downloaded!");
    });

    // Clear result when switching modes
    urlModeBtn.addEventListener("click", hideResult);
    vcardModeBtn.addEventListener("click", hideResult);
  });
  