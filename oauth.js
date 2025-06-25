import * as annotation_messages from './annotation_message.js';
window.onload = function () {
    document.querySelector("button").addEventListener("click", function () {
      chrome.identity.getAuthToken({ interactive: true }, function (token) {
        if (chrome.runtime.lastError) {
          console.error("Error during authentication:", chrome.runtime.lastError.message);
          return;
        }
  
        // Fetch user info
        fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          method: "GET",
          headers: {
            Authorization: "Bearer " + token,
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Failed to fetch user info: ${response.statusText}`);
            }
            return response.json();
          })
          .then((userInfo) => {
            console.log("User Info:", userInfo);
  
            // Extract relevant user data
            const userId = userInfo.sub; // Unique user ID
            const userEmail = userInfo.email;

  
            // Store user info in chrome.storage
            chrome.storage.sync.set(
              {
                userId: userId,
                userEmail: userEmail,
                token: token, // Store the token if needed later
                isPremium: annotation_messages.isUserPremium() // Default value; update later if needed
              },
              () => {
                console.log("User information saved to chrome.storage.");
              }
            );
          })
          .catch((error) => {
            console.error("Error fetching user info:", error);
          });
      });
    });
  };
