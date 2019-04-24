import Tree from "./tree.xml";
import DefaultMask from "./mask.xml";

import md5 from "blueimp-md5";

declare var window: any;

const ATTRIBUTES = [
    "disabled",
    "type",
];

const DOCTYPE = '<?xml version="1.0" encoding="UTF-8"?>';
const Parser = new window.DOMParser();
const Serializer = new window.XMLSerializer();

const serialize = (value: any): string => {
    
    for(let node of value.querySelectorAll("*")) {
        for(let attr of ATTRIBUTES) {
            node.removeAttribute(attr);
        }
    }
    
    let result = Serializer.serializeToString(value);
    return result.match(/<\?xml/g) ? result : DOCTYPE + "\n" + result;
};

const $string = Symbol();
const $checksum = Symbol();
const $defaultMask = Symbol();

export default class Manifest {
    private static [$defaultMask]: string = DefaultMask;

    private data: Document;
    private tree: Document;
    private openNodes: string[] = [];
    private error?: Element;
    private nodeCounts: { [name: string]: number } = {};
    
    // cache helpers
    private [$string]?: string;
    private [$checksum]?: string;

    constructor(source: string) {
        this.tree = this.prepareTree();
        this.data = Parser.parseFromString(source, "text/xml");
        
        this.removeErrors();
        this.merge();

        // @ts-ignore
        this.data = null;
    }

    public static get defaultMask() {
        return this[$defaultMask];
    }

    public static set defaultMask(mask) {
        this[$defaultMask] = mask.trim() === "" ? DefaultMask : mask;
    }

    public get(selector: string) {
        let element = this.tree.querySelector(selector);
        if(!element) return undefined;
        
        let value = element.innerHTML as unknown;
        return (!Number.isNaN(parseFloat(value as string)) && isFinite(value as number)) ? Number(value) : value;
    }

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

        this[$string] = undefined;
        this[$checksum] = undefined;
    }

    public has(selector: string) {
        return this.tree.querySelector(selector) !== null;
    }

    public remove(selector: string) {
        if(!this.has(selector)) return;

        let node = this.getNode(selector);
        if(!node) return;

        let parent = node.parentNode;
        if(!parent) return;

        parent.removeChild(node);

        this[$string] = undefined;
        this[$checksum] = undefined;
    }

    public getNode(selector: string) {
        return this.tree.querySelector(selector);
    }

    public getTree() {
        return this.tree;
    }

    public toString(): string {
        return (this[$string] ? this[$string] : this[$string] = serialize(this.tree)) as string;
    }

    private prepareTree() {
        let src = Tree.replace("<Mask/>", Manifest.defaultMask);
        return Parser.parseFromString(src, "text/xml");
    }

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

    private mergeAttributes(target: Element, source: Element) {
        for(let attr of source.getAttributeNames()) {
            target.setAttribute(attr, source.getAttribute(attr) as string);
        }
    }

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

    private get pathName() {
        return this.openNodes.join(" ");
    }

    private get currentNodeCount() {
        return this.pathName in this.nodeCounts ? this.nodeCounts[this.pathName] : 0;
    }

    private set currentNodeCount(value: number) {
        this.nodeCounts[this.pathName] = value;
    }

    private get activeNode() {
        return this.pathName ? this.tree.querySelector(this.pathName + `:nth-of-type(${this.currentNodeCount + 1})`) : undefined;
    }

    public get checksum() {
        return this[$checksum] ? this[$checksum] : this[$checksum] = md5(this.toString());
    }
}
