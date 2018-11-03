import ElementTree from "elementtree";

export default class Manifest {

    /**
     * Constructs a new manifest object
     * 
     * @param {string} source the source string of an X3P's main.xml file.
     */
    constructor(source) {
        this._source = source;
        this._data = ElementTree.parse(this._source);
    }

    /**
     * Getter for the source string (readonly)
     * 
     * @return {string} the source string
     */
    get source() {
        return this._source;
    }

    /**
     * Getter for data object (JSDOM document)
     * 
     * @return {Document} the result document
     */
    get data() {
        return this._data;
    }

    /**
     * Find an element in the manifest using CSS-like selectors.
     * 
     * @param {string} selector the query selector
     * @return {Element} the resulting element
     */
    get(selector) {
        let el = this.data.find(selector);
        return el !== null ? el.text : null;
    }

    /**
     * Sets the value of an element in the manifest
     * 
     * @param {string} selector query selector for target element
     * @param {*} value value to set the node's inner value to
     */
    set(selector, value) {
        let el = this.data.find(selector);

        if(el !== null) el.text = value;
    }
}