interface NodeOptions {
    type: "string"|"enum"|"int"|"float";
    optional?: boolean;
    values?: Array<string>
}

export default class Node {
    public type: "string"|"enum"|"int"|"float";
    public value: any;
    public optional: boolean = false; 

    constructor(options: NodeOptions) {
        this.type = options.type;
        
        if(options.optional) {
            this.optional = options.optional;
        }
    }
}