module.exports = {
    newToken: function () {
        return Math.random().toString(36).substr(2);
    }
};