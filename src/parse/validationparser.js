import { XMLParser } from "elementtree/lib/parsers/sax";
import { TreeBuilder } from "elementtree/lib/treebuilder";
import Schema from "../schema";

export default class ValidationParser extends XMLParser {
    constructor(target) {
        super(target);
        this.errors = [];
        this.opentags = [];
    }

    /**
     * Handles an opening tag (ie <head>)
     */
    _handleOpenTag(tag) {
        super._handleOpenTag(tag);
        let name = tag.name;
        this.opentags.push(name);

        if(this.opentags.length === 1 && tag.name.indexOf(":") !== -1) {

            let ns = Object.keys(tag.attributes).find(value => {
                let matches = value.match(/xmlns:(.*)/g);
                if(matches.length > 0) return true;
            });

            ns = ns.replace("xmlns:", "");
            name = name.replace(ns+":", "");
        }
        

        let el = Schema.find(`.//xsd:element[@name='${name}']`);
        if(el === null) this.errors.push({ type: "notfound", path: this.path });
        this.current = el;
    }

    /**
     * Handles a text node
     */
    _handleText(text) {
        super._handleText(text);
        if(text.trim() === "") return;

        let ok = true, options = [];

        
        let findType = (type, current = this.current) => {
            let number;

            switch(type) {

            case "xsd:unsignedLong":
                number = parseFloat(text);
                ok = !isNaN(number) && number > 0;
                break;
                
            case "xsd:double":
                ok = !isNaN(parseFloat(text));
                break;

            case "xsd:dateTime":
                ok = !isNaN(Date.parse(text));
                break;
            
            case "xsd:hexBinary":
                ok = /^[0-9A-Fa-f]{1,64}$/.test(text);
                break;

            case "xsd:restriction":
                ok = false;

                for(let child of current._children) {
                    if(child.tag === "xsd:enumeration") {
                        options.push(child.attrib.value);

                        if(child.attrib.value === text) ok = true;
                    }
                }

                break;

            case "xsd:simpleType":
            case undefined:
                for(let child of current._children) {
                    findType(child.tag, child);
                }

                break;
            
            default: break;
            }
        };

        findType(this.current.attrib.type);

        if(!ok) {
            let error = { type: "badType", path: this.path, expected: this.current.attrib.type };
            if(options.length > 0) error.expected = options;
            this.errors.push(error);
        }
    }

    /**
     * Handles CDATA tags
     */
    _handleCdata(text) {
        super._handleCdata(text);
    }

    /**
     * Handles <!DOCTYPE> tags
     */
    _handleDoctype(text) {
        super._handleDoctype(text);
    }

    /**
     * Handles Comment tags
     */
    _handleComment(comment) {
        super._handleComment(comment);
    }

    /**
     * Handles closing tags (ie </head>)
     */
    _handleCloseTag(tag) {
        super._handleCloseTag(tag);
        
        if(this.opentags[this.opentags.length - 1] === tag) {
            this.opentags.pop();
        }
    }

    /**
     * Handles parse errors
     */
    _handleError(err) {
        super._handleError(err);
    }

    /**
     * Feeds chunks of data to the parser
     */
    feed(chunk) {
        super.feed(chunk);
    }

    /**
     * Ends parsing
     */
    close() {
        return super.close();

    }

    /** 
     * Returns the path to the current node
     */
    get path() {
        return this.opentags.join("/");
    }

    /**
     * Creates a new Parser
     */
    static create() {
        return new ValidationParser(new TreeBuilder);
    }
}