import Tree from "./tree.xml";
declare var window: any;
const Parser = new window.DOMParser();

export default class Manifest {
    private source: string;
    private data: Document;
    private tree = Parser.parseFromString(Tree, "text/xml");
    private openNodes: string[] = [];

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
        return this.tree.querySelector(this.pathName);
    }

    public get(selector: string) {
        let value = this.tree.querySelector(selector).innerHTML;
        return (!Number.isNaN(parseFloat(value)) && isFinite(value)) ? Number(value) : value;
    }

    public getTree() {
        return this.tree;
    }
}