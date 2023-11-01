const routes = require('express').Router();
const baseController = require('../controllers');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

routes.get('/ownerInfo/:token', baseController.getOwnerInfo);
routes.get('/opinions', baseController.getOpinions);
routes.get('/getOpinion/:id', baseController.getOpinionsById);
routes.get('/products', baseController.getAllProducts);
routes.get('/getProduct/:id', baseController.getProductById);
routes.get('/productsSold', baseController.getAllProductsSold);
routes.get('/getProductSold/:id', baseController.getProductSoldById);

routes.post('/sendOpinion', upload.none(), baseController.putNewOpinion);
routes.post('/sendProduct', upload.none(), baseController.putNewProduct);


module.exports = routes;