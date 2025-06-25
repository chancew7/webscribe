import * as constants from "../constants.js";
import * as annotation_messages from '../background_scripts/annotation_message.js';

import { Annotation } from './annotations/Annotation.js';
import { HighlightAnnotation } from "./annotations/HighlightAnnotation.js";
import { CommentAnnotation } from "./annotations/CommentAnnotation.js";
import { TextstyleAnnotation } from "./annotations/TextstyleAnnotation.js";
import { Summarize } from '../models/Summarize.js';
import { API_KEYS } from '../config.js';

import { db } from '../background_scripts/firebase-init.js';
import { getDoc, doc, setDoc } from 'firebase/firestore';


var OPENAI_API_KEY = API_KEYS.OPENAI;

var markupKey = null;
var url = null;


async function createMarkup(url) {

    console.log("no existing markup, creating new");

    const markupKey = generateCollaborationMarkupKey();
    const viewOnlyKey = generateViewMarkupKey();

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
        console.log("User ID not found in storage. Markup will not have associated user.");
        return null;
    }

    let newMarkup = {
        url: url,
        markup_key: markupKey,
        view_key: viewOnlyKey,
        userIds: [userId],
        annotations: []
    };

    const docRef = doc(db, 'markups', markupKey);
    await setDoc(docRef, newMarkup);
    console.log('New markup created with ID: ', docRef.id);

    return markupKey;
}

export function generateCollaborationMarkupKey() {
    const words = constants.words;
    const word = words[Math.floor(Math.random() * words.length)];
    const number = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    return `${word}${number}`;
}

export function generateViewMarkupKey() {
    const words = constants.words;
    const word = words[Math.floor(Math.random() * words.length)];
    const number = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    return `V_${word}${number}`;
}

export function reimplementAnnotation(annotation) {

    const {text, selectionIndex, type} = annotation;
    redoAnnotations(text, selectionIndex, annotation);
    
}
  

function redoAnnotations(searchText, targetIndex, annotation){
    if(!searchText) {
        if (annotation.type == "comment"){
            new CommentAnnotation(null, null, annotation.message, annotation.markup_key, annotation.selectionIndex, annotation.xCoord, annotation.yCoord, annotation.id).performAnnotation(true);
        }
        return;
    }
    const body = document.body;
    const textNodes = getTextNodes(body);
    let globalMatchIndex = 0;

    for (const node of textNodes){
        const text = node.nodeValue;
        const searchRegex = new RegExp(searchText, 'g');

        let match;
        while((match = searchRegex.exec(text)) != null){
            globalMatchIndex++;

            if (globalMatchIndex === targetIndex){
                const range = document.createRange();
                range.setStart(node, match.index);
                range.setEnd(node, match.index + match[0].length);

                const span = document.createElement('span');

                switch (annotation.type) {
                    case constants.ActionType.HIGHLIGHT:
                        new HighlightAnnotation(span, range, annotation.color, annotation.markup_key, annotation.selectionIndex).performAnnotation(true);
                        break;
                    case constants.ActionType.TEXTSTYLE:
                        new TextstyleAnnotation(span, range, annotation.textstyleType, annotation.markup_key, annotation.selectionIndex).performAnnotation(true);
                        break;
                    case constants.ActionType.COMMENT:
                        new CommentAnnotation(span, range, annotation.message, annotation.markup_key, annotation.selectionIndex, annotation.xCoord, annotation.yCoord, annotation.id).performAnnotation(true); //add argument
                        break;
                }   
                return;
            }
        }
    }
}

// Helper function: Get all text nodes in an element
function getTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
    }
    return textNodes;
}

function getSelectionIndex(searchText, selection) {
    if (!searchText || !selection || !selection.rangeCount) return null;

    const body = document.body;
    const textNodes = getTextNodes(body);
    let textMatches = 0; // Global match index

    const selectedRange = selection.getRangeAt(0); // Use the passed selection

    // Loop through text nodes and match instances
    for (const node of textNodes) {
        const text = node.nodeValue;
        const searchRegex = new RegExp(searchText, 'g'); // Case-insensitive search

        // Check if the text node contains any matches
        if (text != null && searchRegex.test(text)) {
            const matches = text.match(searchRegex); // Find all matches in this node
            let currentOffset = 0;

            for (const match of matches) { // Use a `for` loop instead of `forEach`
                textMatches++; // Increment global match index

                // Get range of the current match
                const startOffset = text.indexOf(match, currentOffset);
                const endOffset = startOffset + match.length;
                currentOffset = endOffset;

                // Create a range for the current match
                const matchRange = document.createRange();
                matchRange.setStart(node, startOffset);
                matchRange.setEnd(node, endOffset);

                // Compare the selection range to the match range
                if (
                    selectedRange.startContainer === matchRange.startContainer &&
                    selectedRange.startOffset === matchRange.startOffset &&
                    selectedRange.endContainer === matchRange.endContainer &&
                    selectedRange.endOffset === matchRange.endOffset
                ) {
                    return textMatches; // Return the global match index
                }
            }
        }
    }

    console.log("Selected text not found in document.");
    return null; // No match found
}


chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {


    if (message.key === constants.MessageKeys.MARKUP_MESSAGE) { //an existing markup has been found, load and apply the annotations
        url = message.url;
        if (message.markup_key) {
                markupKey = message.markup_key;
            try {
                const docRef = doc(db, 'markups', markupKey);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const annotations = docSnap.data().annotations;
                    annotations.forEach(annotation => {
                        reimplementAnnotation(annotation);
                    });
                }
            }
            catch (error) {
                console.error("db retrieval threw an error: ", error);
            }

        }

    }
    else if (message.key === "load_view_only"){
        message.annotations.forEach(annotation => {
            annotation.markup_key = null;
            reimplementAnnotation(annotation);
        });
    }

    else if (message.key === constants.MessageKeys.ANNOTATION) {

        if (markupKey == null) {
            markupKey = await createMarkup(url);
        }

        const selection = window.getSelection(); 
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const span = document.createElement('span');

            let selectionIndex = getSelectionIndex(range.toString(), selection);

            switch (message.action) {
                case constants.ActionType.COMMENT:
                    let comment = new CommentAnnotation(span, range, message.commentMessage, markupKey, selectionIndex);
                    comment.performAnnotation(false); //add argument
                    break;
                case constants.ActionType.HIGHLIGHT:
                    //if annotation exists with matching range, get annotation, otherwise create annotation
                    let highlight = new HighlightAnnotation(span, range, message.highlightColor, markupKey, selectionIndex);
                    highlight.performAnnotation(false);
                    break;
                case constants.ActionType.TEXTSTYLE:
                    //if matching textstyle exists, get. otherwise create
                    let textstyle = new TextstyleAnnotation(span, range, message.textstyleType, markupKey, selectionIndex);
                    textstyle.performAnnotation(false);
                    break;
                case constants.ActionType.CLEAR:
                    let annotation = new Annotation(span, range, markupKey);
                    annotation.clearAll();
                    break;
                case constants.ActionType.SUMMARIZE:
                    let summarize = new Summarize(span, range, markupKey);
                    summarize.generateSummary();
                    break;
            }
        }
    }
    
    else if (message.key === constants.MessageKeys.GENERATE) {
      
        if (!(await annotation_messages.isUserPremium())) {
                    const summary = "This is a premium feature. Please upgrade to a premium account to use this feature.";
                    const comment = new CommentAnnotation(document.createElement('span'), window.getSelection().getRangeAt(0), summary, null);
                    comment.performAnnotation();
                }
        if (markupKey == null) {
            markupKey = await createMarkup(url);
        }
            let selectedText = window.getSelection().toString().trim();
            await generateImage(selectedText);
    }

    else if (message.key === "clear_all_key"){
        //using markup key, clear the annotations field 
         if (markupKey) {
        try {
            const docRef = doc(db, 'markups', markupKey);
            await setDoc(docRef, { annotations: [] }, { merge: true });
            window.location.reload();
        } catch (error) {
            console.error("Error clearing annotations:", error);
        }
    }
    }
            

});


async function generateCaption(summary) {
    try {
        // Import Google Generative AI and configuration
        const {
            GoogleGenerativeAI,
            HarmCategory,
            HarmBlockThreshold,
        } = require("@google/generative-ai");

        const { API_KEYS } = require('../config.js');
        const genAI = new GoogleGenerativeAI(API_KEYS.GOOGLE_AI);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
        });

        const generationConfig = {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 1024, // Adjusted for caption length
            responseMimeType: "text/plain",
        };

        // Step 1: Fetch annotations from the database
        const docRef = doc(db, 'markups', markupKey);
        const docSnap = await getDoc(docRef);

        // Step 2: Construct the context string
        let contextString = "";
        contextString += document.title ? `Title: ${document.title}\n` : "";
        contextString += summary ? `Summary: ${summary}\n` : "";

        if (docSnap.exists()) {
            const annotations = docSnap.data().annotations;
            annotations.forEach((annotation) => {
                if (contextString.length + annotation.text.length <= 500) {
                    contextString += `Annotation: ${annotation.text}\n`;
                }
            });
        

        // Step 3: Generate the caption using Google Generative AI
        const run = async () => {
            const chatSession = model.startChat({
                generationConfig,
                history: [],
            });

            // Construct prompt for caption generation
            const prompt = `Based on the following context, generate one creative and concise caption (2-4 sentences) for a graphic. Dont give options or a preamble:\n${contextString}`;
            const result = await chatSession.sendMessage(prompt);

            // Extract and return the AI-generated caption
            const caption = result.response.text();
            console.log("Generated Caption:", caption);
            return caption;
        };
    }

        const caption = await run();
        return caption;
    } catch (error) {
        console.error("Error generating caption:", error);
        throw error;
    }
    }   




async function generateImage(summary) {
    try {
        if ((await annotation_messages.isUserPremium())) {
        const caption = await generateCaption(summary);

        // Step 1: Fetch image from OpenAI API
        const response = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: `Create a background graphic inspired by this article summary. Don't use words or numbers: "${caption}".`,
                n: 1,
                size: "1024x1024",
                response_format: "b64_json",
            }),
        });

        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const data = await response.json();

        // Step 2: Convert the base64 image to a data URL
        const imageData = data.data[0].b64_json;
        const imageUrl = `data:image/png;base64,${imageData}`;

        //step 3: Generate Custom Caption
        
        console.log("caption = ", caption);

        // Step 4: Display the image and provide a download option
        displayImageWithText(imageUrl, caption);}
    } catch (error) {
        console.error("Error in generateImage:", error);
    }
}


function displayImageWithText(imageUrl, caption) {
    // Load the base64 image into an Image object
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Handle cross-origin issues
    img.onload = () => {
        // Step 1: Create a canvas with the same dimensions as the image
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        // Step 2: Draw the image onto the canvas
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Step 3: Add a semi-transparent black tint for better text contrast
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Step 4: Configure text settings for overlay
        let fontSize = Math.min(canvas.width * 0.04, 50); // Start with a dynamic font size
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = fontSize * 0.1; // Outline thickness
        ctx.textAlign = "center";

        // Step 5: Wrap the text for the caption
        const maxWidth = canvas.width * 0.8; // Text width will be 80% of the canvas width
        let lineHeight = fontSize * 1.2;

        // Title handling
        const title = document.title || ""; // Use document.title if defined
        const wrappedTitle = title ? wrapText(ctx, title, maxWidth) : [];
        const titleHeight = wrappedTitle.length * lineHeight;

        // Caption handling
        // Ensure caption is a string
        caption = typeof caption === "string" ? caption : "";
        const wrappedCaption = wrapText(ctx, caption, maxWidth);
        let captionLineHeight = lineHeight;

        // Dynamically adjust font size for the caption if it doesn't fit
        while (wrappedCaption.length * captionLineHeight > canvas.height * 0.5) { // Ensure text fits within 50% of the canvas height
            fontSize -= 2; // Decrease font size
            if (fontSize < 10) break; // Avoid making the text too small
            ctx.font = `bold ${fontSize}px Arial`;
            captionLineHeight = fontSize * 1.2;
            wrappedCaption = wrapText(ctx, caption, maxWidth);
        }

        // Step 6: Position and draw the title (if available) at the top
        if (wrappedTitle.length > 0) {
            const titleYStart = canvas.height * 0.1; // Start 10% down from the top
            wrappedTitle.forEach((line, index) => {
                const y = titleYStart + index * lineHeight;
                ctx.strokeText(line, canvas.width / 2, y); // Add text outline
                ctx.fillText(line, canvas.width / 2, y);   // Add text fill
            });
        }

        // Step 7: Position and draw the caption (adjusted for title height)
        const totalTextHeight = wrappedCaption.length * captionLineHeight;
        let captionYStart = canvas.height - totalTextHeight - 20; // Start near the bottom, leave space

        if (wrappedTitle.length === 0) { // If no title, center caption vertically if it fits
            if (totalTextHeight < canvas.height * 0.5) {
                captionYStart = (canvas.height - totalTextHeight) / 2;
            }
        }

        wrappedCaption.forEach((line, index) => {
            const y = captionYStart + index * captionLineHeight;
            ctx.strokeText(line, canvas.width / 2, y); // Add text outline
            ctx.fillText(line, canvas.width / 2, y);   // Add text fill
        });

        // Step 8: Update the image element on the page
        const imgElement = document.getElementById("generatedImage") || document.createElement("img");
        imgElement.id = "generatedImage";
        imgElement.src = canvas.toDataURL("image/png");
        imgElement.style.display = "block";
        imgElement.style.margin = "20px auto";
        imgElement.style.maxWidth = "100%";
        if (!imgElement.parentNode) document.body.appendChild(imgElement);

        // Step 9: Provide a download link for the processed image
        const link = document.createElement("a");
        link.href = imgElement.src;
        link.download = "infographic_with_text.png";
        link.click();
    };

    // Handle image loading errors
    img.onerror = (error) => console.error("Error loading image for canvas:", error);

    // Set the source of the image to trigger `onload`
    img.src = imageUrl;
}

// Helper function to wrap text
function wrapText(ctx, text, maxWidth) {
    if (typeof text !== "string") text = "";
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth > maxWidth) {
            lines.push(currentLine); // Add the current line to lines
            currentLine = word; // Start a new line with the current word
        } else {
            currentLine = testLine; // Add the word to the current line
        }
    });

    if (currentLine) {
        lines.push(currentLine); // Add the last line
    }

    return lines;
}
