

import * as constants from "../../constants.js";
import {Annotation} from './Annotation.js';

export class TextstyleAnnotation extends Annotation{
    constructor(span, range, type, markup_key, selectionIndex){
        super(span, range, markup_key, constants.ActionType.TEXTSTYLE);
        this.type = type; //bold, italic, underline
        console.log("textstyle annotation created. type = ", type);
        this.textstyles = {
            bolded: false,
            italicized: false,
            underlined: false
        };
        this.selectionIndex = selectionIndex;
    }

    performAnnotation(preExisting){

        switch(this.type){
            case constants.TextstyleType.BOLD:
                if (!this.textstyles.bolded){
                    this.showBold();
                }
                else{
                    this.removeBold();
                }
                break;
            case constants.TextstyleType.UNDERLINE:
                if(!this.textstyles.underlined){
                    this.showUnderline();
                }
                else{
                    this.removeUnderline
                }
                break;
            case constants.TextstyleType.ITALIC:
                if(!this.textstyles.italicized){
                    this.showItalic();
                }
                else{
                    this.removeItalic();
                }
                break;
        }
        if (!preExisting){
            this.addToMarkup();
        }
    }
    addToMarkup(){
        const annotationData = this.toJson();
        chrome.runtime.sendMessage({
            key:constants.MessageKeys.SAVE_ANNOTATION,
            annotation: annotationData
        });
    }
    removeMarkup(){}

    showBold(){
        this.span.style.fontWeight = 'bold';
    }
    removeBold(){
        this.span.style.fontWeight = 'normal';
    }
    showUnderline(){
        this.span.style.textDecoration = 'underline';
    }
    removeUnderline(){
        this.span.style.textDecoration = 'none';
    }
    showItalic(){
        this.span.style.fontStyle = 'italic';
    }
    removeItalic(){
        this.span.style.fontStyle = 'normal';
    }

    generateAnnotationId(){
        const rand = Math.floor(Math.random() * 1000) + 1;
        return `${this.markup_key}-${this.annotationType}-${this.range.toString()}-${this.selectionIndex}-${rand}`;
    }

    toJson(){
        let selectedText = this.range.toString();

        return{
            id: this.generateAnnotationId(),
            type: constants.ActionType.TEXTSTYLE,
            textstyleType: this.type,
            text: selectedText,
            markup_key: this.markup_key,
            selectionIndex: this.selectionIndex,
        }
    }
    

}