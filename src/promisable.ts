export default class Promisable<T> {
    // @ts-ignore
    protected promise: Promise<T>;

    get then() {
        return this.promise.then.bind(this.promise);
    }

    get catch() {
        return this.promise.catch.bind(this.promise);
    }
}
