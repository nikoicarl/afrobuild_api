const { randomUUID, randomBytes, pbkdf2Sync } = require('crypto');

class GeneralFunction {
    ifEmpty(columns) {
        let checker = [];
        if (columns.length > 0) {
            columns.forEach(item => {
                if (item === '' || item === undefined || item === null || item.length < 1) {
                    checker.push('empty');
                }
            });
        }
        return checker;
    }

    checkEmpty(fieldName) {
        return fieldName === '' || fieldName === ' ' || fieldName === undefined || fieldName === null || fieldName.length < 1;
    }

    getFullYear() {
        return new Date().getUTCFullYear();
    }

    getTimeStamp() {
        let timestamp = Date.now().toString().slice(-8);
        return Number(this.shuffle(timestamp));
    }

    toUcwords(value) {
        return (value || '').replace(/\w+/g, a => a.charAt(0).toUpperCase() + a.slice(1).toLowerCase());
    }

    shuffle(value) {
        let a = value.toString().split(""), n = a.length;
        for (let i = n - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a.join("");
    }

    sumArray(value) {
        return value.reduce((a, b) => a + b, 0);
    }

    fullDate(value) {
        if (!value) return '';
        return new Date(value).toDateString();
    }

    fullDateDB(value) {
        if (!value) return '';
        let date = new Date(value);
        return `${date.getUTCFullYear()}-${this.pad(date.getUTCMonth() + 1)}-${this.pad(date.getUTCDate())}`;
    }

    fullDateDBNow() {
        let date = new Date();
        return `${date.getUTCFullYear()}-${this.pad(date.getUTCMonth() + 1)}-${this.pad(date.getUTCDate())}`;
    }

    fullDateTime(value) {
        if (!value) return '';
        let date = new Date(value);
        return `${date.toDateString()} ${this.pad(date.getUTCHours())}:${this.pad(date.getUTCMinutes())}:${this.pad(date.getUTCSeconds())}`;
    }

    fullTime(value) {
        if (!value) return '';
        return new Date(value).toLocaleTimeString();
    }

    dbDateFormat(value) {
        if (!value) return '';
        let date = new Date(value);
        return `${date.getUTCFullYear()}-${this.pad(date.getUTCMonth() + 1)}-${this.pad(date.getUTCDate())} ${this.pad(date.getUTCHours())}:${this.pad(date.getUTCMinutes())}:${this.pad(date.getUTCSeconds())}`;
    }

    getCurrentWeekRange() {
        let curr = new Date();
        let week = [];
        for (let i = 1; i <= 7; i++) {
            let first = curr.getDate() - curr.getDay() + i;
            let day = new Date(curr.setDate(first)).toISOString().slice(0, 10);
            week.push(day);
        }
        return [week[0], week[6]];
    }

    getDateTime() {
        let date = new Date();
        return `${date.getUTCFullYear()}-${this.pad(date.getUTCMonth() + 1)}-${this.pad(date.getUTCDate())} ${this.pad(date.getUTCHours())}:${this.pad(date.getUTCMinutes())}:${this.pad(date.getUTCSeconds())}`;
    }

    getTimeNow() {
        let date = new Date();
        return `${this.pad(date.getUTCHours())}:${this.pad(date.getUTCMinutes())}:${this.pad(date.getUTCSeconds())}`;
    }

    getDate() {
        let date = new Date();
        return `${date.getUTCFullYear()}-${this.pad(date.getUTCMonth() + 1)}-${this.pad(date.getUTCDate())}`;
    }

    getDateParam(param) {
        let date = new Date(param);
        return `${date.getUTCFullYear()}-${this.pad(date.getUTCMonth() + 1)}-${this.pad(date.getUTCDate())}`;
    }

    getMonth() {
        let date = new Date();
        return `${date.getUTCFullYear()}-${this.pad(date.getUTCMonth() + 1)}`;
    }

    formatNumber(num) {
        return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

    getMonthString(month) {
        const names = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return names[Number(month) - 1] || '';
    }

    uuid() {
        return randomUUID();
    }

    pad(num) {
        return String(num).padStart(2, '0');
    }


    /**
     * Hash password using pbkdf2Sync with SHA512
     * Returns: salt + ':' + hashed password (hex)
     */
    hashPassword(password) {
        const salt = randomBytes(16).toString('hex');
        const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
        return `${salt}:${hash}`;
    }

    /**
     * Verify password by hashing input and comparing with stored hash
     */
    verifyPassword(password, storedHash) {
        const [salt, originalHash] = storedHash.split(':');
        const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
        return hash === originalHash;
    }
}

module.exports = GeneralFunction;
