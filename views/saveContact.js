document.getElementById('infoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var formData = new FormData(this);
    var contact = {};
    formData.forEach(function(value, key){
        contact[key] = value;
    });
    var contactInfo = JSON.stringify(contact);
    $.ajax({
        url: 'http://localhost:3000/saveContacts',
        type: 'POST',
        contentType: 'application/json',
        data: contactInfo,
        success: function(data){
            console.log('Success:', data);
        },
        error: function(error){
            console.error('Error:', error);
        }
    });
});