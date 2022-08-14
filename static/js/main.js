// Main function
$(document).on('pagecreate', '#main', function() {
    // Use exports from locally defined module
    let keysController = new gauth.KeysController();
    keysController.init();
});
