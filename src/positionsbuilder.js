import DATA_TYPES from "./datatypes";

const EPSILON = 0.0001;
const MULTIPLY = 5;
const AXES = ["x", "y", "z"];

/**
 * Generates vertex positions from the manifest (main.xml) and
 * binary matrix (bindata/data.bin)
 */
export default class PositionsBuilder {

    /**
     * Constructs a new matrix object
     */
    constructor({ manifest, data }) {
        this._manifest = manifest;
        this._data = data;
        this._result = [];
        this._sizes = {};
        this._types = {};
        this._increments = {};
        this._maxes = { x: NaN, y: NaN, z: NaN };

        this._bootstrap();
    }

    /**
     * Checks for valid options and sets up properties
     */
    _bootstrap() {
        this._checkAxes();
        this._buildPositions();
    }

    /**
     * Sets up variables that are dependent on axes
     */
    _checkAxes() {
        for(let axis of AXES) {
            this._checkAxisSize(axis);
            this._checkAxisDataType(axis);
            this._checkAxisIncrement(axis);
        }
    }

    /**
     * Checks for and sets up axis size variables
     */
    _checkAxisSize(axis) {
        let 
            xpath = `./Record3/MatrixDimension/Size${axis.toUpperCase()}`,
            value = this._manifest.getInt(xpath);

        if(value === null) {
            throw new Error(`'${xpath}' required in main.xml for generating vertex positions`);
        }

        this._sizes[axis] = value;
    }

    /**
     * Checks for and sets up data types
     */
    _checkAxisDataType(axis) {
        let 
            xpath = `./Record1/Axes/C${axis.toUpperCase()}/DataType`,
            value = this._manifest.get(xpath);
        
        if(value === null) {
            throw new Error(`'${xpath}' required in main.xml for generating vertex positions`);
        }

        value = value.toUpperCase();
        if(!(value in DATA_TYPES)) {
            throw new Error(`Unknown Data Type '${value}'`);
        }

        this._types[axis] = DATA_TYPES[value];
    }

    /**
     * Check for axis increments
     */
    _checkAxisIncrement(axis) {
        let 
            xpath = `./Record1/Axes/C${axis}/Increment`,
            value = this._manifest.getInt(xpath);

        if(value === null) {
            throw new Error(`${xpath} required in main.xml for generating vertex positions`);
        }

        this._increments[axis] = value / EPSILON;
    }

    /**
     * Build the positions matrix
     */
    _buildPositions() {
        let 
            positions = [],
            yCount = -1,
            points = new this._types.z(this._data);

        for(let i = 0; i < points.length; i++) {            
            let x = (i % this._sizes.x) * this._increments.x;
            let y = ((x === 0) ? ++yCount : yCount) * this._increments.y;
            let z = (points[i] / EPSILON) * MULTIPLY;

            if(!isNaN(z)) {
                if(isNaN(this._maxes.x) || this._maxes.x < x) this._maxes.x = x;
                if(isNaN(this._maxes.y) || this._maxes.y < y) this._maxes.y = y;
                if(isNaN(this._maxes.z) || this._maxes.z < z) this._maxes.z = z;
                
                positions.push(x, y, z);
            }
        }

        this._positions = new Float32Array(positions);
    }

    /**
     * Getter for positions
     */
    get result() {
        return this._positions;
    }
}