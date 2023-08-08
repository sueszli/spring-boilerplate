// utility functions

const assert = (condition) => {
    if (!condition) {
        console.error('assertion failed')
        document.body.innerHTML = ''
        while (true) {
            alert('system in unstable state, please refresh page - if problem persists, contact support')
        }
    }
}

const deepEquals = (x, y) => {
    const ok = Object.keys
    const tx = typeof x
    const ty = typeof y
    return x && y && tx === 'object' && tx === ty ? ok(x).length === ok(y).length && ok(x).every((key) => deepEquals(x[key], y[key])) : x === y
}
