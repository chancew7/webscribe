


document.getElementById("loginButton").addEventListener("click", function () {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
            console.error("Login failed:", chrome.runtime.lastError.message);
        } else {
            console.log("Logged in successfully. Token:", token);

            // Fetch user information from Google's UserInfo endpoint
            fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
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

                    // Store userId and token in chrome.storage
                    chrome.storage.sync.set(
                        {
                            userId: userInfo.sub, // Unique Google ID
                            userEmail: userInfo.email, // Optional: user's email
                            token: token, // Store the token for future use if needed
                        },
                        () => {
                            console.log("User information saved to chrome.storage.");
                        }
                    );
                })
                .catch((error) => {
                    console.error("Error fetching user info:", error);
                });
        }
    });
});

document.getElementById("logoutButton").addEventListener("click", function () {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (token) {
            // 1. Revoke token on Google's servers
            fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
                .then(() => {
                    // 2. Remove cached token locally
                    chrome.identity.removeCachedAuthToken({ token }, () => {
                        // 3. Clear stored user data
                        chrome.storage.sync.remove(['userId', 'userEmail', 'token'], () => {
                            console.log("Logged out fully.");
                        });
                    });
                })
                .catch((err) => console.error("Error revoking token:", err));
        }
    });
});



document.getElementById("getCollaborationKeyButton").addEventListener("click", function () {
    const url = document.getElementById("urlInput").value.trim();
    if (!url) {
        alert("Please enter a valid URL.");
        return;
    }

    // Retrieve userId from chrome.storage
    chrome.storage.sync.get("userId", (result) => {
        if (chrome.runtime.lastError || !result.userId) {
            console.error("Error retrieving userId:", chrome.runtime.lastError?.message || "No userId found.");
            document.getElementById("markupKeyOutput").innerText = "Error: User not logged in.";
            return;
        }

        const userId = result.userId;

        // Send message to the background script
        chrome.runtime.sendMessage(
            {
                key: 'get_markup_key',
                action: "getMarkupKey",
                url: url,
                userId: userId,
            });
    });
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.key === 'markup_response') {
        if (message.success) {
            document.getElementById("markupKeyOutput").innerText = `Markup Key: ${message.markupKey}`;
        } else {
            document.getElementById("markupKeyOutput").innerText = `Error: ${message.error}`;
        }
    }
});


document.getElementById("viewAnnotationsButton").addEventListener("click", function () {
    const markupKey = document.getElementById("markupKeyInput").value.trim();

    if (!markupKey) {
        alert("Please enter a valid Markup Key.");
        return;
    }

    chrome.storage.sync.get("userId", (result) => {
        if (chrome.runtime.lastError || !result.userId) {
            console.error("Error retrieving userId:", chrome.runtime.lastError?.message || "No userId found.");
            document.getElementById("markupKeyOutput").innerText = "Error: User not logged in.";
            return;
        }
        const userId = result.userId;
    
    // Send message to the background script
    chrome.runtime.sendMessage(
        {
            key: "loadAnnotations",
            markupKey: markupKey,
            userId: userId
        });
    });
});


