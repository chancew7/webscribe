
export class markup{

    constructor (url,  markup_key, annotations = null){
        this.url = url;
        this.markupKey = markup_key;
        this.annotations = annotations;
    }

    addAnnotation(annotation){
        this.annotations.add(annotation);
    }
    removeAnnotation(annotation){
        this.annotations.remove(annotation);
    }
    clearAllAnnotations(){
        //for annotation in annotations annotation.remove
        annotations.clear();
    }

    annotationsToJSON() {
        return {
          annotations: Array.from(this.annotations).map(annotation => annotation.toJSON()),
        };
      }
    

}