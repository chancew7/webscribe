
import * as constants from "../../constants.js";
import {Annotation} from './Annotation.js';


export class CommentAnnotation extends Annotation{
    constructor(span, range, message = "default message", markup_key, selectionIndex){
        super(span, range, markup_key, constants.ActionType.COMMENT);
        this.message = message;
        this.commentBox = document.createElement('textarea');
        this.selectionIndex = selectionIndex;
    }

    performAnnotation(preExisting){
        if (!preExisting){
            this.commentBox.placeholder = this.message;
        }
        else{
            this.commentBox.value = this.message;
        }
        this.setDefaultProperties();
        this.setDefaultLocation();
        this.enableDragging(this.commentBox);
        this.span.style.backgroundColor = constants.HighlightColors.COMMENT_COLOR; 
        this.addFocusListeners();
        document.body.appendChild(this.commentBox);

        this.commentBox.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                e.stopPropagation();
            }
        });

        this.commentBox.addEventListener('input', (event) => {
            this.message = event.target.value;
        });
        if (!preExisting){
            this.addToMarkup();
        }
    }

    addToMarkup(){
        const annotationData = this.toJson();
        chrome.runtime.sendMessage({
            key: constants.MessageKeys.SAVE_ANNOTATION,
            annotation: annotationData
        });
    }
    toJson(){
        return {
            id: super.generateAnnotationId(),
            type: this.annotationType,
            text: this.range.toString(),
            markup_key: this.markup_key,
            message: this.message,
            selectionIndex: this.selectionIndex
        }
    }

    removeAnnotation(){
        this.commentBox.parentNode.removeChild(this.commentBox);
        this.commentBox = null;
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
    setDefaultLocation(){
        if (this.range && this.range.getBoundingClientRect){
            const rect = this.range.getBoundingClientRect();
            const topPosition = rect.top + window.scrollY - parseInt(this.commentBox.style.height);
            this.commentBox.style.top = `${topPosition}px`;
            this.commentBox.style.right = `20px`;
        }
    }
    changeLocation(rightDistance, downDistance){
        this.commentBox.style.right = rightDistance;
        this.commentBox.style.top = downDistance;
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
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }
    addFocusListeners() {
        this.commentBox.addEventListener('focus', () => {
            this.span.style.backgroundColor = constants.HighlightColors.COMMENT_COLOR; 
        
            const onKeyDown = (event) => {
                if (event.key === 'Delete') {
                    this.removeAnnotation();
                }
            };
        
            this.commentBox.addEventListener('keydown', onKeyDown);

            this.commentBox.addEventListener('blur', () => {
                this.span.style.backgroundColor = 'transparent';
                this.commentBox.removeEventListener('keydown', onKeyDown);
                this.addToMarkup();
            });
        });
    }
}