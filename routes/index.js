const routes = require('express').Router();
const baseController = require('../controllers');

routes.get('/', baseController.getPersonName);

module.exports = routes;