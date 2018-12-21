export default {
    get: (target: Element, prop: string) => {
        let el = target.querySelector(`Annotations Annotation[color='${prop}']`);
        return el ? el.innerHTML : undefined;
    },

    set: (target: Element, prop: string, value: any) => {
        let doc = target.ownerDocument as Document;
        
        let annotations = target.querySelector(`Annotations`);
        if(!annotations) {
            annotations = doc.createElement("Annotations");
            target.appendChild(annotations);
        }

        let el = annotations.querySelector(`Annotation[color='${prop}']`);
        if(!el) {
            el = doc.createElement("Annotation");
            el.setAttribute("color", prop);
            annotations.appendChild(el);
        }

        el.innerHTML = value;
        return true;
    },
};
