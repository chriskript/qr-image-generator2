document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("qrForm");
    const urlInput = document.getElementById("urlInput");
    const qrCodeDiv = document.getElementById("qrCode");

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

    // Mode toggle functionality
    urlModeBtn.addEventListener("click", () => {
      urlFormContainer.classList.remove("hidden");
      vcardFormContainer.classList.add("hidden");
      urlModeBtn.classList.add("active");
      urlModeBtn.classList.remove("grey");
      vcardModeBtn.classList.remove("active");
      vcardModeBtn.classList.add("grey");
      qrCodeDiv.innerHTML = "";
    });

    vcardModeBtn.addEventListener("click", () => {
      urlFormContainer.classList.add("hidden");
      vcardFormContainer.classList.remove("hidden");
      vcardModeBtn.classList.add("active");
      vcardModeBtn.classList.remove("grey");
      urlModeBtn.classList.remove("active");
      urlModeBtn.classList.add("grey");
      qrCodeDiv.innerHTML = "";
    });

    // URL QR Code generation
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
        alert("Please enter at least one contact field (name, phone, or email).");
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
        const response = await fetch(`/generate-vcard-qr?${params.toString()}`);
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
        alert("Please enter at least one contact field (name, phone, or email).");
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
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const vcardBlob = await response.blob();
        const vcardUrl = URL.createObjectURL(vcardBlob);

        const link = document.createElement("a");
        link.href = vcardUrl;
        link.download = `${firstName || "contact"}_${lastName || "vcard"}.vcf`.replace(/\s+/g, "_");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(vcardUrl);
      } catch (error) {
        console.error("Error downloading vCard:", error);
        alert("An error occurred while downloading the vCard. Please try again.");
      }
    });
  });
  