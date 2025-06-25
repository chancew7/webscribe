
import * as constants from "../../constants.js";
import {Annotation} from './Annotation.js';


export class CommentAnnotation extends Annotation{
    constructor(span, range, message = "default message", markup_key, selectionIndex, x = "", y = "", id = ""){
        super(span, range, markup_key, constants.ActionType.COMMENT);
        this.message = message;
        this.commentBox = document.createElement('textarea');
        this.selectionIndex = selectionIndex;
        this.id = id;
        this.xCoord = x;
        this.yCoord = y;
        this.textAffiliation = false;
        this.focused = true;
        if (this.span != null && this.range != null){
            this.textAffiliation = true;
        }
    }

    performAnnotation(preExisting){
        if (!preExisting){
            this.commentBox.placeholder = this.message;
        }
        else{
            this.commentBox.value = this.message;
        }
        this.setDefaultProperties();
        this.setDefaultLocation(preExisting);
        this.enableDragging(this.commentBox);
        if (this.textAffiliation) this.span.style.backgroundColor = constants.HighlightColors.COMMENT_COLOR;
        this.addFocusListeners();
        document.body.appendChild(this.commentBox);

        this.commentBox.addEventListener('input', (event) => {
            this.message = event.target.value;
        });
        if (!preExisting){
            this.addToMarkup();
        }
    }

    addToMarkup(){
        this.id = super.generateAnnotationId();
        const annotationData = this.toJson();
        chrome.runtime.sendMessage({
            key: constants.MessageKeys.SAVE_ANNOTATION,
            annotation: annotationData
        });
    }

    updateCommentText(){
        chrome.runtime.sendMessage({
            key: constants.MessageKeys.UPDATE_COMMENT_TEXT,
            new_comment: this.message,
            id: this.id, 
            markup_key: this.markup_key
        })
    }

    updateCommentLocation(){
        chrome.runtime.sendMessage({
            key: constants.MessageKeys.UPDATE_COMMENT_LOCATION,
            newXCoord: this.xCoord,
            newYCoord: this.yCoord,
            id: this.id, 
            markup_key: this.markup_key
        });
    }

    toJson(){
        return {
            id: this.id,
            type: this.annotationType,
            text: this.range.toString(),
            markup_key: this.markup_key,
            message: this.message,
            selectionIndex: this.selectionIndex,
            xCoord: this.xCoord, 
            yCoord: this.yCoord
        }
    }

    removeAnnotation(){
        this.commentBox.parentNode.removeChild(this.commentBox);
        this.commentBox = null;

        chrome.runtime.sendMessage({
            key: constants.MessageKeys.DELETE_COMMENT,
            id: this.id, 
            markup_key: this.markup_key
        })

        //remove comment box from database
    }

    setDefaultProperties(){
        this.commentBox.style.position = 'absolute';
        this.commentBox.style.width = '300px';
        this.commentBox.style.height = '150px';
        this.commentBox.style.zIndex = '1000';
        this.commentBox.style.backgroundColor = '#fff';
        this.commentBox.style.border = '2px solid #ccc';
        this.commentBox.style.padding = '10px';
        this.commentBox.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
    }
    setDefaultLocation(preExisting){
            
        const boxWidth = parseInt(this.commentBox.style.width); // 300
        const margin = 20; // same as before
    
        if (!preExisting) {
            const rect = this.range.getBoundingClientRect();
            const topPosition = rect.top + window.scrollY - parseInt(this.commentBox.style.height);
    
            const leftPosition = window.innerWidth - boxWidth - margin;
    
            this.xCoord = `${leftPosition}px`;
            this.yCoord = `${topPosition}px`;
    
            this.commentBox.style.top = this.yCoord;
            this.commentBox.style.left = this.xCoord;
        } else {
            this.commentBox.style.top = this.yCoord;
            this.commentBox.style.left = this.xCoord;
        }
            
    }

    enableDragging(element){
        let isDragging = false;
        let offsetX, offsetY;

        element.addEventListener('mousedown', (event) => {
            isDragging = true;
            offsetX = event.clientX - element.getBoundingClientRect().left;
            offsetY = event.clientY - parseFloat(element.style.top);

            const onMouseMove = (moveEvent) => {
                if (isDragging){
                    element.style.left = moveEvent.clientX - offsetX + 'px';
                    element.style.top = moveEvent.clientY - offsetY + 'px';
                }
            };
            const onMouseUp = () => {
                isDragging = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                this.xCoord = `${element.style.left}`;
                this.yCoord = `${element.style.top}`;
                this.updateCommentLocation();
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

    }
    addFocusListeners() {
        this.commentBox.addEventListener('focus', () => {
            this.focused = true;
            if (this.textAffiliation) this.span.style.backgroundColor = constants.HighlightColors.COMMENT_COLOR; 
        
            const onKeyDown = (event) => {
                if (event.key === 'Delete') {
                    this.removeAnnotation();
                }
            };
        
            this.commentBox.addEventListener('keydown', onKeyDown);

            this.commentBox.addEventListener('blur', () => {
                this.focused = false
                if (this.textAffiliation) this.span.style.backgroundColor = 'transparent';
                this.commentBox.removeEventListener('keydown', onKeyDown);
                this.updateCommentText();
            });
        });
    }

}