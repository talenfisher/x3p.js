import ElementTree from "./elementtree";

export default function parse(source) {
    let tree = new ElementTree();
    tree.parse(source);
    return tree;
}