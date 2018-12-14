import { default as sax, SAXParser, Tag }  from "sax";
import Promisable from "../promisable";
import Manifest from "../manifest";
import Node from "../node";

export default class Parser extends Promisable<Parser> {
    private sax: SAXParser = sax.parser(true, {});
    private manifest: Manifest = new Manifest;
    private opentags: Array<string> = [];

    constructor(manifest: string) {
        super();
        this.sax.ontext = this.ontext;
        this.sax.onopentag = this.onopentag;
        this.sax.onclosetag = this.onclosetag;

        this.promise = new Promise((resolve, reject) => {
            this.sax.onerror = e => reject(e);
            this.sax.onend = () => resolve(this);
        });

        
    }
    
    private onopentag(node: Tag) {
        this.opentags.push(node.name);
    }

    
    private ontext(text: string) {
        let node = this.manifest;
        for(let tag of this.opentags) {
            if(!(tag in node)) return;

            //@ts-ignore
            node = node[tag];
        }

        //@ts-ignore
        node.value = text;
    }

    private onclosetag() {
        this.opentags.pop();
    }
}