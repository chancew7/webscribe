// Check login status when page loads
document.addEventListener("DOMContentLoaded", () => {
    checkLoginStatus()
  })
  
  // Function to check and update login status
  function checkLoginStatus() {
    chrome.storage.sync.get(["userId", "userEmail"], (result) => {
      const statusDot = document.getElementById("statusDot")
      const statusText = document.getElementById("statusText")
      const userEmailElement = document.getElementById("userEmail")
      const avatarInitial = document.getElementById("avatarInitial")
  
      if (result.userId) {
        // User is logged in
        statusDot.classList.remove("offline")
        statusDot.classList.add("online")
        statusText.textContent = "Online"
  
        if (result.userEmail) {
          userEmailElement.textContent = result.userEmail
          // Set avatar initial to first letter of email
          avatarInitial.textContent = result.userEmail.charAt(0).toUpperCase()
        }
      } else {
        // User is not logged in
        statusDot.classList.remove("online")
        statusDot.classList.add("offline")
        statusText.textContent = "Offline"
        userEmailElement.textContent = "Not logged in"
        avatarInitial.textContent = "?"
      }
    })
  }
  
  // Show toast notification
  function showToast(message, duration = 3000) {
    const toast = document.getElementById("toast")
    const toastMessage = document.getElementById("toastMessage")
  
    toastMessage.textContent = message
    toast.classList.add("visible")
  
    setTimeout(() => {
      toast.classList.remove("visible")
    }, duration)
  }
  
  // Copy text to clipboard
  function copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast("Copied to clipboard!")
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
        showToast("Failed to copy to clipboard")
      })
  }
  
  // Login with Google
  document.getElementById("loginButton").addEventListener("click", () => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        console.error("Login failed:", chrome.runtime.lastError.message)
        showToast("Login failed: " + chrome.runtime.lastError.message)
      } else {
        console.log("Logged in successfully. Token:", token)
  
        // Fetch user information from Google's UserInfo endpoint
        fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Failed to fetch user info: ${response.statusText}`)
            }
            return response.json()
          })
          .then((userInfo) => {
            console.log("User Info:", userInfo)
  
            // Store userId and token in chrome.storage
            chrome.storage.sync.set(
              {
                userId: userInfo.sub, // Unique Google ID
                userEmail: userInfo.email, // Optional: user's email
                token: token, // Store the token for future use if needed
                isPremium: false, // Default value; update later if needed
              },
              () => {
                console.log("User information saved to chrome.storage.")
                checkLoginStatus() // Update the UI
                showToast("Logged in successfully!")
              },
            )
          })
          .catch((error) => {
            console.error("Error fetching user info:", error)
            showToast("Error fetching user info: " + error.message)
          })
      }
    })
  })
  
  // Logout
  document.getElementById("logoutButton").addEventListener("click", () => {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (token) {
        // 1. Revoke token on Google's servers
        fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
          .then(() => {
            // 2. Remove cached token locally
            chrome.identity.removeCachedAuthToken({ token }, () => {
              // 3. Clear stored user data
              chrome.storage.sync.remove(["userId", "userEmail", "token"], () => {
                console.log("Logged out fully.")
                checkLoginStatus() // Update the UI
                showToast("Logged out successfully!")
              })
            })
          })
          .catch((err) => {
            console.error("Error revoking token:", err)
            showToast("Error during logout: " + err.message)
          })
      } else {
        showToast("No active session to log out from")
      }
    })
  })
  
  // Get Collaboration Key
  document.getElementById("getCollaborationKeyButton").addEventListener("click", () => {
    const url = document.getElementById("urlInput").value.trim()
    if (!url) {
      showToast("Please enter a valid URL")
      return
    }
  
    // Retrieve userId from chrome.storage
    chrome.storage.sync.get("userId", (result) => {
      if (chrome.runtime.lastError || !result.userId) {
        console.error("Error retrieving userId:", chrome.runtime.lastError?.message || "No userId found.")
        showToast("Error: User not logged in")
        return
      }
  
      const userId = result.userId
  
      // Send message to the background script
      chrome.runtime.sendMessage({
        key: "get_markup_key",
        url: url,
        userId: userId,
      })
  
      showToast("Generating collaboration key...")
  
      // Update key type label
      document.getElementById("keyTypeLabel").textContent = "Collaboration Key"
    })
  })
  
  // Get Viewer Key
  document.getElementById("getViewerKeyButton").addEventListener("click", () => {
    const url = document.getElementById("urlInput").value.trim()
    if (!url) {
      showToast("Please enter a valid URL")
      return
    }
  
    chrome.storage.sync.get("userId", (result) => {
      if (chrome.runtime.lastError || !result.userId) {
        console.error("Error retrieving userId:", chrome.runtime.lastError?.message || "No userId found.")
        showToast("Error: User not logged in")
        return
      }
  
      const userId = result.userId
  
      // Send message to the background script
      chrome.runtime.sendMessage({
        key: "getViewerKey",
        url: url,
        userId: userId,
      })
  
      showToast("Generating view-only key...")
  
      // Update key type label
      document.getElementById("keyTypeLabel").textContent = "View-Only Key"
    })
  })
  
  // Handle response from background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.key === "markup_response") {
      const keyOutputContainer = document.getElementById("keyOutputContainer")
      const markupKeyOutput = document.getElementById("markupKeyOutput")
  
      if (message.success) {
        markupKeyOutput.innerText = message.markupKey
        keyOutputContainer.classList.remove("hidden")
        showToast("Key generated successfully!")
      } else {
        markupKeyOutput.innerText = `Error: ${message.error}`
        keyOutputContainer.classList.remove("hidden")
        showToast("Error generating key")
      }
    }
  })
  
  // Copy key to clipboard
  document.getElementById("copyKeyButton").addEventListener("click", () => {
    const keyText = document.getElementById("markupKeyOutput").innerText
    if (keyText.startsWith("Error:")) {
      showToast("Cannot copy error message")
      return
    }
  
    copyToClipboard(keyText)
  })
  
  // View annotations
  document.getElementById("viewAnnotationsButton").addEventListener("click", () => {
    const viewAnnotationKey = document.getElementById("markupKeyInput").value.trim()
  
    if (!viewAnnotationKey) {
      showToast("Please enter a valid Markup Key")
      return
    }
  
    chrome.storage.sync.get("userId", (result) => {
      if (chrome.runtime.lastError || !result.userId) {
        console.error("Error retrieving userId:", chrome.runtime.lastError?.message || "No userId found.")
        showToast("Error: User not logged in")
        return
      }
      const userId = result.userId
  
      // Send message to the background script
      chrome.runtime.sendMessage({
        key: "loadAnnotations",
        viewAnnotationKey: viewAnnotationKey,
        userId: userId,
      })
  
      showToast("Loading annotations...")
  
      // Show the annotations container
      document.getElementById("annotations").classList.remove("hidden")
  
      // For demonstration, we'll add some placeholder annotations
      // In a real implementation, this would be populated with data from the response
      displayPlaceholderAnnotations()
    })
  })
  
  // Display placeholder annotations for demonstration
  function displayPlaceholderAnnotations() {
    const annotationsList = document.getElementById("annotationsList")
    const annotationCount = document.getElementById("annotationCount")
  
    // Clear existing annotations
    annotationsList.innerHTML = ""
  
    // Create some placeholder annotations
    const placeholderData = [
      { id: 1, text: "This is an important section that needs review.", author: "John Doe", date: "2023-05-15" },
      { id: 2, text: "Consider revising this paragraph for clarity.", author: "Jane Smith", date: "2023-05-16" },
      { id: 3, text: "Great explanation here!", author: "Alex Johnson", date: "2023-05-17" },
    ]
  
    // Update the count
    annotationCount.textContent = placeholderData.length
  
    // Add annotations to the list
    placeholderData.forEach((annotation) => {
      const annotationItem = document.createElement("div")
      annotationItem.className = "annotation-item"
      annotationItem.innerHTML = `
        <div class="annotation-content">
          <p>${annotation.text}</p>
          <div class="annotation-meta">
            <span class="annotation-author">${annotation.author}</span>
            <span class="annotation-date">${annotation.date}</span>
          </div>
        </div>
      `
      annotationsList.appendChild(annotationItem)
    })
  }
  
  // Handle annotations response (placeholder - you would need to implement this)
  function displayAnnotations(annotations) {
    const annotationsList = document.getElementById("annotationsList")
    const annotationCount = document.getElementById("annotationCount")
  
    annotationsList.innerHTML = ""
  
    if (annotations && annotations.length > 0) {
      annotationCount.textContent = annotations.length
  
      annotations.forEach((annotation) => {
        const annotationElement = document.createElement("div")
        annotationElement.className = "annotation-item"
        // Populate with your annotation data
        annotationElement.textContent = annotation.text // Adjust based on your data structure
        annotationsList.appendChild(annotationElement)
      })
    } else {
      annotationCount.textContent = "0"
      const noAnnotationsElement = document.createElement("p")
      noAnnotationsElement.className = "text-gray-500 italic"
      noAnnotationsElement.textContent = "No annotations found"
      annotationsList.appendChild(noAnnotationsElement)
    }
  }
  
  // Add CSS for annotation meta information
  document.head.insertAdjacentHTML(
    "beforeend",
    `
    <style>
      .annotation-meta {
        display: flex;
        justify-content: space-between;
        margin-top: 0.5rem;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
      
      .annotation-author {
        font-weight: 500;
      }
      
      .annotation-date {
        color: var(--text-light);
      }
    </style>
  `,
  )
  