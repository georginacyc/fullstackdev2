$('#staffUpload').on('change', function() {
    let image = $('#staffUpload')[0].files[0];
    let formdata = new FormData();
    formdata.append('staffUpload', image);
    $.ajax({
        url: '/staff/admin/upload',
        type: 'POST',
        data: formdata,
        contentType: false,
        processData: false,
        'success': (data) => {
            $('#preview').attr('src', data.file);
        }
    })
})