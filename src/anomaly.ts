/**
 * Represents an anomaly in the surface matrix
 */
export default interface Anomaly {

    /**
     * An identifier for the anomaly
     */
    identifier: string;

    /**
     * A description of what the anomaly entails
     */
    description: string;

    /**
     * An expected value or threshold
     */
    expected: any;

    /**
     * The actual value received
     */
    actual: any;
}
