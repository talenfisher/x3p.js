import { ElementTree as ElementTreeOriginal } from "elementtree";
import ValidationParser from "./validationparser";

export default class ElementTree extends ElementTreeOriginal {
    parse(source) {
        let parser = ValidationParser.create();
        parser.feed(source);
        
        this._root = parser.close();
        this.errors = parser.errors;
        
        return this._root;
    }
}