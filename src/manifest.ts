import Tree from "./tree.xml";
import DEFAULT_MASK from "./mask.xml";
import md5 from "blueimp-md5";
import Mask from "./mask/index";

declare var window: any;

const ATTRIBUTES = [
    "disabled",
    "type",
];

const DOCTYPE = '<?xml version="1.0" encoding="UTF-8"?>';
const Parser = new window.DOMParser();
const Serializer = new window.XMLSerializer();

/**
 * Serializes a DOM tree into XML
 * 
 * @param value the dom tree to serialize
 */
function serialize(value: Document | Element): string {
    // @ts-ignore
    for(let node of value.querySelectorAll("*")) {
        for(let attr of ATTRIBUTES) {
            node.removeAttribute(attr);
        }
    }
    
    let result = Serializer.serializeToString(value);
    return result.match(/<\?xml/g) ? result : DOCTYPE + "\n" + result;
}

const $serialization = Symbol();
const $checksum = Symbol();
const $defaultMask = Symbol();

/**
 * Class for interacting with the data found in an X3P's main.xml file. 
 * 
 * @remarks
 * Currently depends on HTML5/DOM APIs.
 * I plan on rewriting this using the sax.js parser in the future to remove
 * the need for jsdom in node.js and similar environments.  
 * 
 * @author Talen Fisher
 */
export default class Manifest {

    /**
     * The mask template to use
     */
    private defaultMask: string;

    /**
     * Dom tree created from the user-provided XML
     */
    private data: Document;

    /**
     * The manifest's dom tree
     */
    private tree: Document;

    /**
     * An array of open nodes (used for merging the user-provided and tree.xml trees)
     */
    private openNodes: string[] = [];

    /**
     * Parser errors that occurred
     */
    private error?: Element;

    /**
     * Counts the number of nodes per path/query selector (ie "Record1 Revision" occurs 1 time, "Record3 Mask Annotations Annotation" occurs n times)
     */
    private nodeCounts: { [name: string]: number } = {};
    
    /**
     * Cached serialization
     */
    private [$serialization]?: string;

    /**
     * Cached checksum
     */
    private [$checksum]?: string;

    /**
     * Constructs a new Manifest object
     * 
     * @param source the source XML to parse
     * @param defaultMask mask to use if the user doesn't supply one
     */
    constructor(source: string, userSpecifiedDefaultMask?: string) {
        if(userSpecifiedDefaultMask && !Mask.isValidMask(userSpecifiedDefaultMask)) {
            throw new Error("Invalid mask specified.");
        }

        this.defaultMask = userSpecifiedDefaultMask || DEFAULT_MASK;
        this.tree = this.prepareTree();
        this.data = Parser.parseFromString(source, "text/xml");
        
        this.removeErrors();
        this.merge();

        // @ts-ignore - don't need to keep this tree in memory
        this.data = null;
    }

    /**
     * Gets a value from a node in the tree via a CSS query selector
     * ex: manifest.get('Mask Annotation\[color="#ffffff"\]');
     * 
     * @param selector query selector for the node to select
     */
    public get(selector: string): number | string | undefined {
        let element = this.tree.querySelector(selector);
        if(!element) return undefined;
        
        let value = element.innerHTML as unknown;
        return (!Number.isNaN(parseFloat(value as string)) && isFinite(value as number)) ? Number(value) as number : value as string;
    }

    /**
     * Sets a value in the tree via a CSS query selector
     * ex: manifest.set('Mask Annotation\[color="#ffffff"\]', "test annotation");
     * If the node does not exist, it will be created.
     * 
     * @param selector query selector for the node to set
     * @param value the new value for the node
     */
    public set(selector: string, value: any) {
        let element = this.tree.querySelector(selector);

        if(!element) {
            let nodes = selector.split(" ");
            
            for(let i = 0; i < nodes.length; i++) {
                let nodeSelector = nodes.slice(0, i + 1).join(" ");
                let node = this.tree.querySelector(nodeSelector);

                if(!node) {
                    let parent = i === 0 ? this.tree.documentElement : this.tree.querySelector(nodes.slice(0, i).join(" ")) as Element;                 
                    node = this.tree.createElement(nodes[i]);

                    parent.appendChild(node);
                }

                element = node;
            }
        }

        if(element) {
            element.innerHTML = value;
        }

        this[$serialization] = undefined;
        this[$checksum] = undefined;
    }

    /**
     * Check to see if the tree has a node via CSS Query selector
     * ex: manifest.has("Record3");
     * 
     * @param selector query selector for the node to check for
     */
    public has(selector: string) {
        return this.tree.querySelector(selector) !== null;
    }

    /**
     * Removes a node from the tree via CSS Query selector
     * ex: manifest.remove("Record3 Mask");
     * 
     * @param selector query selector for the node to remove
     */
    public remove(selector: string) {
        if(!this.has(selector)) return;

        let node = this.getNode(selector);
        if(!node) return;

        let parent = node.parentNode;
        if(!parent) return;

        parent.removeChild(node);

        this[$serialization] = undefined;
        this[$checksum] = undefined;
    }

    /**
     * Select a node from the tree via CSS query selector
     * @param selector 
     */
    public getNode(selector: string): Element | null {
        return this.tree.querySelector(selector);
    }

    /**
     * Get the manifest's tree
     */
    public getTree() {
        return this.tree;
    }

    /**
     * Get the XML representation of the manifest
     */
    public toString(): string {
        return (this[$serialization] ? this[$serialization] : this[$serialization] = serialize(this.tree)) as string;
    }

    /**
     * Get the md5 checksum of the manifest
     */
    public get checksum() {
        return this[$checksum] ? this[$checksum] : this[$checksum] = md5(this.toString());
    }

    /**
     * Prepares the source tree XML with the mask template
     */
    private prepareTree() {
        let src = Tree;

        if(typeof this.defaultMask !== "undefined") {
            src = src.replace("<Mask/>", this.defaultMask);
        }

        return Parser.parseFromString(src, "text/xml");
    }

    /**
     * Recursively merge the tree.xml dom tree with the user-defined one
     * that was parsed in the constructor
     * 
     * @param parent the node to merge
     */
    private merge(parent: Element = this.data.documentElement as Element) {
        let isRoot = parent === this.data.documentElement;
        
        if(!isRoot) {
            this.openNodes.push(parent.nodeName);
            
            if(!this.activeNode || this.currentNodeCount > 0) {
                let nextParent = this.openNodes.length === 1 ? this.tree.documentElement as Element : null;
                
                if(!nextParent) {
                    let selector = this.openNodes.slice(0, this.openNodes.length - 1).join(" ");
                    nextParent = this.tree.querySelector(selector);    
                }

                let child = this.tree.createElement(parent.nodeName);
                this.mergeAttributes(child, parent);

                if(nextParent) {
                    nextParent.appendChild(child);
                }
            }
        }
        
        if(parent.children.length > 0) {
            for(let child of Array.from(parent.children)) {
                this.merge(child);       
            }
            
        } else if(this.activeNode) {        
            this.mergeAttributes(this.activeNode, parent);
            if(parent.innerHTML) this.activeNode.innerHTML = parent.innerHTML;
            
            this.currentNodeCount = this.currentNodeCount + 1;
        }

        this.openNodes.pop();
    }

    /**
     * Merge the attributes of two nodes
     * 
     * @param target the target node to apply attributes to
     * @param source the source node to apply attributes from
     */
    private mergeAttributes(target: Element, source: Element) {
        for(let attr of source.getAttributeNames()) {
            target.setAttribute(attr, source.getAttribute(attr) as string);
        }
    }

    /**
     * Remove any parser errors from the dom tree created from the user's XML
     */
    private removeErrors() {
        // remove parsererror and store it in this.error
        let error = this.data.querySelector("parsererror");
        if(error) {
            let errorParent = error.parentElement;
            
            if(errorParent) {
                errorParent.removeChild(error);
                this.error = error;
            }
        }
    }

    /**
     * Get the current node path name
     */
    private get pathName() {
        return this.openNodes.join(" ");
    }

    /**
     * Find how many times the current node has already appeared
     */
    private get currentNodeCount() {
        return this.pathName in this.nodeCounts ? this.nodeCounts[this.pathName] : 0;
    }

    /**
     * Update how many times the current node has appeared
     */
    private set currentNodeCount(value: number) {
        this.nodeCounts[this.pathName] = value;
    }

    /**
     * Get the active node
     */
    private get activeNode() {
        return this.pathName ? this.tree.querySelector(this.pathName + `:nth-of-type(${this.currentNodeCount + 1})`) : undefined;
    }
}
