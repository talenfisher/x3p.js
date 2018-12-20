import { ElementTree, SubElement } from "elementtree";

export default {
    get: (target: ElementTree, prop: string) => {
        let el = target.find(`./Annotations/Annotation[@color='${prop}']`);
        return el !== null ? el.text : undefined;
    },

    set: (target: ElementTree, prop: string, value: any) => {
        let annotations = target.find(`./Annotations`) || SubElement(target.getroot(), "Annotations");
        let el = annotations.find(`./Annotation[@color='${prop}']`) || SubElement(annotations, "Annotation");

        el.set("color", prop);
        el.text = value;
        return true;
    },
};
