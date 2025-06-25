import * as constants from "../../constants.js";

export class Annotation {
    constructor(span, range, markup_key, annotationType) {
        this.markup_key = markup_key;
        this.span = span;
        this.range = range;
        this.annotationType = annotationType;

        try {
            this.range.surroundContents(this.span);
        } catch (e) {
            // Handle partially selected nodes by extracting contents
            if (this.range != null){
                const fragment = this.range.extractContents();
                this.span.appendChild(fragment);
                this.range.insertNode(this.span);
            }
            
        }

    }
    performAnnotation() { }
    addToMarkup() { }
    removeAnnotation() { }
    toJson() { }
    clearAll() {
        this.span.style.backgroundColor = constants.HighlightColors.TRANSPARENT;
        this.span.style.fontStyle = 'normal';
        this.span.style.textDecoration = 'none';
        this.span.style.fontWeight = 'normal';
    }
    generateAnnotationId(){
        const rand = Math.floor(Math.random() * 1000) + 1;

        const rangeStr = this.range.toString()
        const rangePre = rangeStr.slice(0, Math.min(10, rangeStr.length))

        const id = `${this.markup_key}-${this.annotationType}-${rangePre}-${rand}`;
        
        this.span.setAttribute('webscribe', id);

        return id
    }
    
    

 
}