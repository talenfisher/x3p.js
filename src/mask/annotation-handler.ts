import { Element, ElementTree, SubElement } from "elementtree";

export default {
    get: (target: ElementTree | Element, prop: string) => {
        let el = target.find(`./Annotations/Annotation[@color='${prop}']`);
        return el !== null ? el.text : undefined;
    },

    set: (target: ElementTree | Element, prop: string, value: any) => {
        // @ts-ignore
        let root = (typeof target.getroot !== "undefined") ? (<ElementTree> target).getroot() : <Element> target;
        let annotations = target.find(`./Annotations`) || SubElement(root, "Annotations");
        let el = annotations.find(`./Annotation[@color='${prop}']`) || SubElement(annotations, "Annotation");

        el.set("color", prop);
        el.text = value;
        return true;
    },
};
