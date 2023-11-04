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

routes.post('/sendOpinion', baseController.putNewOpinion);
routes.put('/sendProduct', upload.none(), baseController.putNewProduct);
routes.put('/sendProductSoldInformation', upload.none(), baseController.putNewProductSold);

routes.post('/updateProduct', baseController.updateProduct);
routes.post('/updateProductSold', baseController.updateProductSold);
routes.post('/updateOwnerInfo', baseController.updateOwnerInfo);

routes.delete('/deleteOpinion', upload.none(), baseController.deleteOpinion)
routes.delete('/deleteProduct', upload.none(), baseController.deleteProduct)
routes.delete('/deleteProductSold', upload.none(), baseController.deleteProductSold)


module.exports = routes;