export default class Promiseable<T> {
    //@ts-ignore
    protected promise: Promise<T>;

    then() {
        this.promise.then.apply(arguments);
    }

    catch() {
        this.promise.catch.apply(arguments);
    }
}