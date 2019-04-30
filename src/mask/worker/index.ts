import Color from "@talenfisher/color";

interface WorkerOptions {
    imageData: Uint8ClampedArray;
    annotations: string[];
    background: string;
    version: number;
}

function nearestColor(needle: Color, haystack: Color[]) {
    if(haystack.length === 0) return needle;

    let least = Math.abs(needle.distanceTo(haystack[0]));
    let i = 0;

    for(let j = 1; j < haystack.length; j++) {
        let distance = Math.abs(needle.distanceTo(haystack[j]));

        if(distance < least) {
            least = distance;
            i = j;
        }
    }

    return haystack[i];
}

onmessage = (e) => {
    let version = e.data.version;
    let imageData = e.data.imageData;
    let background: Color = new Color(e.data.background);
    let annotations: Color[] = e.data.annotations
        .map((key: string) => new Color(key))
        .sort((a: Color, b: Color) => b.value - a.value);

    console.log(annotations);

    let colors: { [name: string]: Color } = {};
    for(let i = 0; i < imageData.length - 4; i += 4) {
        let color = new Color();
        color.r = imageData[i];
        color.g = imageData[i + 1];
        color.b = imageData[i + 2];

        let j = (0xfffffff / color.value) % (annotations.length - 1);
        let newColor: Color = color;

        if(version === 1) {
            if(color.distanceTo(background) <= 150) {
                newColor = background;
            } else {
                let prevColors = annotations.concat(Object.values(colors));
                let nearest = nearestColor(color, prevColors);

                if(Math.abs(color.distanceTo(nearest)) <= 150) {
                    newColor = nearest;
                }
            }

            imageData[i + 0] = newColor.r;
            imageData[i + 1] = newColor.g;
            imageData[i + 2] = newColor.b;
        }
        
        colors[newColor.hex6] = newColor;
    }

    // @ts-ignore
    postMessage({ imageData, colors: Object.keys(colors) }, [ imageData.buffer ]);
};
