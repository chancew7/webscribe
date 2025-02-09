//background.js

import * as constants from "../constants.js";
import * as annotation_messages from './annotation_message.js';
import { markup } from './markup.js';

import { db } from './firebase-init.js';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

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
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {

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
        const q = query(collection(db, 'markups'), where('url', '==', url));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const markupKey = doc.data().markup_key;
            return markupKey;
        }
        else {
            return null;
        }
    }
    catch (error) {
        console.error("error querying", error);
        throw new Error("failed to get markup");
    }

}




