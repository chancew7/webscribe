//background.js

import * as constants from "../constants.js";
import * as annotation_messages from './annotation_message.js';
import { markup } from './markup.js';

import { db } from './firebase-init.js';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

chrome.action.onClicked.addListener(function() {
    chrome.tabs.create({url: '../index.html'});
  });

//context menu buttons 
chrome.runtime.onInstalled.addListener(() => {

    chrome.contextMenus.create({
        id: "parent_menu",
        title: "Markup", // Replace with your extension's name
        contexts: ["all"], // Makes this menu appear in all contexts
    });

    chrome.contextMenus.create({
        id: constants.ActionType.HIGHLIGHT,
        title: constants.Titles.HIGHLIGHT,
        contexts: ["selection"]
    });
    chrome.contextMenus.create({
        id: constants.IdPreamble.HIGHLIGHT + constants.HighlightColors.BLUE,
        title: "Blue",
        parentId: constants.ActionType.HIGHLIGHT,
        contexts: ["selection"]
    });
    chrome.contextMenus.create({
        id: constants.IdPreamble.HIGHLIGHT + constants.HighlightColors.GREEN,
        title: "Green",
        parentId: constants.ActionType.HIGHLIGHT,
        contexts: ["selection"]
    });
    chrome.contextMenus.create({
        id: constants.IdPreamble.HIGHLIGHT + constants.HighlightColors.RED,
        title: "Red",
        parentId: constants.ActionType.HIGHLIGHT,
        contexts: ["selection"]
    });
    chrome.contextMenus.create({
        id: constants.IdPreamble.HIGHLIGHT + constants.HighlightColors.YELLOW,
        title: "Yellow" + " ".repeat(8) + constants.CommandShortcuts.HIGHLIGHT,
        parentId: constants.ActionType.HIGHLIGHT,
        contexts: ["selection"]
    });

    chrome.contextMenus.create({
        id: constants.ActionType.GENERATE,
        title: constants.Titles.GENERATE,
        contexts: ["selection", "page"]
    });

    chrome.contextMenus.create({
        id: constants.ActionType.TEXTSTYLE,
        title: "Textstyle",
        contexts: ["selection"]
    });
    chrome.contextMenus.create({
        id: constants.IdPreamble.TEXTSTYLE + constants.TextstyleType.BOLD,
        title: constants.Titles.BOLD,
        parentId: constants.ActionType.TEXTSTYLE,
        contexts: ["selection"]
    });
    chrome.contextMenus.create({
        id: constants.IdPreamble.TEXTSTYLE + constants.TextstyleType.ITALIC,
        title: constants.Titles.ITALIC,
        parentId: constants.ActionType.TEXTSTYLE,
        contexts: ["selection"]
    });
    chrome.contextMenus.create({
        id: constants.IdPreamble.TEXTSTYLE + constants.TextstyleType.UNDERLINE,
        title: constants.Titles.UNDERLINE,
        parentId: constants.ActionType.TEXTSTYLE,
        contexts: ["selection"]
    });


    chrome.contextMenus.create({
        id: constants.ActionType.COMMENT,
        title: constants.Titles.COMMENT,
        contexts: ["selection"]
    });

    chrome.contextMenus.create({
        id: constants.ActionType.SUMMARIZE,
        title: constants.Titles.SUMMARIZE,
        contexts: ["selection"]
    });


    chrome.contextMenus.create({
        id: "remove_button",
        title: "Clear Annotation",
        contexts: ["selection"]
    });
    chrome.contextMenus.create({
        id: "remove_highlight",
        title: "Clear Highlight",
        parentId: "remove_button",
        contexts: ["selection"]
    });


});
//context menu listeners
chrome.contextMenus.onClicked.addListener((info, tab) => {

    if (info.parentMenuItemId === constants.ActionType.HIGHLIGHT) {
        let color = annotation_messages.getHighlightColor(info.menuItemId);
        annotation_messages.sendHighlightMessage(color, tab);
    }
    else if (info.parentMenuItemId === constants.ActionType.TEXTSTYLE) {
        let textstyleType = annotation_messages.getTextstyleType(info.menuItemId);
        annotation_messages.sendTextstyleMessage(textstyleType, tab)
    }
    else if (info.menuItemId === constants.ActionType.COMMENT) {
        annotation_messages.sendCommentMessage(tab);
    }
    else if (info.parentMenuItemId === "remove_button") {
        annotation_messages.sendHighlightMessage(constants.HighlightColors.TRANSPARENT, tab);
    }
    else if (info.menuItemId === constants.ActionType.SUMMARIZE) {
        annotation_messages.sendSummarizeMessage(tab);
    }
    else if (info.menuItemId === constants.ActionType.GENERATE) {
        console.log("calling generate function");
        annotation_messages.sendGenerateMessage(tab);
    }
    
});

//message listeners
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {

    if (message.key === constants.MessageKeys.KEY_COMMAND) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length > 0) {
                const tab = tabs[0];

                switch (message.action) {
                    case constants.ActionType.HIGHLIGHT:
                        annotation_messages.sendHighlightMessage(message.color, tab);
                        break;
                    case constants.ActionType.TEXTSTYLE:
                        annotation_messages.sendTextstyleMessage(constants.TextstyleType[message.textstyleType.toUpperCase()], tab);
                        break;
                    case constants.ActionType.COMMENT:
                        annotation_messages.sendCommentMessage(tab);
                        break;
                    case constants.ActionType.CLEAR:
                        annotation_messages.sendClearMessage(tab);
                        break;
                }

            }
        });
    }
    else if (message.key === constants.MessageKeys.SAVE_ANNOTATION) {
        console.log("annotationData = " + JSON.stringify(message.annotation, null, 2));
        console.log("annotation data .markup_key: " + message.annotation.markup_key);

        annotation_messages.saveAnnotationToDatabase(message.annotation);
    }

    else if (message.key === constants.MessageKeys.GET_MARKUP_KEY){
        const {url, userId} = message;
        try {
            const q = query(
                collection(db, "markups"),
                where("url", "==", url),
                where("userIds", "array-contains", userId)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                // Send a message back to all listeners with the result
                chrome.runtime.sendMessage({
                    key: constants.MessageKeys.MARKUP_KEY_RESPONSE,
                    success: true,
                    markupKey: doc.data().markup_key,
                });
            } else {
                chrome.runtime.sendMessage({
                    key: constants.MessageKeys.MARKUP_KEY_RESPONSE,
                    success: false,
                    error: "No matching markup key found.",
                });
            }
        } catch (error) {
            console.error("Error querying database:", error);
            chrome.runtime.sendMessage({
                key: constants.MessageKeys.MARKUP_KEY_RESPONSE,
                success: false,
                error: "Database query failed.",
            });
        }
    }
    else if (message.key === "loadAnnotations") {
        console.log("load annotations message recieved");
        const { markupKey, userId } = message;

        try {
            const docRef = doc(db, "markups", markupKey);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data()
                const url = data.url;
                const annotations = data.annotations;
                if (userId != null && !data.userIds?.includes(userId)) {
                    await updateDoc(docRef, {
                        userIds: arrayUnion(userId)
                    });
                }

                // Open the URL in a new tab
                chrome.tabs.create({ url: url }, (tab) => {
                    // Send annotations to the new tab once it’s loaded
                    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                        if (tabId === tab.id && changeInfo.status === "complete") {
                            chrome.tabs.sendMessage(tab.id, {
                                key: constants.MessageKeys.MARKUP_MESSAGE,
                                markup_key: markupKey,
                                annotations: annotations,
                            });

                            // Remove the listener to prevent it from firing again
                            chrome.tabs.onUpdated.removeListener(listener);
                        }
                    });
                });

                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, error: "Markup ID not found." });
            }
        } catch (error) {
            console.error("Error querying Firestore for annotations:", error);
            sendResponse({ success: false, error: "Database query failed." });
        }

        return true; // Indicate that the response will be sent asynchronously
    }

});
//open url listener
chrome.webNavigation.onCompleted.addListener(async (details) => {

    if (details.frameId === 0) {
        const url = details.url;

        const markupKey = await loadMarkup(url);
        if (markupKey == null) {
            console.log("page loaded with URL: " + url + " but no markup key");
        }
        else {
            console.log("page loaded with URL: " + url + " markup key: " + markupKey);
        }

        chrome.tabs.sendMessage(details.tabId, {
            key: constants.MessageKeys.MARKUP_MESSAGE,
            action: constants.ActionType.LOAD_MARKUP,
            markup_key: markupKey,
            url: url
        }, (response) => {
            if (chrome.runtime.lastError
                && !chrome.runtime.lastError.message.includes("Could not establish connection. Receiving end does not exist")
                && !chrome.runtime.lastError.message.includes("The message port closed before a response was received")
            ) {
                console.error("error sending message: " + chrome.runtime.lastError.message);
            }
        });


    }
});
//markup querying
async function loadMarkup(url) {
    try {
        const MAX_URL_LENGTH = 1500; // Firestore limit in bytes
        if (new TextEncoder().encode(url).length > MAX_URL_LENGTH) {
            console.warn("URL size exceeds Firestore's query limit. Skipping:", url);
            return null; // Do nothing and return null
        }

        // Retrieve the userId from chrome.storage
        const userId = await new Promise((resolve, reject) => {
            chrome.storage.sync.get("userId", (result) => {
                if (chrome.runtime.lastError) {
                    console.error("Error retrieving userId:", chrome.runtime.lastError.message);
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(result.userId || null);
                }
            });
        });

        if (!userId) {
            console.log("User ID not found in storage. Skipping markup loading.");
            return null; // Skip if no userId is found
        }

        // Perform a compound query on both url and userId
        const q = query(
            collection(db, "markups"),
            where("url", "==", url),
            where("userIds", "array-contains", userId)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const markupKey = doc.data().markup_key;
            console.log("Matching markup found for user:", userId);
            return markupKey;
        } else {
            console.log("No matching markup found for the given URL and user.");
            return null;
        }
    } catch (error) {
        console.error("Error querying", error);
        throw new Error("Failed to get markup");
    }
}

export async function getMarkupKey(url, userId) {
    try {
        const q = query(
            collection(db, "markups"),
            where("url", "==", url),
            where("userIds", "array-contains", userId),
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0]; // Get the first document that matches
            return doc.data().markup_key; // Return the markup_key field
        } else {
            return null; // No matching markup key found
        }
    } catch (error) {
        console.error("Error querying the database:", error);
        throw new Error("Failed to query the database.");
    }
}




