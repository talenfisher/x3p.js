// Proxy handlers for Mask Annotations

function ownKeys(target: Element): string[] {
    const annotations = Array.from(target.querySelectorAll("Annotations Annotation"));
    const colors: { [color: string]: boolean } = {};
    
    for(const annotation of annotations) {
        const color = annotation.getAttribute("color");

        if(color == null) {
            continue;
        }

        colors[color] = true;
    }

    return Object.keys(colors);
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
