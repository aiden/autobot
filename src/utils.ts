export function once<T extends Function>(func: T): T {
    let ran = false;
    let memo = undefined;
    return function() {
        if (ran) return memo;
        ran = true;
        memo = func.apply(this, arguments);
        func = null;
        return memo;
    } as any;
}
