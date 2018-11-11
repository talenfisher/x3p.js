import schema from "./iso5436_2.xml";
import { validateXML } from "@talenfisher/xmllint";

export default function lint(xml) {
    return validateXML({
        xml, 
        schema 
    });
}