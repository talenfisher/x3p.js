import X3P from "../../src";

interface Window {
    [name: string]: any;
}

declare var window: Window;

(async () => {
    let response = await fetch("./test.x3p");
    let file = await response.arrayBuffer();

    window.x3p = (await new X3P({ file, name: "test" })) as any;
    let canvas = document.querySelector("canvas");
    // window.x3p.render(canvas);
})();
