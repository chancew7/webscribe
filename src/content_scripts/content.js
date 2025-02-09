//content.js

import * as bundle_reasons from './annotation_builder.js';
import * as constants from "../constants.js";
import { Summarize } from '../models/Summarize.js';
import { ActionType, MessageKeys } from '../constants.js';

let ctrlShiftHPressed = false;
let timerId = null;

//listens for key commands
document.addEventListener('keydown', function (event) {


    if (event.ctrlKey && event.shiftKey && event.code === 'KeyB') {
        event.preventDefault();
        chrome.runtime.sendMessage({
            action: constants.ActionType.TEXTSTYLE,
            textstyleType: constants.TextstyleType.BOLD,
            key: constants.MessageKeys.KEY_COMMAND
        }, (response) => {
            if (chrome.runtime.lastError && !chrome.runtime.lastError.message.includes("Could not establish connection. Receiving end does not exist")
                && !chrome.runtime.lastError.message.includes("The message port closed before a response was received")) {
                console.error("error sending message" + chrome.runtime.lastError.message);
            }
        });
    }
    else if (event.ctrlKey && event.shiftKey && event.code === 'KeyU') {
        event.preventDefault();
        chrome.runtime.sendMessage({
            action: constants.ActionType.TEXTSTYLE,
            textstyleType: constants.TextstyleType.UNDERLINE,
            key: constants.MessageKeys.KEY_COMMAND
        }, (response) => {
            if (chrome.runtime.lastError && !chrome.runtime.lastError.message.includes("Could not establish connection. Receiving end does not exist")
                && !chrome.runtime.lastError.message.includes("The message port closed before a response was received")) {
                console.error("error sending message" + chrome.runtime.lastError.message);
            }
        });
    }
    else if (event.ctrlKey && !event.shiftKey && event.code === 'KeyI') {
        chrome.runtime.sendMessage({
            action: constants.ActionType.TEXTSTYLE,
            textstyleType: constants.TextstyleType.ITALIC,
            key: constants.MessageKeys.KEY_COMMAND
        }, (response) => {
            if (chrome.runtime.lastError && !chrome.runtime.lastError.message.includes("Could not establish connection. Receiving end does not exist")
                && !chrome.runtime.lastError.message.includes("The message port closed before a response was received")) {
                console.error("error sending message" + chrome.runtime.lastError.message);
            }
        });
    }
    else if (event.ctrlKey && event.shiftKey && event.code === 'KeyC') {
        event.preventDefault();
        chrome.runtime.sendMessage({
            action: constants.ActionType.COMMENT,
            key: constants.MessageKeys.KEY_COMMAND
        }, (response) => {
            if (chrome.runtime.lastError && !chrome.runtime.lastError.message.includes("Could not establish connection. Receiving end does not exist")
                && !chrome.runtime.lastError.message.includes("The message port closed before a response was received")) {
                console.error("error sending message" + chrome.runtime.lastError.message);
            }
        });
    }
    else if (event.key === 'Delete' || event.key === 'Backspace') {
        chrome.runtime.sendMessage({
            action: constants.ActionType.CLEAR,
            key: constants.MessageKeys.KEY_COMMAND
        }, (response) => {
            if (chrome.runtime.lastError && !chrome.runtime.lastError.message.includes("Could not establish connection. Receiving end does not exist")
                && !chrome.runtime.lastError.message.includes("The message port closed before a response was received")) {
                console.error("error sending message" + chrome.runtime.lastError.message);
            }
        });
    }
    else if (event.ctrlKey && event.shiftKey && event.code === 'KeyH') {
        chrome.runtime.sendMessage({
            action: constants.ActionType.HIGHLIGHT,
            color: constants.HighlightColors.DEFAULT,
            key: constants.MessageKeys.KEY_COMMAND
        }, (response) => {
            if (chrome.runtime.lastError && !chrome.runtime.lastError.message.includes("Could not establish connection. Receiving end does not exist")
                && !chrome.runtime.lastError.message.includes("The message port closed before a response was received")) {
                console.error("error sending message" + chrome.runtime.lastError.message);
            }
        });

        if (timerId) { clearTimeout(timerId); }
        ctrlShiftHPressed = true;

        timerId = setTimeout(() => {
            ctrlShiftHPressed = false;
            timerId = null;
        }, 2000);
    }
    //works but need to remove existing highlight first, i.e. recognize span is the same
    //adjust highlight color
    if (ctrlShiftHPressed && event.code === 'KeyY') {
        chrome.runtime.sendMessage({
            action: constants.ActionType.HIGHLIGHT,
            color: constants.HighlightColors.RED,
            key: constants.MessageKeys.KEY_COMMAND
        }, (response) => {
            if (chrome.runtime.lastError && !chrome.runtime.lastError.message.includes("Could not establish connection. Receiving end does not exist")
                && !chrome.runtime.lastError.message.includes("The message port closed before a response was received")) {
                console.error("error sending message" + chrome.runtime.lastError.message);
            }
        });
        ctrlShiftHPressed = false;
        clearTimeout(timerId);
        timerId = null;
    }

});



