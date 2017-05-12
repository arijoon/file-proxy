$(document).ready(() => {
    $('.remover').each((i, v) => {
        var self = $(v);
        self.on('click', (event) => {
            var filename = self.data('target');

            window.open(`/remove?name=${encodeURIComponent(filename)}&key=${encodeURIComponent($('#key').val())}`);
        });
    });
});
