import * as constants from "../../constants.js";
import { Annotation } from './Annotation.js';

export class HighlightAnnotation extends Annotation{

    //span, range, annotation.color, annotation.markup_key, annotation.selectionIndex

    constructor(span, range, color = HighlightColors.DEFAULT, markup_key, selectionIndex){
        super(span, range, markup_key, constants.ActionType.HIGHLIGHT);
        console.log("highlight constructor");
        this.color = color;
        this.highlighted = false;
        this.selectionIndex = selectionIndex;
    }
    performAnnotation(preExisting){
        if (!this.highlighted){
            this.showAnnotation();
        }
        else{
            this.removeAnnotation();
        }
        if (!preExisting){
            console.log("adding highlight to markup");
            this.addToMarkup();
        }
        
    }

    getOverlappingHighlights() {
        const highlights = document.querySelectorAll('span[data-annotation="highlight"]');
        const overlappingHighlights = [];
        highlights.forEach(highlight => {
            // Create a range for the entire contents of the highlight span.
            const highlightRange = document.createRange();
            highlightRange.selectNodeContents(highlight);
            if (this.range.intersectsNode(highlight)) {
                overlappingHighlights.push(highlight);
            }
        });
        return overlappingHighlights;
    }

    mergeHighlights(overlappingHighlights) {
        // Create a new range that starts as the new selection
        let mergedRange = document.createRange();
        mergedRange.setStart(this.range.startContainer, this.range.startOffset);
        mergedRange.setEnd(this.range.endContainer, this.range.endOffset);

        // Expand mergedRange to include each overlapping highlight’s range.
        overlappingHighlights.forEach(highlight => {
            const highlightRange = document.createRange();
            highlightRange.selectNodeContents(highlight);
            if (highlightRange.compareBoundaryPoints(Range.START_TO_START, mergedRange) < 0) {
                mergedRange.setStart(highlightRange.startContainer, highlightRange.startOffset);
            }
            if (highlightRange.compareBoundaryPoints(Range.END_TO_END, mergedRange) > 0) {
                mergedRange.setEnd(highlightRange.endContainer, highlightRange.endOffset);
            }
        });

        // Remove (unwrap) each overlapping highlight so that we can reapply a single merged highlight.
        overlappingHighlights.forEach(highlight => {
            // Unwrap the highlight span by moving its children into its parent.
            while (highlight.firstChild) {
                highlight.parentNode.insertBefore(highlight.firstChild, highlight);
            }
            highlight.parentNode.removeChild(highlight);
        });

        // Update the instance’s range to the merged range and show the new annotation.
        this.range = mergedRange;
        this.showAnnotation();
    }

    /*
    showAnnotation() {
        console.log("showing highlight");
        console.log("span = ", this.span);
        console.log("this.range = ", this.range);
        console.log("this.color = ", this.color);
        const span = document.createElement('span');
        span.style.backgroundColor = this.color;
        span.setAttribute('data-annotation', 'highlight');
        // Surrounding the contents of this.range with the new span.
        this.range.surroundContents(span);
        this.highlighted = true;
    }
        */
    showAnnotation(){
        this.span.style.backgroundColor = this.color;
        this.highlighted = true;      
    }

    addToMarkup() {
        const annotationData = this.toJson();
        chrome.runtime.sendMessage({
            key: constants.MessageKeys.SAVE_ANNOTATION,
            annotation: annotationData
        });
    }

    toJson() {
        
        let selectedText = this.range.toString();

        return {
            id: super.generateAnnotationId(),
            type: this.annotationType,
            text: selectedText,
            markup_key: this.markup_key,
            color: this.color,
            selectionIndex: this.selectionIndex
        }
    }

    removeAnnotation() {
        this.span.style.backgroundColor = constants.HighlightColors.TRANSPARENT;
        this.highlighted = false;
    }
}
