// toastify.js wrapper

class NotificationToast {
    static #getStyle = () => {
        let SPACING = undefined
        let PADDING = undefined

        if (window.innerWidth < 2000) {
            SPACING = 15
            PADDING = 2
        } else {
            SPACING = 60
            PADDING = 4
        }

        const calcPaddingLeft = PADDING / 2 + 'vw'
        const calcLeft = (SPACING - PADDING) / 2 + 'vw'
        const calcWidth = 100 - (SPACING - PADDING) + 'vw'

        return {
            borderRadius: '5px',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',

            marginBottom: '2rem',
            paddingTop: '1rem',
            paddingBottom: '1rem',
            paddingLeft: calcPaddingLeft,
            paddRight: calcPaddingLeft,

            zIndex: '9999',
            position: 'fixed',
            top: '0',
            left: calcLeft,
            width: calcWidth,
        }
    }

    static show(msg, color) {
        const config = {
            duration: 1000,
            close: false,
            gravity: 'top',
            stopOnFocus: true,
        }

        Toastify({
            text: msg,
            style: {
                ...NotificationToast.#getStyle(),
                background: color,
            },
            ...config,
        }).showToast()
    }

    static info(msg) {
        const infoColor = '#b3cde0'
        NotificationToast.show(msg, infoColor)
    }

    static success(msg) {
        const successColor = '#ccebc5'
        NotificationToast.show('success: ' + msg, successColor)
    }

    static error(msg) {
        const errorColor = '#fbb4ae'
        NotificationToast.show('error: ' + msg, errorColor)
    }

    static default(msg) {
        const defaultColor = '#d9d9d9'
        NotificationToast.show(msg, defaultColor)
    }
}
