import { Annotation } from './Annotation.js';
import { ActionType } from '../constants.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CommentAnnotation } from '../content_scripts/annotations/CommentAnnotation.js';
import * as annotation_messages from '../background_scripts/annotation_message.js';

export class Summarize extends Annotation {
    constructor(selection, range, markup_key) {
        super(selection, range, markup_key);
        this.type = ActionType.SUMMARIZE;
        this.summary = '';
        this.range = range;
    }

    async generateSummary() {
        if (!(await annotation_messages.isUserPremium())) {
            console.log("User is not premium, cannot generate summary.");
            this.summary = "This is a premium feature. Please upgrade to a premium account to use this feature.";
            const span = document.createElement('span');
            const comment = new CommentAnnotation(span, this.range, this.summary, this.markup_key);
            comment.performAnnotation();
            return this.summary;
        }
        try {
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
                maxOutputTokens: 8192,
                responseMimeType: "text/plain",
            };

            // Use arrow function to preserve 'this' context
            const run = async () => {
                const chatSession = model.startChat({
                    generationConfig,
                    history: [],
                });
                const text = this.range.toString()
                const result = await chatSession.sendMessage("Summarize the following text: " + text);
                this.summary = result.response.text();
                console.log(this.summary);
                return result.response.text();
            }

            const summary = await run();
            this.summary = summary;
            console.log("Summary generated:", this.summary);

            // Create a comment annotation with the summary
            const span = document.createElement('span');
            const comment = new CommentAnnotation(span, this.range, this.summary, this.markup_key);
            comment.performAnnotation();

            return this.summary;
        } catch (error) {
            console.error('Error generating summary:', error);
            throw error;
        }
    }
}