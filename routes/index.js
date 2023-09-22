const routes = require('express').Router();
const baseController = require('../controllers');

routes.get('/', baseController.getPersonName);
routes.get('/contacts', baseController.getContacts);
routes.get('/contact/:id', baseController.getContactById);


module.exports = routes;