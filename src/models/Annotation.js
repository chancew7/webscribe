import { ActionType } from '../constants.js';

export class Annotation {
    constructor(selection, url, markup_key) {
        this.selection = selection;
        this.url = url;
        this.markup_key = markup_key;
        this.type = ActionType.HIGHLIGHT; // default type
    }
} 