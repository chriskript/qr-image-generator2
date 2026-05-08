document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const form = document.getElementById("qrForm");
    const urlInput = document.getElementById("urlInput");
    const qrCodeDiv = document.getElementById("qrCode");
    const resultCard = document.getElementById("resultCard");
    const loadingState = document.getElementById("loadingState");
    const downloadQrBtn = document.getElementById("downloadQrBtn");
    const copyQrBtn = document.getElementById("copyQrBtn");
    const printQrBtn = document.getElementById("printQrBtn");
    const modalOverlay = document.getElementById("modalOverlay");
    const modalMessage = document.getElementById("modalMessage");
    const modalInstruction = document.getElementById("modalInstruction");
    const modalCloseBtn = document.getElementById("modalCloseBtn");
    const liveRegion = document.getElementById("liveRegion");

    // Theme toggle elements
    const themeToggle = document.getElementById("themeToggle");
    const sunIcon = document.getElementById("sunIcon");
    const moonIcon = document.getElementById("moonIcon");

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
    const clearFormBtn = document.getElementById("clearFormBtn");

    // Profile photo elements
    const photoUpload = document.getElementById("photoUpload");
    const profilePhotoInput = document.getElementById("profilePhoto");
    const photoPreview = document.getElementById("photoPreview");
    const photoPreviewImg = document.getElementById("photoPreviewImg");
    const photoUploadText = document.getElementById("photoUploadText");
    const removePhotoBtn = document.getElementById("removePhotoBtn");

    let currentQrBlob = null;
    let lastFocusedElement = null;
    let currentPhotoBase64 = null;

    // Modal popup notification
    function showModal(message, instruction = "") {
      modalMessage.textContent = message;
      modalInstruction.textContent = instruction;
      modalOverlay.classList.remove("hidden");
    }

    // Close modal when clicking button or overlay
    modalCloseBtn.addEventListener("click", () => {
      modalOverlay.classList.add("hidden");
      // Return focus to last focused element
      if (lastFocusedElement) {
        lastFocusedElement.focus();
      }
    });

    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.add("hidden");
        if (lastFocusedElement) {
          lastFocusedElement.focus();
        }
      }
    });

    // Live region announcement for screen readers
    function announce(message) {
      if (liveRegion) {
        liveRegion.textContent = message;
        setTimeout(() => {
          liveRegion.textContent = '';
        }, 1000);
      }
    }

    // Validation helper functions
    function showFieldError(inputId, message) {
      const input = document.getElementById(inputId);
      const group = document.getElementById(inputId + 'Group');
      const errorEl = document.getElementById(inputId + 'Error');
      
      if (group) group.classList.add('has-error');
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
      }
      if (input) {
        input.setAttribute('aria-invalid', 'true');
      }
    }

    function clearFieldError(inputId) {
      const input = document.getElementById(inputId);
      const group = document.getElementById(inputId + 'Group');
      const errorEl = document.getElementById(inputId + 'Error');
      
      if (group) group.classList.remove('has-error');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
      }
      if (input) {
        input.setAttribute('aria-invalid', 'false');
      }
    }

    function validateUrl(value) {
      if (!value || value.trim() === '') {
        return { valid: false, message: 'Please enter a URL' };
      }
      try {
        const url = new URL(value.trim());
        if (!['http:', 'https:'].includes(url.protocol)) {
          return { valid: false, message: 'URL must start with http:// or https://' };
        }
        return { valid: true };
      } catch {
        return { valid: false, message: 'Please enter a valid URL (e.g., https://example.com)' };
      }
    }

    function validateEmail(value) {
      if (!value || value.trim() === '') return { valid: true };
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) {
        return { valid: false, message: 'Please enter a valid email address' };
      }
      return { valid: true };
    }

    function validatePhone(value) {
      if (!value || value.trim() === '') return { valid: true };
      const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;
      if (!phoneRegex.test(value.trim())) {
        return { valid: false, message: 'Phone number contains invalid characters' };
      }
      return { valid: true };
    }

    // Theme toggle functionality
    function initTheme() {
      const savedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
      
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
      }
    }

    function toggleTheme() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
        announce('Switched to light mode');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
        announce('Switched to dark mode');
      }
    }

    themeToggle.addEventListener('click', toggleTheme);
    initTheme();

    // Form auto-save functionality
    const FORM_STORAGE_KEY = 'vcardFormData';
    let saveTimeout;

    function saveFormData() {
      const formData = {
        firstName: firstNameInput.value,
        lastName: lastNameInput.value,
        phone: phoneInput.value,
        email: emailInput.value,
        organization: organizationInput.value,
        title: titleInput.value,
        website: websiteInput.value,
        address: addressInput.value
      };
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
    }

    function loadFormData() {
      const saved = localStorage.getItem(FORM_STORAGE_KEY);
      if (saved) {
        const formData = JSON.parse(saved);
        firstNameInput.value = formData.firstName || '';
        lastNameInput.value = formData.lastName || '';
        phoneInput.value = formData.phone || '';
        emailInput.value = formData.email || '';
        organizationInput.value = formData.organization || '';
        titleInput.value = formData.title || '';
        websiteInput.value = formData.website || '';
        addressInput.value = formData.address || '';
      }
    }

    function debouncedSave() {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveFormData, 500);
    }

    // Attach auto-save listeners
    [firstNameInput, lastNameInput, phoneInput, emailInput, organizationInput, titleInput, websiteInput, addressInput].forEach(input => {
      input.addEventListener('input', debouncedSave);
    });

    // Real-time validation listeners
    urlInput.addEventListener('blur', () => {
      const result = validateUrl(urlInput.value);
      if (!result.valid && urlInput.value.trim() !== '') {
        showFieldError('urlInput', result.message);
      } else {
        clearFieldError('urlInput');
      }
    });

    urlInput.addEventListener('input', () => {
      if (urlInput.value.trim() === '') {
        clearFieldError('urlInput');
      }
    });

    emailInput.addEventListener('blur', () => {
      const result = validateEmail(emailInput.value);
      if (!result.valid) {
        showFieldError('email', result.message);
      } else {
        clearFieldError('email');
      }
    });

    phoneInput.addEventListener('blur', () => {
      const result = validatePhone(phoneInput.value);
      if (!result.valid) {
        showFieldError('phone', result.message);
      } else {
        clearFieldError('phone');
      }
    });

    websiteInput.addEventListener('blur', () => {
      if (websiteInput.value.trim() === '') {
        clearFieldError('website');
        return;
      }
      const result = validateUrl(websiteInput.value);
      if (!result.valid) {
        showFieldError('website', result.message);
      } else {
        clearFieldError('website');
      }
    });

    loadFormData();

    // Clear form functionality
    clearFormBtn.addEventListener('click', () => {
      vcardForm.reset();
      localStorage.removeItem(FORM_STORAGE_KEY);
      removeProfilePhoto();
      // Clear all validation errors
      ['firstName', 'lastName', 'phone', 'email', 'organization', 'title', 'website', 'address'].forEach(clearFieldError);
      announce('Form cleared');
      firstNameInput.focus();
    });

    // Profile photo handling
    // Photo only goes to downloadable vCard (not QR code), so can be larger
    const MAX_PHOTO_SIZE = 500 * 1024; // 500KB limit for download vCard
    const PHOTO_DIMENSIONS = 400; // Max 400x400px for reasonable file size

    function optimizeImage(file) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = (e) => {
          img.src = e.target.result;
          img.onload = () => {
            // Calculate dimensions maintaining aspect ratio
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > PHOTO_DIMENSIONS) {
                height *= PHOTO_DIMENSIONS / width;
                width = PHOTO_DIMENSIONS;
              }
            } else {
              if (height > PHOTO_DIMENSIONS) {
                width *= PHOTO_DIMENSIONS / height;
                height = PHOTO_DIMENSIONS;
              }
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to base64 JPEG with quality adjustment
            let quality = 0.9;
            let base64 = canvas.toDataURL('image/jpeg', quality);
            
            // Reduce quality if too large
            while (base64.length > MAX_PHOTO_SIZE && quality > 0.1) {
              quality -= 0.1;
              base64 = canvas.toDataURL('image/jpeg', quality);
            }
            
            resolve(base64);
          };
          img.onerror = reject;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    async function handleProfilePhoto(file) {
      if (!file || !file.type.startsWith('image/')) {
        showModal('Please select a valid image file');
        return;
      }
      
      try {
        const base64 = await optimizeImage(file);
        
        if (base64.length > MAX_PHOTO_SIZE) {
          showModal('Photo too large', 'Cannot compress photo under 500KB. Try a smaller image or remove it.');
          return;
        }
        
        currentPhotoBase64 = base64;
        photoPreviewImg.src = base64;
        photoPreview.classList.remove('hidden');
        photoUpload.querySelector('.photo-upload-content').classList.add('hidden');
        announce('Profile photo added');
      } catch (error) {
        console.error('Error processing photo:', error);
        showModal('Failed to process photo', 'Please try a different image.');
      }
    }

    function removeProfilePhoto() {
      currentPhotoBase64 = null;
      photoPreviewImg.src = '';
      photoPreview.classList.add('hidden');
      photoUpload.querySelector('.photo-upload-content').classList.remove('hidden');
      profilePhotoInput.value = '';
    }

    photoUpload.addEventListener('click', () => profilePhotoInput.click());
    photoUpload.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        profilePhotoInput.click();
      }
    });
    
    profilePhotoInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleProfilePhoto(e.target.files[0]);
      }
    });

    // Drag and drop for photo
    photoUpload.addEventListener('dragover', (e) => {
      e.preventDefault();
      photoUpload.classList.add('drag-over');
    });

    photoUpload.addEventListener('dragleave', () => {
      photoUpload.classList.remove('drag-over');
    });

    photoUpload.addEventListener('drop', (e) => {
      e.preventDefault();
      photoUpload.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        handleProfilePhoto(e.dataTransfer.files[0]);
      }
    });

    removePhotoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeProfilePhoto();
      announce('Profile photo removed');
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

    // Enable/disable result action buttons
    function setResultButtonsEnabled(enabled) {
      downloadQrBtn.disabled = !enabled;
      copyQrBtn.disabled = !enabled;
      printQrBtn.disabled = !enabled;
    }

    // Hide result card
    function hideResult() {
      resultCard.classList.add("hidden");
      qrCodeDiv.innerHTML = "";
      currentQrBlob = null;
      setResultButtonsEnabled(false);
    }

    // Mode toggle functionality
    urlModeBtn.addEventListener("click", () => {
      urlFormContainer.classList.remove("hidden");
      vcardFormContainer.classList.add("hidden");
      urlModeBtn.classList.add("active");
      urlModeBtn.setAttribute("aria-pressed", "true");
      vcardModeBtn.classList.remove("active");
      vcardModeBtn.setAttribute("aria-pressed", "false");
      hideResult();
      clearFieldError('urlInput');
    });

    vcardModeBtn.addEventListener("click", () => {
      urlFormContainer.classList.add("hidden");
      vcardFormContainer.classList.remove("hidden");
      vcardModeBtn.classList.add("active");
      vcardModeBtn.setAttribute("aria-pressed", "true");
      urlModeBtn.classList.remove("active");
      urlModeBtn.setAttribute("aria-pressed", "false");
      hideResult();
      // Clear vCard validation errors
      ['firstName', 'lastName', 'phone', 'email', 'website'].forEach(clearFieldError);
    });

    // URL QR Code generation
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const url = urlInput.value.trim();
      const validation = validateUrl(url);

      // Clear previous errors
      clearFieldError('urlInput');

      if (!validation.valid) {
        showFieldError('urlInput', validation.message);
        urlInput.focus();
        announce('Please fix the URL error');
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
        // Security: Use createElement instead of innerHTML
        const img = document.createElement("img");
        img.src = qrUrl;
        img.alt = "QR Code";
        img.id = "generatedQr";
        qrCodeDiv.innerHTML = "";
        qrCodeDiv.appendChild(img);
        setResultButtonsEnabled(true);
        lastFocusedElement = submitBtn;
        showModal("QR code generated successfully!", "Download the image and share it anywhere. Others can scan it with their phone camera.");
        announce('QR code generated successfully');
        if (window.umami) umami.track('generate_url_qr', { url: url });
      } catch (error) {
        console.error("Error generating QR code:", error);
        let errorMessage = "Failed to generate QR code";
        let errorInstruction = "Please check your internet connection and try again.";
        
        if (error.message && error.message.includes('fetch')) {
          errorInstruction = "Network error. Please check your connection.";
        } else if (error.message && error.message.includes('429')) {
          errorMessage = "Too many requests";
          errorInstruction = "Please wait a moment before trying again.";
        }
        
        showModal(errorMessage, errorInstruction);
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

      // Clear previous errors
      clearFieldError('email');
      clearFieldError('phone');
      clearFieldError('website');

      // Validate at least one field is filled
      if (!firstName && !lastName && !phone && !email) {
        showFieldError('firstName', 'Please enter at least one contact field');
        showFieldError('lastName', 'Please enter at least one contact field');
        showFieldError('phone', 'Please enter at least one contact field');
        showFieldError('email', 'Please enter at least one contact field');
        firstNameInput.focus();
        announce('Please fill in at least one contact field');
        return;
      }

      // Validate individual fields
      let hasErrors = false;

      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        showFieldError('email', emailValidation.message);
        hasErrors = true;
      }

      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.valid) {
        showFieldError('phone', phoneValidation.message);
        hasErrors = true;
      }

      if (website) {
        const websiteValidation = validateUrl(website);
        if (!websiteValidation.valid) {
          showFieldError('website', websiteValidation.message);
          hasErrors = true;
        }
      }

      if (hasErrors) {
        announce('Please fix the validation errors');
        return;
      }

      const submitBtn = vcardForm.querySelector('button[type="submit"]');
      setLoading(true, submitBtn);
      showResult();

      try {
        // Security: Use POST to keep contact data out of URL history and server logs
        const response = await fetch('/generate-vcard-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName, lastName, phone, email, organization, title, website, address, photo: currentPhotoBase64 })
        });
        
        if (!response.ok) {
          // Get detailed error from response
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }

        currentQrBlob = await response.blob();
        const qrUrl = URL.createObjectURL(currentQrBlob);
        // Security: Use createElement instead of innerHTML
        const img = document.createElement("img");
        img.src = qrUrl;
        img.alt = "QR Code";
        img.id = "generatedQr";
        qrCodeDiv.innerHTML = "";
        qrCodeDiv.appendChild(img);
        setResultButtonsEnabled(true);
        lastFocusedElement = submitBtn;
        showModal("Contact QR code ready!", "Others can scan this QR code with their phone camera to instantly add your contact details.");
        announce('Contact QR code generated successfully');
        if (window.umami) umami.track('generate_vcard_qr', { firstName, lastName });
      } catch (error) {
        console.error("Error generating QR code:", error);
        let errorMessage = "Failed to generate QR code";
        let errorInstruction = "Please check your internet connection and try again.";
        
        // Check for specific HTTP status codes in error message
        if (error.message) {
          if (error.message.includes('HTTP 429')) {
            errorMessage = "Too many requests";
            errorInstruction = "Please wait a moment before trying again.";
          } else if (error.message.includes('HTTP 413') || error.message.includes('Payload Too Large')) {
            errorMessage = "Photo too large";
            errorInstruction = "The photo exceeds the 500KB limit. Try a smaller image or remove it.";
          } else if (error.message.includes('HTTP 400')) {
            errorMessage = "Invalid input";
            errorInstruction = "Please check your contact details and try again.";
          } else if (error.message.includes('HTTP 500')) {
            errorMessage = "Server error";
            errorInstruction = "Something went wrong on our end. Please try again later.";
          } else if (error.message.includes('fetch') || error.message.includes('network')) {
            errorInstruction = "Network error. Please check your connection.";
          }
        }
        
        showModal(errorMessage, errorInstruction);
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

      try {
        // Security: Use POST to keep contact data out of URL history and server logs
        const response = await fetch('/download-vcard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName, lastName, phone, email, organization, title, website, address, photo: currentPhotoBase64 })
        });
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

    // Copy QR Code to clipboard
    copyQrBtn.addEventListener("click", async () => {
      if (!currentQrBlob) return;
      
      try {
        const brandedBlob = await addBrandingToQR(currentQrBlob);
        
        // Try using Clipboard API with image
        if (navigator.clipboard && navigator.clipboard.write) {
          const item = new ClipboardItem({ "image/png": brandedBlob });
          await navigator.clipboard.write([item]);
          showModal("Copied to clipboard!", "The QR code image has been copied. Paste it into documents, emails, or messages.");
          announce('QR code copied to clipboard');
          if (window.umami) umami.track('copy_qr_image');
        } else {
          // Fallback: show modal with instructions
          showModal("Copy not supported", "Your browser doesn't support copying images. Please download the QR code instead.");
        }
      } catch (error) {
        console.error("Error copying QR code:", error);
        showModal("Failed to copy", "Please try downloading the QR code instead.");
      }
    });

    // Print QR Code
    printQrBtn.addEventListener("click", () => {
      if (!currentQrBlob) return;
      window.print();
      if (window.umami) umami.track('print_qr_image');
    });

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

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Enter to generate
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        // Submit the currently visible form
        if (!urlFormContainer.classList.contains('hidden')) {
          form.dispatchEvent(new Event('submit'));
        } else {
          vcardForm.dispatchEvent(new Event('submit'));
        }
      }
      
      // Escape to close modal
      if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
        modalOverlay.classList.add('hidden');
        if (lastFocusedElement) {
          lastFocusedElement.focus();
        }
      }
    });

    // Focus trap for modal
    function trapFocus(element) {
      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      element.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      });
    }

    trapFocus(modalOverlay);

    // Clear result when switching modes
    urlModeBtn.addEventListener("click", hideResult);
    vcardModeBtn.addEventListener("click", hideResult);
  });
  