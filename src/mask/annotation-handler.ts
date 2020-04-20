// Proxy handlers for Mask Annotations

function ownKeys(target: Element) {
    const annotations = Array.from(target.querySelectorAll('Annotations Annotation'));
    return annotations
        .map(annotation => annotation.getAttribute("color"))
        .filter(color => color != null) as string[];
}


function getOwnPropertyDescriptor(target: Element, prop: string) {
    const value = get(target, prop);
    
    if(value != null) {
        return {
            enumerable: true,
            configurable: true,
            value,
        };
    }
}

function get(target: Element, prop: string) {
    let el = target.querySelector(`Annotations Annotation[color="${prop}"]`);
    return el ? el.innerHTML : undefined;
}

function set(target: Element, prop: string, value: any) {
    let doc = target.ownerDocument as Document;
    
    let annotations = target.querySelector(`Annotations`);
    if(!annotations) {
        annotations = doc.createElement("Annotations");
        target.appendChild(annotations);
    }

    let el = annotations.querySelector(`Annotation[color="${prop}"]`);
    if(!el) {
        el = doc.createElement("Annotation");
        el.setAttribute("color", prop);
        annotations.appendChild(el);
    }

    el.innerHTML = value;
    return true;
}

export default {
    ownKeys,
    getOwnPropertyDescriptor,
    get,
    set,
};
