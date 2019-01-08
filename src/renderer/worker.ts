import { mallocFloat } from "typedarray-pool";
import Matrix from "../matrix";
import Quad from "./quad";

self.onmessage = (e) => {
    let options = Object.assign(e.data, { epsilon: 0.0001 });
    let matrix = new Matrix(e.data);
    let vertexCount = 0;
        
    let min = matrix.min;
    let max = matrix.max;
    let diff = max - min;

    let sx = matrix.x.size - 1;
    let sy = matrix.y.size - 1;
    let size = sx * sy * 6;
    size = Math.pow(2, Math.ceil(Math.log(size) / Math.log(2)));

    let coords = mallocFloat(8 * size);
    let ptr = 0;

    xLoop: for(let x = 0; x < sx; x++) {
        yLoop: for(let y = 0; y < sy; y++) {

            for(let dx = 0; dx < 2; dx++) {
                for(let dy = 0; dy < 2; dy++) {
                    let z = matrix.get(1 + x + dx, 1 + y + dy, 2);
                    if(typeof z === "undefined") continue yLoop;
                }
            }

            for(let q = 0; q < 6; q++) {
                let i = x + Quad[q][0];
                let j = y + Quad[q][1];

                let vertex = matrix.get(i + 1, j + 1) as number[];
                let normal = matrix.getNormal(i + 1, j + 1) as number[];

                coords[ptr++] = vertex[0];
                coords[ptr++] = vertex[1];
                coords[ptr++] = (vertex[2] - min) / diff;

                coords[ptr++] = normal[0];
                coords[ptr++] = normal[1];
                coords[ptr++] = normal[2];

                coords[ptr++] = i / (sx + 1);
                coords[ptr++] = j / (sy + 1);
                vertexCount++;
            }
        }
    }

    // @ts-ignore
    self.postMessage({
        vertexCount,
        elementCount: ptr,
        coords,
    });
};
