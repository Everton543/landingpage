const routes = require('express').Router();
const baseController = require('../controllers');

routes.get('/', baseController.getPersonName);
routes.get('/contacts', baseController.getContacts);
routes.get('/contact/:id', baseController.getContactById);
routes.put('/contact/:id', baseController.updateContact);
routes.delete('/deleteContact/:id', baseController.deleteContact);
routes.post('/saveContacts', baseController.saveContact);
routes.get('/saveContacts', baseController.displaySaveContactForm);

module.exports = routes;