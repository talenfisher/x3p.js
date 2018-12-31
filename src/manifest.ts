import Tree from "./tree.xml";

import md5 from "blueimp-md5";

declare var window: any;

const DOCTYPE = '<?xml version="1.0" encoding="UTF-8"?>';
const Parser = new window.DOMParser();
const Serializer = new window.XMLSerializer();
const serialize = (value: any) => DOCTYPE + "\n" + Serializer.serializeToString(value);
const $string = Symbol();

export default class Manifest {
    private source: string;
    private data: Document;
    private tree = Parser.parseFromString(Tree, "text/xml");
    private openNodes: string[] = [];
    private [$string]?: string;

    constructor(source: string) {
        this.source = source;
        this.data = Parser.parseFromString(this.source, "text/xml");
        this.merge();
    }

    private merge(parent: Element = this.data.documentElement as Element) {
        let isRoot = parent == this.data.documentElement;
        
        if(!isRoot) {
            this.openNodes.push(parent.nodeName);
            
            if(!this.activeNode) {
                let nextParent = this.openNodes.length === 1 ? this.tree.documentElement : undefined;
                
                if(!nextParent) {
                    let selector = this.openNodes.slice(0, this.openNodes.length - 1).join(" ");
                    nextParent = this.tree.querySelector(selector);    
                }
                
                let child = this.tree.createElement(parent.nodeName);
                nextParent.appendChild(child);
            }
        }
        
        if(parent.children.length > 0) {
            for(let child of Array.from(parent.children)) {
                this.merge(child);       
            }
        } else if(this.activeNode) {           
            this.activeNode.innerHTML = parent.innerHTML;
        }

        this.openNodes.pop();
    }


    private get pathName() {
        return this.openNodes.join(" ");
    }

    private get activeNode() {
        return this.pathName ? this.tree.querySelector(this.pathName) : undefined;
    }

    public get(selector: string) {
        let element = this.tree.querySelector(selector);
        if(!element) return undefined;
        
        let value = element.innerHTML;
        return (!Number.isNaN(parseFloat(value)) && isFinite(value)) ? Number(value) : value;
    }

    public getNode(selector: string) {
        return this.tree.querySelector(selector);
    }

    public set(selector: string, value: any) {
        let element = this.tree.querySelector(selector);

        if(!element) {
            let nodes = selector.split(" ");
            
            for(let i = 0; i < nodes.length; i++) {
                let selector = nodes.slice(0, i + 1).join(" ");
                let node = this.tree.querySelector(selector);

                if(!node) {
                    let parent = i === 0 ? this.tree.documentElement : undefined;
                    parent = parent || this.tree.querySelector(nodes.slice(0, i).join(" "));                    
                    
                    node = this.tree.createElement(nodes[i]);
                    parent.appendChild(node);
                }

                element = node;
            }
        }

        element.innerHTML = value;
        this[$string] = undefined;
    }

    public has(selector: string) {
        return this.tree.querySelector(selector) !== null;
    }

    public remove(selector: string) {
        if(!this.has(selector)) return;
        let node = this.getNode(selector);
        node.parentNode.removeChild(node);
        this[$string] = undefined;
    }

    public getTree() {
        return this.tree;
    }

    public get checksum() {
        let stringVal = this.toString();
        return md5(stringVal);
    }

    public toString(): string {
        return (this[$string] ? this[$string] : this[$string] = serialize(this.tree)) as string;
    }
}